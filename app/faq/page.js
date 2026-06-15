import PolicySidebar from '@/components/Policy/Sidebar';
import { siteTitle, getStoreName } from '@/lib/storeMeta';

export async function generateMetadata() {
  const [title, storeName] = await Promise.all([siteTitle('Frequently Asked Questions'), getStoreName()]);
  return {
    title,
    description: `Get answers to common questions about ordering, shipping, payments, returns, and product authenticity at ${storeName} Bangladesh.`,
    alternates: { canonical: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://yourhaat.com'}/faq` },
  };
}

const faqs = [
  { q: 'How do I track my order?', a: 'Once your order ships, you will receive a tracking link by email. You can also check your order status in your account dashboard.' },
  { q: 'Can I change or cancel my order?', a: 'Orders can be changed or cancelled within 1 hour of placement. After that, the order enters processing and cannot be modified.' },
  { q: 'Are the products authentic?', a: 'Yes. We only source products from authorised distributors and verified suppliers.' },
  { q: 'What payment methods are accepted?', a: 'We accept Visa, Mastercard, Bkash, Nagad, and cash on delivery.' },
  { q: 'Do you ship outside Bangladesh?', a: 'Currently we only ship within Bangladesh. International shipping is planned for the future.' },
];

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.map(item => ({
    '@type': 'Question',
    name: item.q,
    acceptedAnswer: { '@type': 'Answer', text: item.a },
  })),
};

export default function FaqPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <main className="max-w-7xl mx-auto px-4 py-16 grid grid-cols-1 md:grid-cols-4 gap-8">
        <aside className="md:col-span-1">
          <PolicySidebar />
        </aside>
        <div className="md:col-span-3">
          <h1 className="text-3xl font-bold mb-8">Frequently Asked Questions</h1>
          <div className="space-y-6">
            {faqs.map((item, i) => (
              <div key={i} className="border-b border-gray-100 pb-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-1">{item.q}</h2>
                <p className="text-gray-600">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
