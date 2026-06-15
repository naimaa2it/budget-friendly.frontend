"use client";

import ProductCreate from '@/components/dashboard/Product/ProductCreate';
import ProductEdit from '@/components/dashboard/Product/ProductEdit';
import { useEffect, useState } from 'react';

export function generateStaticParams() { return []; }

export default function Page({ params }) {
  const [id, setId] = useState(null);
  
  useEffect(() => {
    // Handle params whether it's a Promise or object directly
    const resolveParams = async () => {
      const resolvedParams = params instanceof Promise ? await params : params;
      const productId = resolvedParams?.id || 'new';
      console.log('Products [id] page - Resolved ID:', productId);
      setId(productId);
    };
    
    resolveParams();
  }, [params]);
  
  if (id === null) {
    return <div className="p-6 text-center">Loading...</div>;
  }
  
  return (
    <div>
      {id === 'new' ? <ProductCreate /> : <ProductEdit productId={id} />}
    </div>
  );
}
