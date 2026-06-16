"use client";

import CustomerProfile from "@/components/dashboard/Customer/CustomerProfile";
import React from "react";
import { useUrlParam } from "@/hooks/useUrlParam";

export default function Page() {
  const id = useUrlParam(1); // .../customers/<id>/profile

  if (!id) return <div className="p-6">Loading...</div>;

  return <CustomerProfile userId={id} />;
}
