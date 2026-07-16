import BrandLogosList from '@/components/dashboard/Brands/BrandLogosList';

export const metadata = { title: 'Brand Logos | Dashboard' };

export default function BrandsPage() {
  return (
    <div className="p-6">
      <BrandLogosList />
    </div>
  );
}
