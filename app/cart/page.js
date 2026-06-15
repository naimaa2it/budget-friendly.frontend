import CartPage from '@/components/cart/CartPage';

import { siteTitle } from '@/lib/storeMeta';

export async function generateMetadata() {
  return {
    title: await siteTitle('Shopping Cart'),
    robots: { index: false, follow: false, nocache: true },
  };
}

export default function Cart() {
  return <CartPage />;
}
