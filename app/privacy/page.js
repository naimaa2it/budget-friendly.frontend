import PolicySidebar from '@/components/Policy/Sidebar';

export const metadata = { title: 'Privacy Policy – Budget Friendly' };

export default function PrivacyPage() {
  return (
    <main className="max-w-7xl mx-auto px-4 py-16 grid grid-cols-1 md:grid-cols-4 gap-8">
      <aside className="md:col-span-1">
        <PolicySidebar />
      </aside>
      <div className="md:col-span-3 space-y-6 text-gray-600 text-sm leading-relaxed">
      <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
        <p>Budget Friendly ("we", "us") is committed to protecting your personal information. This policy explains what data we collect, how we use it, and your rights.</p>
        <section>
          <h2 className="text-base font-semibold text-gray-800 mb-1">Data We Collect</h2>
          <p>Name, email, delivery address, and order history when you create an account or place an order. We also collect usage data (pages visited, clicks) to improve the site.</p>
        </section>
        <section>
          <h2 className="text-base font-semibold text-gray-800 mb-1">How We Use Your Data</h2>
          <p>To fulfil orders, send transactional emails, and personalise your shopping experience. We never sell your data to third parties.</p>
        </section>
        <section>
          <h2 className="text-base font-semibold text-gray-800 mb-1">Cookies</h2>
          <p>We use essential cookies for authentication and preference storage. Analytics cookies require your consent.</p>
        </section>
        <section>
          <h2 className="text-base font-semibold text-gray-800 mb-1">Your Rights</h2>
          <p>You may request access, correction, or deletion of your personal data at any time by emailing support@yourhaat.com.</p>
        </section>
      </div>
    </main>
  );
}
