export const metadata = { title: 'FAQ – YourHaat' };

const faqs = [
  { q: 'How do I track my order?', a: 'Once your order ships, you will receive a tracking link by email. You can also check your order status in your account dashboard.' },
  { q: 'Can I change or cancel my order?', a: 'Orders can be changed or cancelled within 1 hour of placement. After that, the order enters processing and cannot be modified.' },
  { q: 'Are the products authentic?', a: 'Yes. YourHaat only sources products from authorised distributors and verified suppliers.' },
  { q: 'What payment methods are accepted?', a: 'We accept Visa, Mastercard, Bkash, Nagad, and cash on delivery.' },
  { q: 'Do you ship outside Bangladesh?', a: 'Currently we only ship within Bangladesh. International shipping is planned for the future.' },
];

export default function FaqPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold mb-8">Frequently Asked Questions</h1>
      <div className="space-y-6">
        {faqs.map((item, i) => (
          <div key={i} className="border-b border-gray-100 pb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-1">{item.q}</h2>
            <p className="text-gray-600">{item.a}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
