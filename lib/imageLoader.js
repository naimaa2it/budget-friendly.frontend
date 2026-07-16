import { cdnImageUrl } from "./cdnImage";

// Global next/image loader (wired up in next.config.mjs). Cloudinary URLs get
// f_auto/q_auto plus a width cap; every other src passes through untouched,
// matching the old `unoptimized: true` behaviour.
export default function imageLoader({ src, width }) {
  return cdnImageUrl(src, width);
}
