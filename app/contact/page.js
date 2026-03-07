import PolicySidebar from '@/components/Policy/Sidebar';
import ContactContent from '@/components/ContactContent';

export const metadata = { title: 'Contact Us – Budget Friendly' };

export default function ContactPage() {
  return (
    <main className="max-w-7xl mx-auto px-4 py-16 grid grid-cols-1 md:grid-cols-4 gap-8">
      <aside className="md:col-span-1">
        <PolicySidebar />
      </aside>
      <div className="md:col-span-3">
        <ContactContent />
      </div>
    </main>
  );
}


