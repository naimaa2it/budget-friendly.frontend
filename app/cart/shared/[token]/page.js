import PageClient from './PageClient';
export function generateStaticParams() { return [{ token: '__placeholder__' }]; }
export default function Page() {
  return <PageClient />;
}
