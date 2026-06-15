import PolicySidebar from '@/components/Policy/Sidebar';
import { siteTitle, getStoreName } from '@/lib/storeMeta';

export async function generateMetadata() {
  const [title, storeName] = await Promise.all([siteTitle('Terms & Conditions'), getStoreName()]);
  return {
    title,
    description: `Read ${storeName}'s terms and conditions governing the use of our online store, purchases, and services in Bangladesh.`,
  };
}

export default async function TermsPage() {
  const storeName = await getStoreName();
  return (
    <main className="max-w-7xl mx-auto px-4 py-16 grid grid-cols-1 md:grid-cols-4 gap-8">
      <aside className="md:col-span-1">
        <PolicySidebar />
      </aside>
      <div className="md:col-span-3 space-y-6 text-gray-600 text-sm leading-relaxed">
      <h1 className="text-3xl font-bold mb-6">Terms & Conditions</h1>
        <p>By using {storeName} you agree to these terms. Please read them carefully.</p>
        <section>
          <h2 className="text-base font-semibold text-gray-800 mb-1">Use of the Site</h2>
          <p>You must be at least 18 years old to make a purchase. You agree not to misuse the site or attempt to access it in an unauthorised manner.</p>
        </section>
        <section>
          <h2 className="text-base font-semibold text-gray-800 mb-1">Orders & Pricing</h2>
          <p>All prices are in BDT. We reserve the right to refuse or cancel orders at our discretion, including in the event of pricing errors.</p>
        </section>
        <section>
          <h2 className="text-base font-semibold text-gray-800 mb-1">Intellectual Property</h2>
          <p>All content on this site (logos, images, text) is owned by {storeName} and may not be reproduced without written permission.</p>
        </section>
        <section>
          <h2 className="text-base font-semibold text-gray-800 mb-1">Limitation of Liability</h2>
          <p>{storeName} is not liable for indirect or consequential damages arising from use of the site or products purchased.</p>
        </section>
      </div>
    </main>
  );
}
