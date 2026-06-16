"use client";

import OrderPrintView from "@/components/dashboard/Order/OrderPrintView";
import { useUrlParam } from "@/hooks/useUrlParam";

export default function OrderSlipPageClient() {
  const id = useUrlParam(1); // .../orders/<id>/slip
  return <OrderPrintView orderId={id} variant="slip" />;
}
