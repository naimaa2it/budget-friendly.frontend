const API = process.env.NEXT_PUBLIC_API_URL || "https://api.pickob.com";
const PRODUCTS_PER_PAGE = 20;

function flattenCategories(cats) {
  const result = [];
  const walk = (nodes) => {
    for (const c of nodes) {
      if (c.slug) result.push(c);
      if (c.children?.length) walk(c.children);
    }
  };
  walk(cats || []);
  return result;
}

function collectDescendantIds(node) {
  let ids = [String(node._id)];
  for (const child of node.children || []) {
    ids = ids.concat(collectDescendantIds(child));
  }
  return ids;
}

// Build-time equivalent of what CategoryPageClient fetches client-side on
// mount — the matched category, its immediate children (subcategory
// circles), the first page of products, and the best-selling strip — so the
// static HTML for a category page ships with real, crawlable content
// instead of an empty shell.
export async function fetchCategoryPageData(categories, slug, parentSlug = null) {
  const flat = flattenCategories(categories);
  const byId = {};
  flat.forEach((c) => {
    byId[c._id] = c;
  });

  const match = parentSlug
    ? flat.find((c) => c.slug === slug && byId[c.parent]?.slug === parentSlug)
    : flat.find((c) => c.slug === slug);

  if (!match) return null;

  const parentCategory = match.parent ? byId[match.parent] || null : null;
  const immediateChildren = match.children || [];
  const categoryIdsParam = collectDescendantIds(match).join(",");

  let bestSelling = [];
  let products = [];
  let totalProducts = 0;

  try {
    const bestRes = await fetch(
      `${API}/api/products?categoryId=${encodeURIComponent(categoryIdsParam)}&badge=best_seller&page=1&limit=50`,
      { cache: "force-cache" },
    );
    const bestJson = bestRes.ok ? await bestRes.json() : {};
    bestSelling = bestJson.items || [];
    if (bestSelling.length === 0) {
      const globalRes = await fetch(
        `${API}/api/products?badge=best_seller&page=1&limit=50`,
        { cache: "force-cache" },
      );
      const globalJson = globalRes.ok ? await globalRes.json() : {};
      bestSelling = globalJson.items || [];
    }
  } catch {
    bestSelling = [];
  }

  try {
    const params = new URLSearchParams({
      page: "1",
      limit: String(PRODUCTS_PER_PAGE),
      sort: "position",
      categoryId: categoryIdsParam,
    });
    const res = await fetch(`${API}/api/products?${params.toString()}`, {
      cache: "force-cache",
    });
    if (res.ok) {
      const json = await res.json();
      products = json.items || [];
      totalProducts = Number(json.total || 0);
    }
  } catch {
    products = [];
    totalProducts = 0;
  }

  return {
    category: match,
    parentCategory,
    immediateChildren,
    categoryIdsParam,
    products,
    totalProducts,
    bestSelling,
  };
}
