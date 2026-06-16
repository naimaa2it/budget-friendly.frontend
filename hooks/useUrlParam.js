"use client";

import { usePathname } from "next/navigation";

// The static export only ever pre-builds a "__placeholder__" shell for
// dynamic routes (see public/.htaccess) — anything created after the build
// (a new product, order, category, admin, etc.) is served through that
// shell while the browser keeps the real URL. useParams() / the `params`
// prop reflect the build-time placeholder value in that case, not the real
// one, so the dynamic segment must be read from the live URL instead.
//
// `fromEnd` is the segment's distance from the end of the path: 0 for the
// last segment (e.g. /category/[slug]), 1 for the one before a trailing
// static segment (e.g. /orders/[id]/invoice).
export function useUrlParam(fromEnd = 0) {
  const pathname = usePathname() || "";
  const segments = pathname.split("/").filter(Boolean);
  const raw = segments[segments.length - 1 - fromEnd];
  return raw ? decodeURIComponent(raw) : "";
}
