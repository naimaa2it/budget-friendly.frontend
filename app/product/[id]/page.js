import ProductPageClient from "./PageClient";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://smartproductbuy.com";

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
    const res = await fetch(`${API}/api/products/${id}`, {
      cache: "force-cache",
    });
    if (!res.ok) throw new Error("not found");
    const { product } = await res.json();

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

export default function Page() {
  return <ProductPageClient />;
}
