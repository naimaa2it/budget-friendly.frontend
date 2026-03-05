"use client";

import React, { useEffect, useState } from 'react';
import CategoryCreate from '@/components/dashboard/Category/CategoryCreate';
import CategoryEdit from '@/components/dashboard/Category/CategoryEdit';

export default function Page({ params }) {
  const [id, setId] = useState(null);
  
  useEffect(() => {
    // Handle params whether it's a Promise or object directly
    const resolveParams = async () => {
      const resolvedParams = params instanceof Promise ? await params : params;
      const categoryId = resolvedParams?.id || 'new';
      console.log('Categories [id] page - Resolved ID:', categoryId);
      setId(categoryId);
    };
    
    resolveParams();
  }, [params]);
  
  // Wait for id to be resolved
  if (id === null) return <div className="p-6">Loading...</div>;
  
  return (
    <div>
      {id === 'new' ? <CategoryCreate /> : <CategoryEdit categoryId={id} />}
    </div>
  );
}
