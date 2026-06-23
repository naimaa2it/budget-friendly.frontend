import PolicySidebar from "@/components/Policy/Sidebar";
import { siteTitle, getStoreName, getPolicyContent } from "@/lib/storeMeta";

export async function generateMetadata() {
  const [title, storeName] = await Promise.all([
    siteTitle("Privacy Policy"),
    getStoreName(),
  ]);
  return {
    title,
    description: `Read ${storeName}'s privacy policy to understand how we collect, use, and protect your personal information when you shop with us in Bangladesh.`,
  };
}

export default async function PrivacyPage() {
  const [storeName, policyContent] = await Promise.all([
    getStoreName(),
    getPolicyContent(),
  ]);
  const sections = policyContent?.privacy || [];

  return (
    <main className="max-w-7xl mx-auto px-2 py-16 grid grid-cols-1 md:grid-cols-4 gap-8">
      <aside className="md:col-span-1">
        <PolicySidebar />
      </aside>
      <div className="md:col-span-3">
        <div className="flex items-center gap-3 mb-8">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-purple-100 text-purple-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">গোপনীয়তা নীতি</h1>
            <p className="text-xs text-gray-500">আপনার তথ্য সুরক্ষায় আমরা প্রতিশ্রুতিবদ্ধ</p>
          </div>
        </div>

        {sections.length > 0 ? (
          <>
            <p className="text-sm text-gray-600 mb-6 leading-relaxed">
              {storeName} আপনার ব্যক্তিগত তথ্য সুরক্ষায় প্রতিশ্রুতিবদ্ধ।
            </p>
            <div className="space-y-6">
              {sections.map((sec, i) => (
                <section key={i} className="border-l-4 border-purple-200 pl-4">
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
