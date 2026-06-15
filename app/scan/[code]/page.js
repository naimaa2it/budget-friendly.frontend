import ScanPage from './PageClient';
export function generateStaticParams() { return [{ code: '__placeholder__' }]; }
export default function Page() {
  return <ScanPage />;
}
