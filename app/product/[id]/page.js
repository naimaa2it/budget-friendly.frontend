import ProductPageClient from "./PageClient";

const API = process.env.NEXT_PUBLIC_API_URL || "https://api.pickob.com";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://pickob.com";

export async function generateStaticParams() {
  const params = [{ id: "__placeholder__" }];
  try {
    let page = 1;
    while (true) {
      const res = await fetch(
        `${API}/api/products?status=published&limit=500&page=${page}`,
        { cache: "force-cache" },
      );
      if (!res.ok) break;
      const { items = [], total = 0 } = await res.json();
      for (const p of items) params.push({ id: p._id });
      if (params.length - 1 >= total || items.length < 500) break;
      page++;
    }
  } catch {}
  return params;
}

// Shared build-time product fetch — used by both generateMetadata and the
// page body so a real product only hits the API once per static page.
async function fetchProduct(id) {
  if (id === "__placeholder__") return null;
  try {
    const res = await fetch(`${API}/api/products/${id}`, {
      cache: "force-cache",
    });
    if (!res.ok) return null;
    const { product } = await res.json();
    return product || null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  if (id === "__placeholder__") {
    return {
      title: "Product Details",
      description:
        "Browse gadgets and electronics at Pickob. View price, specifications, and availability.",
    };
  }
  try {
    const product = await fetchProduct(id);
    if (!product) throw new Error("not found");

    const title = product?.seo?.title || product?.title || "Product Details";
    const description =
      product?.seo?.description ||
      (typeof product?.description === "string"
        ? product.description.replace(/<[^>]*>/g, "").slice(0, 160)
        : "") ||
      `Buy ${product?.title} at Pickob. Best price, fast delivery across Bangladesh.`;
    const keywords = product?.seo?.keywords || [];
    const image = product?.images?.[0]?.url || `${SITE_URL}/mainLogo.png`;
    const productUrl = `${SITE_URL}/product/${id}`;

    return {
      title,
      description,
      keywords: keywords.join(", "),
      alternates: { canonical: productUrl },
      openGraph: {
        title,
        description,
        url: productUrl,
        type: "website",
        images: [{ url: image, width: 800, height: 800, alt: title }],
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: [image],
      },
    };
  } catch {
    return {
      title: "Product Details",
      description:
        "Browse gadgets and electronics at Pickob. View price, specifications, and availability.",
    };
  }
}

// Mirrors the related-products logic PageClient used to run client-side —
// duplicated here (rather than shared) since one runs at build time against
// `fetch`'s cache and the other runs in the browser.
async function fetchRelatedProducts(product, id) {
  const fetches = [];
  if (product.categoryId) {
    fetches.push(
      fetch(
        `${API}/api/products?categoryId=${product.categoryId}&limit=14`,
        { cache: "force-cache" },
      )
        .then((r) => (r.ok ? r.json() : { items: [] }))
        .then((d) => d.items || [])
        .catch(() => []),
    );
  }
  if (product.department) {
    fetches.push(
      fetch(
        `${API}/api/products?brand=${encodeURIComponent(product.department)}&limit=14`,
        { cache: "force-cache" },
      )
        .then((r) => (r.ok ? r.json() : { items: [] }))
        .then((d) => d.items || [])
        .catch(() => []),
    );
  }

  let related = [];
  if (fetches.length > 0) {
    const results = await Promise.all(fetches);
    const seen = new Set([String(id)]);
    for (const arr of results) {
      for (const p of arr) {
        const pid = String(p._id);
        if (!seen.has(pid)) {
          seen.add(pid);
          related.push(p);
        }
      }
    }
  }

  if (related.length === 0) {
    related = await fetch(`${API}/api/products?limit=14&sort=newest`, {
      cache: "force-cache",
    })
      .then((r) => (r.ok ? r.json() : { items: [] }))
      .then((d) => (d.items || []).filter((p) => String(p._id) !== String(id)))
      .catch(() => []);
  }

  return related.slice(0, 12);
}

export default async function Page({ params }) {
  const { id } = await params;
  const product = await fetchProduct(id);
  const related = product ? await fetchRelatedProducts(product, id) : [];

  return <ProductPageClient initialProduct={product} initialRelated={related} />;
}
