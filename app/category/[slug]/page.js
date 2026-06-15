import CategoryPageWrapper from './PageClient';

export function generateStaticParams() {
  return [{ slug: '__placeholder__' }];
}

export default function Page() {
  return <CategoryPageWrapper />;
}
