// Uploaded images are stored on Cloudinary as WebP (see lib/uploadImage.js),
// which older browsers (Safari on macOS < Big Sur / iOS < 14, old Android)
// cannot decode — they showed broken images. Injecting `f_auto` makes
// Cloudinary pick the best format per browser (WebP/AVIF for modern ones,
// JPEG/PNG for older ones), fixing display everywhere without re-uploading.
const MARKER = "/image/upload/";

export function cdnImageUrl(url, width) {
  if (typeof url !== "string" || !url.includes("res.cloudinary.com")) {
    return url;
  }
  const i = url.indexOf(MARKER);
  if (i === -1 || url.includes("f_auto")) return url;

  const transforms = width
    ? `f_auto,q_auto,c_limit,w_${width}`
    : "f_auto,q_auto";
  return (
    url.slice(0, i + MARKER.length) + transforms + "/" + url.slice(i + MARKER.length)
  );
}
