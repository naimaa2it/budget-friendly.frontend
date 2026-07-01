const API = process.env.NEXT_PUBLIC_API_URL || "https://api.pickob.com";

// Upload directly from the browser to Cloudinary using a backend-signed request.
// This bypasses Vercel's 4.5MB serverless body limit entirely.
export async function uploadImageDirect(file, folder = "Pickob/products") {
  const signResp = await fetch(
    `${API}/api/admin/upload/sign?folder=${encodeURIComponent(folder)}`,
    { credentials: "include" },
  );
  if (!signResp.ok) {
    const err = await signResp.json().catch(() => ({}));
    throw new Error(err.error || "Failed to get upload signature");
  }
  const { signature, timestamp, cloudName, apiKey, folder: signedFolder } =
    await signResp.json();

  const fd = new FormData();
  fd.append("file", file);
  fd.append("api_key", apiKey);
  fd.append("timestamp", String(timestamp));
  fd.append("signature", signature);
  fd.append("folder", signedFolder);

  const resp = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    { method: "POST", body: fd },
  );
  const data = await resp.json();
  if (data.error) throw new Error(data.error.message || "Cloudinary upload failed");

  return {
    public_id: data.public_id,
    url: data.secure_url || data.url,
    width: data.width,
    height: data.height,
    format: data.format,
  };
}
