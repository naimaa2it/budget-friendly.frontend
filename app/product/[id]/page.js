import ProductPageClient from './PageClient';

export const metadata = {
  title: 'Product Details',
  description:
    'Browse gadgets and electronics at SmartBuy BD. View price, specifications, and availability.',
};

export function generateStaticParams() {
  return [{ id: '__placeholder__' }];
}

export default function Page() {
  return <ProductPageClient />;
}
