import OrderPrintView from "@/components/dashboard/Order/OrderPrintView";

export default async function OrderSlipPage({ params }) {
  const { id } = await params;
  return <OrderPrintView orderId={id} variant="slip" />;
}
