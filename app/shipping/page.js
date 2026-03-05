export const metadata = { title: 'Shipping Policy – Budget Friendly' };

export default function ShippingPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold mb-6">Shipping Policy</h1>
      <div className="space-y-6 text-gray-600">
        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Processing Time</h2>
          <p>Orders are processed within 1–2 business days after payment confirmation.</p>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Delivery Time</h2>
          <p>Standard delivery takes 3–7 business days. Express delivery (1–2 days) is available at checkout.</p>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Shipping Charges</h2>
          <p>Free shipping on orders over ৳999. A flat ৳60 charge applies to orders below that threshold.</p>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Tracking</h2>
          <p>You will receive a tracking link via email once your order has been dispatched.</p>
        </section>
      </div>
    </main>
  );
}
