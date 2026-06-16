"use client";

import SharedCartView from "@/components/cart/SharedCartView";
import React, { useEffect, useState } from "react";

export default function Page({ params }) {
  const [token, setToken] = useState(null);

  useEffect(() => {
    const resolveParams = async () => {
      const resolvedParams = params instanceof Promise ? await params : params;
      setToken(resolvedParams?.token || null);
    };
    resolveParams();
  }, [params]);

  if (!token) return <div className="p-6">Loading...</div>;

  return <SharedCartView token={token} />;
}
