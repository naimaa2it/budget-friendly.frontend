import PageClient from './PageClient';
export function generateStaticParams() { return [{ id: '__placeholder__' }]; }
export default function Page() {
  return <PageClient />;
}
