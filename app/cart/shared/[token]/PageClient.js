"use client";

import SharedCartView from "@/components/cart/SharedCartView";
import React from "react";
import { useUrlParam } from "@/hooks/useUrlParam";

export default function Page() {
  const token = useUrlParam();

  if (!token) return <div className="p-6">Loading...</div>;

  return <SharedCartView token={token} />;
}
