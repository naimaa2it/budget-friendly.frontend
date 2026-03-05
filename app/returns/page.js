export const metadata = { title: 'Returns & Refunds – Budget Friendly' };

export default function ReturnsPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold mb-6">Returns & Refunds</h1>
      <div className="space-y-6 text-gray-600">
        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Return Window</h2>
          <p>You may return eligible items within 7 days of delivery.</p>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Conditions</h2>
          <p>Items must be unused, unopened, and in original packaging. Cosmetics and personal care items are non-returnable once opened for hygiene reasons.</p>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">How to Return</h2>
          <p>Contact our support team with your order number and reason for return. We will arrange a pickup or provide a drop-off address.</p>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Refunds</h2>
          <p>Approved refunds are processed within 5–7 business days to the original payment method.</p>
        </section>
      </div>
    </main>
  );
}
