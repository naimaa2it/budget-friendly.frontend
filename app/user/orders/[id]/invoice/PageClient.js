"use client";

import OrderPrintView from "@/components/dashboard/Order/OrderPrintView";
import { useUrlParam } from "@/hooks/useUrlParam";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function UserOrderInvoicePage() {
  const id = useUrlParam(1); // .../user/orders/<id>/invoice
  return (
    <OrderPrintView
      orderId={id}
      variant="invoice"
      orderApiUrl={`${API}/api/orders/${id}`}
      backHref="/user/orders"
    />
  );
}
