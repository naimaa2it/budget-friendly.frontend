"use client";

import CustomerEditor from '@/components/dashboard/Customer/CustomerEditor';
import React, { useEffect, useState } from 'react';

export default function Page({ params }) {
  const [id, setId] = useState(null);

  useEffect(() => {
    const resolveParams = async () => {
      const resolvedParams = params instanceof Promise ? await params : params;
      const userId = resolvedParams?.id || 'new';
      console.log('Customers [id] page - Resolved ID:', userId);
      setId(userId);
    };

    resolveParams();
  }, [params]);

  if (id === null) return <div className="p-6">Loading...</div>;

  return <CustomerEditor userId={id} />;
}
