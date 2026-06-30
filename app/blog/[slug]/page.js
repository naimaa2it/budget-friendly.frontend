import BlogPageClient from "./PageClient";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://smartproductbuy.com";

export async function generateStaticParams() {
  const params = [{ slug: "__placeholder__" }];
  try {
    const res = await fetch(`${API}/api/blog?limit=500&status=published`, {
      cache: "force-cache",
    });
    if (!res.ok) return params;
    const data = await res.json();
    const posts = data.posts || data.items || [];
    for (const p of posts) {
      if (p.slug) params.push({ slug: p.slug });
    }
  } catch {}
  return params;
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  if (slug === "__placeholder__") {
    return {
      title: "Blog Article",
      description:
        "Read gadget guides, tech tips, and product reviews on the Pickob blog.",
    };
  }
  try {
    const res = await fetch(`${API}/api/blog/${slug}`, {
      cache: "force-cache",
    });
    if (!res.ok) throw new Error("not found");
    const { post } = await res.json();

    const title = post?.seo?.title || post?.title || "Blog Article";
    const description =
      post?.seo?.description ||
      post?.excerpt ||
      `Read ${post?.title} on the Pickob blog.`;
    const keywords = post?.seo?.keywords || post?.tags || [];
    const image =
      post?.featuredImage?.url || post?.thumbnail || `${SITE_URL}/mainLogo.png`;
    const blogUrl = `${SITE_URL}/blog/${slug}`;

    return {
      title,
      description,
      keywords: Array.isArray(keywords) ? keywords.join(", ") : keywords,
      alternates: { canonical: blogUrl },
      openGraph: {
        title,
        description,
        url: blogUrl,
        type: "article",
        images: [{ url: image, width: 1200, height: 630, alt: title }],
        publishedTime: post?.publishedAt || post?.publishDate,
        modifiedTime: post?.updatedAt,
        authors: ["Pickob"],
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
      title: "Blog Article",
      description:
        "Read gadget guides, tech tips, and product reviews on the Pickob blog.",
    };
  }
}

export default function Page() {
  return <BlogPageClient />;
}
