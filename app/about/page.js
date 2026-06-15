import PolicySidebar from '@/components/Policy/Sidebar';
import { siteTitle, getStoreName } from '@/lib/storeMeta';

export async function generateMetadata() {
  const [title, storeName] = await Promise.all([siteTitle('About Us'), getStoreName()]);
  return {
    title,
    description: `${storeName} brings you curated skincare, cosmetics, and personal care products with fast shipping across Bangladesh.`,
    openGraph: {
      title: `About ${storeName} — Online Shopping Bangladesh`,
      description: `Learn about ${storeName} — your one-stop destination for authentic beauty & skincare in Bangladesh.`,
      type: 'website',
    },
  };
}

export default async function AboutPage() {
  const storeName = await getStoreName();
  return (
    <main className="max-w-7xl mx-auto px-4 py-16 grid grid-cols-1 md:grid-cols-4 gap-8">
      <aside className="md:col-span-1">
        <PolicySidebar />
      </aside>
      <div className="md:col-span-3">
      <h1 className="text-3xl font-bold mb-6">About {storeName}</h1>
      <p className="text-gray-600 mb-4">
        {storeName} brings you curated beauty and skincare products with fast shipping
        and reliable customer service. We believe everyone deserves access to
        quality products at budget-friendly prices.
      </p>
      <p className="text-gray-600">
        Founded with a passion for beauty and wellness, {storeName} is your one-stop
        destination for cosmetics, skincare, and personal care essentials.
      </p>
      </div>
    </main>
  );
}
