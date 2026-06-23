import PolicySidebar from "@/components/Policy/Sidebar";
import { siteTitle, getStoreName, getPolicyContent } from "@/lib/storeMeta";

export async function generateMetadata() {
  const [title, storeName] = await Promise.all([
    siteTitle("Terms & Conditions"),
    getStoreName(),
  ]);
  return {
    title,
    description: `Read ${storeName}'s terms and conditions governing the use of our online store, purchases, and services in Bangladesh.`,
  };
}

export default async function TermsPage() {
  const [storeName, policyContent] = await Promise.all([
    getStoreName(),
    getPolicyContent(),
  ]);
  const sections = policyContent?.terms || [];

  return (
    <main className="max-w-7xl mx-auto px-2 py-16 grid grid-cols-1 md:grid-cols-4 gap-8">
      <aside className="md:col-span-1">
        <PolicySidebar />
      </aside>
      <div className="md:col-span-3">
        <div className="flex items-center gap-3 mb-8">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 text-gray-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">শর্তাবলী</h1>
            <p className="text-xs text-gray-500">সাইট ব্যবহারের আগে অনুগ্রহ করে পড়ুন</p>
          </div>
        </div>

        {sections.length > 0 ? (
          <>
            <p className="text-sm text-gray-600 mb-6 leading-relaxed">
              {storeName} ব্যবহার করে আপনি এই শর্তাবলীতে সম্মত হচ্ছেন।
            </p>
            <div className="space-y-6">
              {sections.map((sec, i) => (
                <section key={i} className="border-l-4 border-gray-200 pl-4">
                  <h2 className="text-base font-semibold text-gray-800 mb-2">{sec.heading}</h2>
                  <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{sec.content}</p>
                </section>
              ))}
            </div>
          </>
        ) : (
          <p className="text-sm text-gray-400">কোনো তথ্য পাওয়া যায়নি।</p>
        )}
      </div>
    </main>
  );
}
