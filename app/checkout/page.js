import CheckoutPage from '@/components/checkout/CheckoutPage';

import { siteTitle, getStoreName } from '@/lib/storeMeta';

export async function generateMetadata() {
  const [title, storeName] = await Promise.all([siteTitle('Checkout'), getStoreName()]);
  return {
    title,
    description: `Complete your order securely on ${storeName}.`,
  };
}

export default function Checkout() {
  return <CheckoutPage />;
}
