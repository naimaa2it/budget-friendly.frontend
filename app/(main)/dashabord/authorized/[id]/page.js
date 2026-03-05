"use client";

import React, { useEffect, useState } from 'react';
import AdminEditor from '@/components/dashboard/Admin/AdminEditor';

export default function Page({ params }) {
  const [id, setId] = useState(null);
  
  useEffect(() => {
    const resolveParams = async () => {
      const resolvedParams = params instanceof Promise ? await params : params;
      const adminId = resolvedParams?.id || 'new';
      console.log('Authorized [id] page - Resolved ID:', adminId);
      setId(adminId);
    };
    
    resolveParams();
  }, [params]);
  
  if (id === null) return <div className="p-6">Loading...</div>;
  
  return (
    <div>
      <AdminEditor adminId={id} />
    </div>
  );
}
