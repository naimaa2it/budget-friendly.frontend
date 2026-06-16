"use client";

import CustomerEditor from '@/components/dashboard/Customer/CustomerEditor';
import React from 'react';
import { useUrlParam } from '@/hooks/useUrlParam';

export default function Page() {
  const id = useUrlParam();

  if (!id) return <div className="p-6">Loading...</div>;

  return <CustomerEditor userId={id} />;
}
