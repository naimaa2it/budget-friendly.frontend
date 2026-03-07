import PolicySidebar from '@/components/Policy/Sidebar';

export const metadata = { title: 'Shipping Policy – Budget Friendly' };

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
