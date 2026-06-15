"use client";

import CustomerProfile from "@/components/dashboard/Customer/CustomerProfile";
import React, { useEffect, useState } from "react";

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

  return <CustomerProfile userId={id} />;
}
