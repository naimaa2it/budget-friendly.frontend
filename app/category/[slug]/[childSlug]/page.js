import ChildCategoryPageWrapper from "./PageClient";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://pickob.com";

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

export async function generateStaticParams() {
  const params = [{ slug: "__placeholder__", childSlug: "__placeholder__" }];
  try {
    const res = await fetch(`${API}/api/products/categories`, {
      cache: "force-cache",
    });
    if (!res.ok) return params;
    const { categories = [] } = await res.json();

    const walkPairs = (nodes, parentSlug = null) => {
      for (const c of nodes) {
        if (parentSlug && c.slug) {
          params.push({ slug: parentSlug, childSlug: c.slug });
        }
        if (c.children?.length) walkPairs(c.children, c.slug);
      }
    };
    walkPairs(categories);
  } catch {}
  return params;
}

export async function generateMetadata({ params }) {
  const { slug, childSlug } = await params;
  if (childSlug === "__placeholder__") {
    return {
      title: "Shop by Category",
      description:
        "Browse gadgets and electronics by category at Pickob. Best prices, fast delivery across Bangladesh.",
    };
  }
  try {
    const res = await fetch(`${API}/api/products/categories`, {
      cache: "force-cache",
    });
    if (!res.ok) throw new Error("not found");
    const { categories = [] } = await res.json();
    const all = flattenCategories(categories);
    const category = all.find((c) => c.slug === childSlug);
    if (!category) throw new Error("not found");

    const title = `${category.name} — Gadgets & Electronics | Pickob`;
    const description =
      category.description ||
      `Browse ${category.name} at Pickob — gadgets and electronics with best prices and fast delivery across Bangladesh.`;
    const categoryUrl = `${SITE_URL}/category/${slug}/${childSlug}`;
    const image = category.images?.[0]?.url || `${SITE_URL}/mainLogo.png`;

    return {
      title,
      description,
      alternates: { canonical: categoryUrl },
      openGraph: {
        title,
        description,
        url: categoryUrl,
        type: "website",
        images: [{ url: image, width: 800, height: 600, alt: title }],
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
      title: "Shop by Category",
      description:
        "Browse gadgets and electronics by category at Pickob. Best prices, fast delivery across Bangladesh.",
    };
  }
}

export default function Page() {
  return <ChildCategoryPageWrapper />;
}
