const API = process.env.NEXT_PUBLIC_API_URL || "https://api.pickob.com";

// Mirror the old server-side sharp step so stored files stay small.
const MAX_WIDTH = 1600;
const QUALITY = 0.75;

// Homepage hero banners are stretched near full page width (and 2x on retina
// screens), so the default 1600px/75% cap looked visibly soft. Banners get a
// looser cap so the source stays sharp; still capped/compressed so a 20MB
// photo doesn't upload raw.
const BANNER_MAX_WIDTH = 2400;
const BANNER_QUALITY = 0.95;

// Single source of truth for the upload size limit. Anything up to this uploads
// freely with no restriction; anything larger is rejected before we hit the
// network. Keep this in sync with the backend multer `fileSize` limits.
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10MB

// Throws a clear (Bangla) error if the file is over the 10MB limit. Files at or
// under the limit pass silently — no restriction message is shown.
export function assertUploadSize(file) {
  if (file && file.size > MAX_UPLOAD_BYTES) {
    const mb = (file.size / 1024 / 1024).toFixed(1);
    throw new Error(
      `"${file.name}" সাইজ ${mb}MB — সর্বোচ্চ ১০MB পর্যন্ত আপলোড করা যাবে।`,
    );
  }
}

async function canvasToBlob(canvas, quality) {
  // Prefer webp (smallest); fall back to jpeg if the browser can't encode webp.
  let blob = await new Promise((r) => canvas.toBlob(r, "image/webp", quality));
  let type = "webp";
  if (!blob) {
    blob = await new Promise((r) => canvas.toBlob(r, "image/jpeg", quality));
    type = "jpeg";
  }
  return blob ? { blob, type } : null;
}

// Resize + re-encode an image in the browser before upload. Returns a smaller
// File, or the original if compression isn't possible / wouldn't help.
// Non-images (e.g. video) are returned untouched so they upload as-is.
async function compressImage(
  file,
  { maxWidth = MAX_WIDTH, quality = QUALITY } = {},
) {
  // Skip non-images and gifs (canvas would drop animation).
  if (!file.type.startsWith("image/") || file.type === "image/gif") return file;

  let bitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    return file; // couldn't decode — send original
  }

  const scale = Math.min(1, maxWidth / bitmap.width);
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close?.();
    return file;
  }
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close?.();

  const out = await canvasToBlob(canvas, quality);
  // Keep the original if encoding failed or the result isn't actually smaller.
  if (!out || out.blob.size >= file.size) return file;

  const baseName = file.name.replace(/\.[^.]+$/, "") || "image";
  return new File([out.blob], `${baseName}.${out.type === "webp" ? "webp" : "jpg"}`, {
    type: out.blob.type,
  });
}

// Upload from the browser to our own backend, which stores the file on the
// VPS's local disk under public/uploads (see lib/localUpload.js on the
// backend) and serves it back at /uploads. Images are compressed client-side
// first so the request body stays small.
//
// `options.endpoint` selects which backend route receives the file:
//   - "/api/admin/upload" (default) — admin-only, any folder
//   - "/api/user/upload"            — logged-in users (reviews/avatars)
export async function uploadImageDirect(file, folder = "Pickob/products", options = {}) {
  assertUploadSize(file);
  const { endpoint = "/api/admin/upload", maxWidth, quality } = options;

  const optimized = await compressImage(file, { maxWidth, quality });

  const fd = new FormData();
  fd.append("file", optimized);
  fd.append("folder", folder);

  const resp = await fetch(`${API}${endpoint}`, {
    method: "POST",
    credentials: "include",
    body: fd,
  });
  // A reverse-proxy body-size limit (or any non-JSON failure) returns an HTML
  // error page rather than JSON — fall back to a clear message instead of a
  // raw "Unexpected token <" parse error.
  const data = await resp.json().catch(() => ({}));
  if (!resp.ok || data.error) {
    throw new Error(
      data.error || (resp.status === 413 ? "File is too large." : "Upload failed"),
    );
  }

  return data.asset;
}

// Drop-in replacement for the old `POST /api/admin/upload` fetch calls: returns
// the same `{ asset }` shape the backend has always returned.
export async function uploadAdminImage(file, folder = "Pickob/products", options = {}) {
  const asset = await uploadImageDirect(file, folder, options);
  return { asset };
}

// Homepage hero banners need a sharper source (see BANNER_MAX_WIDTH/QUALITY
// above) since they're displayed stretched near full page width.
export async function uploadBannerImage(file, folder = "Pickob/banners") {
  return uploadAdminImage(file, folder, {
    maxWidth: BANNER_MAX_WIDTH,
    quality: BANNER_QUALITY,
  });
}

// Upload for logged-in (non-admin) users — reviews and profile avatars. Folder
// is restricted server-side by the /api/user/upload endpoint.
export async function uploadUserImage(file, folder = "Pickob/profiles") {
  return uploadImageDirect(file, folder, { endpoint: "/api/user/upload" });
}
