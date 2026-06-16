import CategoryPageWrapper from './PageClient';

export const metadata = {
  title: 'Shop by Category',
  description:
    'Browse gadgets and electronics by category at SmartBuy BD. Best prices, fast delivery across Bangladesh.',
};

export function generateStaticParams() {
  return [{ slug: '__placeholder__' }];
}

export default function Page() {
  return <CategoryPageWrapper />;
}
