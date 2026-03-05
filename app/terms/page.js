export const metadata = { title: 'Terms & Conditions – Budget Friendly' };

export default function TermsPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold mb-6">Terms & Conditions</h1>
      <div className="space-y-6 text-gray-600 text-sm leading-relaxed">
        <p>By using Budget Friendly you agree to these terms. Please read them carefully.</p>
        <section>
          <h2 className="text-base font-semibold text-gray-800 mb-1">Use of the Site</h2>
          <p>You must be at least 18 years old to make a purchase. You agree not to misuse the site or attempt to access it in an unauthorised manner.</p>
        </section>
        <section>
          <h2 className="text-base font-semibold text-gray-800 mb-1">Orders & Pricing</h2>
          <p>All prices are in BDT. We reserve the right to refuse or cancel orders at our discretion, including in the event of pricing errors.</p>
        </section>
        <section>
          <h2 className="text-base font-semibold text-gray-800 mb-1">Intellectual Property</h2>
          <p>All content on this site (logos, images, text) is owned by Budget Friendly and may not be reproduced without written permission.</p>
        </section>
        <section>
          <h2 className="text-base font-semibold text-gray-800 mb-1">Limitation of Liability</h2>
          <p>Budget Friendly is not liable for indirect or consequential damages arising from use of the site or products purchased.</p>
        </section>
      </div>
    </main>
  );
}
