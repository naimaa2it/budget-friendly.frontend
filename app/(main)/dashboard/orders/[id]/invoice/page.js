import OrderInvoicePageClient from "./PageClient";

export function generateStaticParams() { return [{ id: '__placeholder__' }]; }

export default function OrderInvoicePage() {
  return <OrderInvoicePageClient />;
}
