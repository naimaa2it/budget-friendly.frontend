import PolicySidebar from "@/components/Policy/Sidebar";
import Accordion from "@/components/Policy/Accordion";
import { siteTitle, getStoreName, getPolicyContent } from "@/lib/storeMeta";

export async function generateMetadata() {
  const [title, storeName] = await Promise.all([
    siteTitle("Frequently Asked Questions"),
    getStoreName(),
  ]);
  return {
    title,
    description: `Get answers to common questions about ordering, shipping, payments, returns, and product authenticity at ${storeName} Bangladesh.`,
    alternates: {
      canonical: `${process.env.NEXT_PUBLIC_SITE_URL || "http://pickob.com"}/faq`,
    },
  };
}

export default async function FaqPage() {
  const policyContent = await getPolicyContent();
  const faqs = policyContent?.faq || [];

  const faqSchema = faqs.length > 0
    ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faqs.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: { "@type": "Answer", text: item.answer },
        })),
      }
    : null;

  return (
    <>
      {faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      )}
      <main className="max-w-7xl mx-auto px-2 py-16 grid grid-cols-1 md:grid-cols-4 gap-8">
        <aside className="md:col-span-1">
          <PolicySidebar />
        </aside>
        <div className="md:col-span-3">
          <div className="flex items-center gap-3 mb-8">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-green-100 text-green-600">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">সাধারণ জিজ্ঞাসা</h1>
              <p className="text-xs text-gray-500">আপনার প্রশ্নের উত্তর এখানে খুঁজুন</p>
            </div>
          </div>
          {faqs.length > 0 ? (
            <Accordion items={faqs} />
          ) : (
            <p className="text-sm text-gray-400">কোনো তথ্য পাওয়া যায়নি।</p>
          )}
        </div>
      </main>
    </>
  );
}
