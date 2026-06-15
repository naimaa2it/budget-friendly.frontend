// Checkout flow pages are transactional — block search engine indexing.
export const metadata = {
  robots: { index: false, follow: false, nocache: true },
};

export default function CheckoutLayout({ children }) {
  return <>{children}</>;
}
