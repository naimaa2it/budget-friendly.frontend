const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

let _cache = null;
let _cacheTime = 0;

const DEFAULT_STORE_NAME = "SmartBuy BD";
const EMPTY_POLICY = { shipping: [], return: [], faq: [], privacy: [], terms: [] };

export async function getStoreName() {
  const now = Date.now();
  if (_cache && now - _cacheTime < 60000) return _cache;
  try {
    const r = await fetch(`${API}/api/admin/top-banner`, {
      next: { revalidate: 60 },
    });
    const d = await r.json();
    _cache = d.storeName || DEFAULT_STORE_NAME;
    _cacheTime = now;
    return _cache;
  } catch {
    return _cache || DEFAULT_STORE_NAME;
  }
}

export async function getPolicyContent() {
  try {
    const r = await fetch(`${API}/api/admin/top-banner`, {
      next: { revalidate: 60 },
    });
    const d = await r.json();
    return d.policyContent || EMPTY_POLICY;
  } catch {
    return EMPTY_POLICY;
  }
}

export async function siteTitle(page) {
  const name = await getStoreName();
  return page ? `${page} — ${name}` : name;
}
