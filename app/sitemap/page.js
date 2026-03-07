import PolicySidebar from '@/components/Policy/Sidebar';

export const metadata = { title: 'Sitemap – Budget Friendly' };

export default function SitemapPage() {
  return (
    <main className="max-w-7xl mx-auto px-4 py-16 grid grid-cols-1 md:grid-cols-4 gap-8">
      <aside className="md:col-span-1">
        <PolicySidebar />
      </aside>
      <div className="md:col-span-3 space-y-6 text-gray-600">
        <h1 className="text-3xl font-bold mb-6">Sitemap</h1>
        <p>This page provides quick links to major sections of the site for easy navigation and SEO.</p>
        {/* list of links can be added here */}
      </div>
    </main>
  );
}