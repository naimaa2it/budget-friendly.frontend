import PolicySidebar from '@/components/Policy/Sidebar';

export const metadata = { title: 'Contact Us – Budget Friendly' };

export default function ContactPage() {
  return (
    <main className="max-w-7xl mx-auto px-4 py-16 grid grid-cols-1 md:grid-cols-4 gap-8">
      <aside className="md:col-span-1">
        <PolicySidebar />
      </aside>
      <div className="md:col-span-3">
      <h1 className="text-3xl font-bold mb-6">Contact Us</h1>
      <p className="text-gray-600 mb-8">Have a question or need help? Fill in the form below and we will get back to you within 24 hours.</p>
      <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
          <input type="text" className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#ac0ad1]" placeholder="Your name" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input type="email" className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#ac0ad1]" placeholder="you@example.com" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
          <textarea rows={5} className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#ac0ad1]" placeholder="How can we help?" />
        </div>
        <button type="submit" className="px-6 py-2 bg-[#551464] text-white rounded-full text-sm hover:opacity-90">Send Message</button>
      </form>
      <div className="mt-10 text-sm text-gray-600 space-y-1">
        <p>📧 support@yourhaat.com</p>
        <p>📞 +880 1XXXXXXXXX</p>
      </div>
      </div>
    </main>
  );
}
