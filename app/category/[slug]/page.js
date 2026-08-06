import CategoryPageWrapper from "./PageClient";
import { fetchCategoryPageData } from "@/lib/categoryPageData";

const API = process.env.NEXT_PUBLIC_API_URL || "https://api.pickob.com";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://pickob.com";

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
  const params = [{ slug: "__placeholder__" }];
  try {
    const res = await fetch(`${API}/api/products/categories`, {
      next: { revalidate: 30 },
    });
    if (!res.ok) return params;
    const { categories = [] } = await res.json();
    for (const c of flattenCategories(categories)) {
      params.push({ slug: c.slug });
    }
  } catch {}
  return params;
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  if (slug === "__placeholder__") {
    return {
      title: "Shop by Category",
      description:
        "Browse gadgets and electronics by category at Pickob. Best prices, fast delivery across Bangladesh.",
    };
  }
  try {
    const res = await fetch(`${API}/api/products/categories`, {
      next: { revalidate: 30 },
    });
    if (!res.ok) throw new Error("not found");
    const { categories = [] } = await res.json();
    const category = flattenCategories(categories).find((c) => c.slug === slug);
    if (!category) throw new Error("not found");

    const title = `${category.name} — Gadgets & Electronics | Pickob`;
    const description =
      category.description ||
      `Browse ${category.name} at Pickob — gadgets and electronics with best prices and fast delivery across Bangladesh.`;
    const categoryUrl = `${SITE_URL}/category/${slug}`;
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

export default async function Page({ params }) {
  const { slug } = await params;
  if (slug === "__placeholder__") {
    return <CategoryPageWrapper />;
  }

  try {
    const res = await fetch(`${API}/api/products/categories`, {
      next: { revalidate: 30 },
    });
    const { categories = [] } = res.ok ? await res.json() : {};
    const data = await fetchCategoryPageData(categories, slug);
    return (
      <CategoryPageWrapper
        initialCategory={data?.category}
        initialParentCategory={data?.parentCategory}
        initialImmediateChildren={data?.immediateChildren}
        initialCategoryIdsParam={data?.categoryIdsParam}
        initialProducts={data?.products}
        initialTotalProducts={data?.totalProducts}
        initialBestSelling={data?.bestSelling}
      />
    );
  } catch {
    return <CategoryPageWrapper />;
  }
}
