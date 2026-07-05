const API = process.env.NEXT_PUBLIC_API_URL || "https://api.pickob.com";

// Mirror the old server-side sharp step so stored files stay small.
const MAX_WIDTH = 1600;
const QUALITY = 0.75;

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

async function canvasToBlob(canvas) {
  // Prefer webp (smallest); fall back to jpeg if the browser can't encode webp.
  let blob = await new Promise((r) => canvas.toBlob(r, "image/webp", QUALITY));
  let type = "webp";
  if (!blob) {
    blob = await new Promise((r) => canvas.toBlob(r, "image/jpeg", QUALITY));
    type = "jpeg";
  }
  return blob ? { blob, type } : null;
}

// Resize + re-encode an image in the browser before upload. Returns a smaller
// File, or the original if compression isn't possible / wouldn't help.
// Non-images (e.g. video) are returned untouched so they upload as-is.
async function compressImage(file) {
  // Skip non-images and gifs (canvas would drop animation).
  if (!file.type.startsWith("image/") || file.type === "image/gif") return file;

  let bitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    return file; // couldn't decode — send original
  }

  const scale = Math.min(1, MAX_WIDTH / bitmap.width);
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

  const out = await canvasToBlob(canvas);
  // Keep the original if encoding failed or the result isn't actually smaller.
  if (!out || out.blob.size >= file.size) return file;

  const baseName = file.name.replace(/\.[^.]+$/, "") || "image";
  return new File([out.blob], `${baseName}.${out.type === "webp" ? "webp" : "jpg"}`, {
    type: out.blob.type,
  });
}

// Upload directly from the browser to Cloudinary using a backend-signed request.
// The file bytes never pass through our own backend, so no server/reverse-proxy
// request-body size limit applies (anything up to our 10MB limit uploads
// reliably). Images are compressed first so the stored file stays small.
//
// `options.signPath` selects which backend endpoint signs the request:
//   - "/api/admin/upload/sign" (default) — admin-only, any folder
//   - "/api/user/upload/sign"            — logged-in users (reviews/avatars)
export async function uploadImageDirect(file, folder = "Pickob/products", options = {}) {
  assertUploadSize(file);
  const { signPath = "/api/admin/upload/sign" } = options;

  const optimized = await compressImage(file);

  const signResp = await fetch(
    `${API}${signPath}?folder=${encodeURIComponent(folder)}`,
    { credentials: "include" },
  );
  if (!signResp.ok) {
    const err = await signResp.json().catch(() => ({}));
    throw new Error(err.error || "Failed to get upload signature");
  }
  const {
    signature,
    timestamp,
    cloudName,
    apiKey,
    folder: signedFolder,
  } = await signResp.json();

  const fd = new FormData();
  fd.append("file", optimized);
  fd.append("api_key", apiKey);
  fd.append("timestamp", String(timestamp));
  fd.append("signature", signature);
  fd.append("folder", signedFolder);

  // Pick the endpoint by type so the image path stays byte-identical to before
  // (image/upload); only video uses the video endpoint.
  const isVideo = String(optimized.type || file.type || "").startsWith("video/");
  const resourceType = isVideo ? "video" : "image";

  const resp = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`,
    { method: "POST", body: fd },
  );
  const data = await resp.json();
  if (data.error)
    throw new Error(data.error.message || "Cloudinary upload failed");

  return {
    public_id: data.public_id,
    url: data.secure_url || data.url,
    width: data.width,
    height: data.height,
    format: data.format,
    duration: data.duration,
    resourceType: data.resource_type,
  };
}

// Drop-in replacement for the old `POST /api/admin/upload` fetch calls: returns
// the same `{ asset }` shape the backend used to return, but uploads straight
// to Cloudinary so the file never hits our backend's request-body size limit.
export async function uploadAdminImage(file, folder = "Pickob/products") {
  const asset = await uploadImageDirect(file, folder);
  return { asset };
}

// Upload for logged-in (non-admin) users — reviews and profile avatars. Folder
// is restricted server-side by the /api/user/upload/sign endpoint.
export async function uploadUserImage(file, folder = "Pickob/profiles") {
  return uploadImageDirect(file, folder, { signPath: "/api/user/upload/sign" });
}
