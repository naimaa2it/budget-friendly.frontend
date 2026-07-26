const API = process.env.NEXT_PUBLIC_API_URL || "https://api.pickob.com";

let _cache = null;
let _cacheTime = 0;

const DEFAULT_STORE_NAME = "Pickob";
const EMPTY_POLICY = {
  shipping: [],
  return: [],
  faq: [],
  privacy: [],
  terms: [],
  about: [],
};
const EMPTY_FOOTER_LINKS = { quickLinks: [], customerService: [] };

// All of getStoreName/getPolicyContent/getFavicon/getStoreSettings need data
// from the same /api/admin/top-banner response — share one cached fetch so a
// page that calls several of them (e.g. RootLayout's generateMetadata +
// RootLayout body) doesn't hit the API multiple times per build/request.
async function fetchTopBanner() {
  const now = Date.now();
  if (_cache && now - _cacheTime < 60000) return _cache;
  try {
    const r = await fetch(`${API}/api/admin/top-banner`, {
      next: { revalidate: 60 },
    });
    const d = await r.json();
    _cache = d;
    _cacheTime = now;
    return d;
  } catch {
    return _cache || {};
  }
}

export async function getStoreName() {
  const d = await fetchTopBanner();
  return d.storeName || DEFAULT_STORE_NAME;
}

export async function getPolicyContent() {
  const d = await fetchTopBanner();
  return d.policyContent || EMPTY_POLICY;
}

export async function getFavicon() {
  const d = await fetchTopBanner();
  return d.favicon?.url || null;
}

// Powers StoreSettingsContext's initial (SSR/build-time) value, so the header
// logo and footer contact info are present in the static HTML instead of
// being blank until the client-side fetch in StoreSettingsProvider resolves.
export async function getStoreSettings() {
  const d = await fetchTopBanner();
  return {
    storeName: d.storeName || DEFAULT_STORE_NAME,
    logoUrl: d.websiteLogo?.url || "",
    footerInfo: d.footerInfo || { phone: "", email: "", address: "" },
    contactInfo: d.contactInfo || { phone: "", email: "", address: "" },
    supportInfo: d.supportInfo || { phone: "", email: "" },
    socialLinks: d.socialLinks || {},
    policyContent: d.policyContent || EMPTY_POLICY,
    footerLinks: d.footerLinks || EMPTY_FOOTER_LINKS,
  };
}

export async function siteTitle(page) {
  const name = await getStoreName();
  return page ? `${page} — ${name}` : name;
}
