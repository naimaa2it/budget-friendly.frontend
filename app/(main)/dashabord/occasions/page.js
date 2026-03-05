import OccasionsList from '@/components/dashboard/Occasions/OccasionsList';

export const metadata = { title: 'Occasion Sections | Dashboard' };

export default function OccasionsPage() {
  return (
    <div className="p-6">
      <OccasionsList />
    </div>
  );
}
