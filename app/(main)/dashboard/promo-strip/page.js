import PromoStripList from '@/components/dashboard/PromoStrip/PromoStripList';

export const metadata = { title: 'Promo Strip | Dashboard' };

export default function PromoStripDashboardPage() {
  return (
    <div className="p-6">
      <PromoStripList />
    </div>
  );
}
