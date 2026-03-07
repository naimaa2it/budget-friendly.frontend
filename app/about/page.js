import PolicySidebar from '@/components/Policy/Sidebar';

export const metadata = { title: 'About Us – Budget Friendly' };

export default function AboutPage() {
  return (
    <main className="max-w-7xl mx-auto px-4 py-16 grid grid-cols-1 md:grid-cols-4 gap-8">
      <aside className="md:col-span-1">
        <PolicySidebar />
      </aside>
      <div className="md:col-span-3">
      <h1 className="text-3xl font-bold mb-6">About Budget Friendly</h1>
      <p className="text-gray-600 mb-4">
        Budget Friendly brings you curated beauty and skincare products with fast shipping
        and reliable customer service. We believe everyone deserves access to
        quality products at budget-friendly prices.
      </p>
      <p className="text-gray-600">
        Founded with a passion for beauty and wellness, Budget Friendly is your one-stop
        destination for cosmetics, skincare, and personal care essentials.
      </p>
      </div>
    </main>
  );
}
