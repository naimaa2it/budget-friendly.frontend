import OrderSlipPageClient from "./PageClient";

export function generateStaticParams() { return [{ id: '__placeholder__' }]; }

export default function OrderSlipPage() {
  return <OrderSlipPageClient />;
}
