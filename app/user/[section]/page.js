import UserSectionPage from './PageClient';
export function generateStaticParams() {
  return ['profile', 'orders', 'wishlist', 'addresses', 'settings', 'rewards'].map(s => ({ section: s }));
}
export default function Page() {
  return <UserSectionPage />;
}
