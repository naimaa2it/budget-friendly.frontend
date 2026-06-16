"use client";

import ProductCreate from '@/components/dashboard/Product/ProductCreate';
import ProductEdit from '@/components/dashboard/Product/ProductEdit';
import { useUrlParam } from '@/hooks/useUrlParam';

export default function Page() {
  const id = useUrlParam();

  if (!id) {
    return <div className="p-6 text-center">Loading...</div>;
  }

  return (
    <div>
      {id === 'new' ? <ProductCreate /> : <ProductEdit productId={id} />}
    </div>
  );
}
