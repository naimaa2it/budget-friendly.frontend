"use client";

import OrderPrintView from "@/components/dashboard/Order/OrderPrintView";
import { useUrlParam } from "@/hooks/useUrlParam";

export default function OrderInvoicePageClient() {
  const id = useUrlParam(1); // .../orders/<id>/invoice
  return <OrderPrintView orderId={id} variant="invoice" />;
}
