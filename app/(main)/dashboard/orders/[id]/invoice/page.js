import OrderPrintView from "@/components/dashboard/Order/OrderPrintView";

export function generateStaticParams() { return [{ id: '__placeholder__' }]; }

export default async function OrderInvoicePage({ params }) {
  const { id } = await params;
  return <OrderPrintView orderId={id} variant="invoice" />;
}
