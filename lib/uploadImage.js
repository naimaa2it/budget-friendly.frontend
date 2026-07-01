const API = process.env.NEXT_PUBLIC_API_URL || "https://api.pickob.com";

// Mirror the old server-side sharp step so stored files stay small.
const MAX_WIDTH = 1600;
const QUALITY = 0.75;

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
// This bypasses Vercel's 4.5MB serverless body limit and compresses first so the
// uploaded/stored file stays small.
export async function uploadImageDirect(file, folder = "Pickob/products") {
  const optimized = await compressImage(file);

  const signResp = await fetch(
    `${API}/api/admin/upload/sign?folder=${encodeURIComponent(folder)}`,
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

  const resp = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
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
  };
}
