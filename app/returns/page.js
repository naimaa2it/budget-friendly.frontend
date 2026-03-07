import PolicySidebar from '@/components/Policy/Sidebar';

export const metadata = { title: 'Return & Replacement Policy – Budget Friendly' };

export default function ReturnsPage() {
  return (
    <main className="max-w-7xl mx-auto px-4 py-16 grid grid-cols-1 md:grid-cols-4 gap-8">
      <aside className="md:col-span-1">
        <PolicySidebar />
      </aside>
      <div className="md:col-span-3 space-y-6 text-gray-600">
        <h1 className="text-3xl font-bold mb-6">Return & Replacement Policy</h1>
        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Overview</h2>
          <p>We offer easy returns and replacements within 7 days of delivery for defective or incorrect items. Please retain your invoice.</p>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Conditions</h2>
          <p>Products must be returned in original packaging, unused and with all tags. Certain items like personal care products may not be eligible for return.</p>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Process</h2>
          <p>Contact customer support to initiate a return. We will arrange pickup and process your refund or replacement within 3–5 business days.</p>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Refunds</h2>
          <p>Refunds are issued to the original payment method. It may take 5–7 business days to reflect in your account.</p>
        </section>
      </div>
    </main>
  );
}