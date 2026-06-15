import PageClient from './PageClient';
export function generateStaticParams() { return [{ id: '__placeholder__' }]; }
export default function Page({ params }) {
  return <PageClient params={params} />;
}
