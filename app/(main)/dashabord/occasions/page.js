import OccasionsList from '@/components/dashbaord/Occasions/OccasionsList';

export const metadata = { title: 'Occasion Sections | Dashboard' };

export default function OccasionsPage() {
  return (
    <div className="p-6">
      <OccasionsList />
    </div>
  );
}
