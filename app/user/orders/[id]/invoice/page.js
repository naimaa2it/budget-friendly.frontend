"use client";

import { use } from "react";
import OrderPrintView from "@/components/dashboard/Order/OrderPrintView";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function UserOrderInvoicePage({ params }) {
  const { id } = use(params);
  return (
    <OrderPrintView
      orderId={id}
      variant="invoice"
      orderApiUrl={`${API}/api/orders/${id}`}
      backHref="/user/orders"
    />
  );
}
