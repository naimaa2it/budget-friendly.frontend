const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

let _cache = null;
let _cacheTime = 0;

export async function getStoreName() {
  const now = Date.now();
  if (_cache && now - _cacheTime < 60000) return _cache;
  try {
    const r = await fetch(`${API}/api/admin/top-banner`, {
      next: { revalidate: 60 },
    });
    const d = await r.json();
    _cache = d.storeName || "Store";
    _cacheTime = now;
    return _cache;
  } catch {
    return _cache || "Store";
  }
}

export async function siteTitle(page) {
  const name = await getStoreName();
  return page ? `${page} — ${name}` : name;
}
