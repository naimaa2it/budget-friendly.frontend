import PageClient from './PageClient';
export function generateStaticParams() { return [{ token: '__placeholder__' }]; }
export default function Page({ params }) {
  return <PageClient params={params} />;
}
