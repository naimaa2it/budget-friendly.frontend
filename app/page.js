import Home from "@/components/home/Home";
import { getStoreName } from "@/lib/storeMeta";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://smartproductbuy.com";

export async function generateMetadata() {
  const storeName = await getStoreName();
  return {
    title: `${storeName} — Gadgets & Electronics Online Shop in Bangladesh`,
    description:
      "Shop the latest gadgets, electronics, and smart accessories in Bangladesh. Authentic brands, best prices, free shipping on orders over ৳999. Fast delivery nationwide.",
    alternates: { canonical: SITE_URL },
    openGraph: {
      title: `${storeName} — Gadgets & Electronics Online Shop in Bangladesh`,
      description:
        "Authentic gadgets, electronics & smart accessories. Free shipping on ৳999+. Fast delivery across Bangladesh.",
      url: SITE_URL,
      type: "website",
    },
  };
}

export default function Page() {
  return <Home />;
}
