"use client";

import OrderDetails from "@/components/dashboard/Order/OrderDetails";
import React, { useEffect, useState } from "react";

export function generateStaticParams() { return []; }

export default function Page({ params }) {
  const [id, setId] = useState(null);

  useEffect(() => {
    const resolveParams = async () => {
      const resolvedParams = params instanceof Promise ? await params : params;
      setId(resolvedParams?.id || null);
    };
    resolveParams();
  }, [params]);

  if (!id) return <div className="p-6">Loading...</div>;

  return <OrderDetails orderId={id} />;
}
