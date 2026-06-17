import PolicySidebar from "@/components/Policy/Sidebar";
import ContactContent from "@/components/ContactContent";
import { siteTitle, getStoreName } from "@/lib/storeMeta";

export async function generateMetadata() {
  const [title, storeName] = await Promise.all([
    siteTitle("Contact Us"),
    getStoreName(),
  ]);
  return {
    title,
    description: `Get in touch with ${storeName} customer support. We are here to help with your orders, returns, and product queries.`,
    openGraph: {
      title: `Contact ${storeName} — Customer Support Bangladesh`,
      description:
        "Reach our support team for help with orders, returns, and product queries.",
      type: "website",
    },
  };
}

export default function ContactPage() {
  return (
    <main className="max-w-7xl mx-auto px-2 py-16 grid grid-cols-1 md:grid-cols-4 gap-8">
      <aside className="md:col-span-1">
        <PolicySidebar />
      </aside>
      <div className="md:col-span-3">
        <ContactContent />
      </div>
    </main>
  );
}
