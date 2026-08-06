const API = process.env.NEXT_PUBLIC_API_URL || "https://api.pickob.com";

let _cache = null;
let _cacheTime = 0;

// Server-side fetch of the full category tree, shared (with a short cache)
// across any build-time callers — RootLayout seeds CategoryContext with this
// so nav/category pages never render against an empty categoriesMap while
// the client-side fetch is still in flight.
export async function getCategoriesTree() {
  const now = Date.now();
  if (_cache && now - _cacheTime < 60000) return _cache;
  try {
    const res = await fetch(`${API}/api/products/categories`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) throw new Error("failed to fetch categories");
    const data = await res.json();
    const categories = data.categories || [];
    _cache = categories;
    _cacheTime = now;
    return categories;
  } catch {
    return _cache || [];
  }
}
