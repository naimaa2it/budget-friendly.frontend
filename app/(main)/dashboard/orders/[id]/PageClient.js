"use client";

import OrderDetails from "@/components/dashboard/Order/OrderDetails";
import React from "react";
import { useUrlParam } from "@/hooks/useUrlParam";

export default function Page() {
  const id = useUrlParam();

  if (!id) return <div className="p-6">Loading...</div>;

  return <OrderDetails orderId={id} />;
}
