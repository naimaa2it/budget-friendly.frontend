import PolicySidebar from '@/components/Policy/Sidebar';
import ShippingAccordion from '@/components/Policy/ShippingAccordion';

import { siteTitle, getStoreName } from '@/lib/storeMeta';

export async function generateMetadata() {
  const [title, storeName] = await Promise.all([siteTitle('Shipping Policy'), getStoreName()]);
  return {
    title,
    description: `Learn about ${storeName}'s delivery times, shipping charges, and areas we serve across Bangladesh.`,
  };
}

export default function ShippingPage() {
  return (
    <main className="max-w-7xl mx-auto px-4 py-16 grid grid-cols-1 md:grid-cols-4 gap-8">
      <aside className="md:col-span-1">
        <PolicySidebar />
      </aside>
      <div className="md:col-span-3">
        <h1 className="text-3xl font-bold mb-6">Shipping Policy</h1>
        <ShippingAccordion />


      </div>
    </main>
  );
}
