import PolicySidebar from '@/components/Policy/Sidebar';
import ReturnAccordion from '@/components/Policy/ReturnAccordion';

export const metadata = { title: 'Return & Replacement Policy – Budget Friendly' };

export default function ReturnsPage() {
  return (
    <main className="max-w-7xl mx-auto px-4 py-16 grid grid-cols-1 md:grid-cols-4 gap-8">
      <aside className="md:col-span-1">
        <PolicySidebar />
      </aside>
      <div className="md:col-span-3 space-y-6 text-gray-600">
        <h1 className="text-3xl font-bold mb-6">Return and Replacement</h1>
        <ReturnAccordion />
      </div>
    </main>
  );
}