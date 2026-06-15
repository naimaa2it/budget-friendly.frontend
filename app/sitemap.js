export const dynamic = 'force-static';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://yourhaat.com';

// Flatten a category tree into a flat array
function flattenCategories(cats) {
  const result = [];
  const walk = (nodes) => {
    for (const c of nodes) {
      if (c.slug) result.push(c);
      if (c.children?.length) walk(c.children);
    }
  };
  walk(cats);
  return result;
}

// Fetch all published products (paginated)
async function fetchAllProductIds() {
  const ids = [];
  let page = 1;
  const PER_PAGE = 500;

  while (true) {
    try {
      const res = await fetch(
        `${API}/api/products?status=published&limit=${PER_PAGE}&page=${page}`,
        { cache: 'force-cache' },
      );
      if (!res.ok) break;
      const { items = [], total = 0 } = await res.json();
      for (const p of items) {
        ids.push({ id: p._id, updatedAt: p.updatedAt });
      }
      if (ids.length >= total || items.length < PER_PAGE) break;
      page++;
    } catch {
      break;
    }
  }
  return ids;
}

export default async function sitemap() {
  // Static public routes
  const staticRoutes = [
    { url: SITE_URL,                   changeFrequency: 'daily',   priority: 1.0 },
    { url: `${SITE_URL}/blog`,         changeFrequency: 'daily',   priority: 0.8 },
    { url: `${SITE_URL}/about`,        changeFrequency: 'monthly', priority: 0.5 },
    { url: `${SITE_URL}/contact`,      changeFrequency: 'monthly', priority: 0.5 },
    { url: `${SITE_URL}/faq`,          changeFrequency: 'monthly', priority: 0.5 },
    { url: `${SITE_URL}/shipping`,     changeFrequency: 'monthly', priority: 0.4 },
    { url: `${SITE_URL}/returns`,      changeFrequency: 'monthly', priority: 0.4 },
    { url: `${SITE_URL}/privacy`,      changeFrequency: 'yearly',  priority: 0.3 },
    { url: `${SITE_URL}/terms`,        changeFrequency: 'yearly',  priority: 0.3 },
  ].map(r => ({ ...r, lastModified: new Date() }));

  let productRoutes = [];
  let categoryRoutes = [];
  let blogRoutes = [];

  try {
    const [products, catRes, blogRes] = await Promise.all([
      fetchAllProductIds(),
      fetch(`${API}/api/products/categories`, { cache: 'force-cache' }),
      fetch(`${API}/api/blog?limit=500&status=published`, { cache: 'force-cache' }),
    ]);

    productRoutes = products.map(p => ({
      url: `${SITE_URL}/product/${p.id}`,
      lastModified: p.updatedAt ? new Date(p.updatedAt) : new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    }));

    if (catRes.ok) {
      const { categories = [] } = await catRes.json();
      categoryRoutes = flattenCategories(categories).map(c => ({
        url: `${SITE_URL}/category/${c.slug}`,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 0.7,
      }));
    }

    if (blogRes.ok) {
      const data = await blogRes.json();
      const posts = data.posts || data.items || [];
      blogRoutes = posts
        .filter(p => p.slug)
        .map(p => ({
          url: `${SITE_URL}/blog/${p.slug}`,
          lastModified: p.updatedAt ? new Date(p.updatedAt) : new Date(),
          changeFrequency: 'weekly',
          priority: 0.6,
        }));
    }
  } catch {
    // Gracefully fall back to static routes if API is unavailable during build
  }

  return [...staticRoutes, ...categoryRoutes, ...productRoutes, ...blogRoutes];
}
