import Home from "@/components/home/Home";
import { getStoreName } from "@/lib/storeMeta";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://yourhaat.com';

export async function generateMetadata() {
  const storeName = await getStoreName();
  return {
    title: `${storeName} — Online Shopping Bangladesh | Skincare, Cosmetics & Electronics`,
    description: 'Shop skincare, cosmetics, electronics, and personal care products in Bangladesh. Authentic brands, best prices, free shipping on orders over ৳999. Fast delivery across Bangladesh.',
    alternates: { canonical: SITE_URL },
    openGraph: {
      title: `${storeName} — Online Shopping Bangladesh`,
      description: 'Authentic skincare, cosmetics, electronics & more. Free shipping on ৳999+. Fast delivery across Bangladesh.',
      url: SITE_URL,
      type: 'website',
    },
  };
}

export default function Page() {
  return <Home />;
}
