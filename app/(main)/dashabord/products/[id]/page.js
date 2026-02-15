"use client";

import ProductEditor from '@/components/dashbaord/Product/ProductEditor';
import React from 'react';


export default function page({ params }) {
  const id = params.id || 'new';
  return (
    <div>
      <ProductEditor productId={id} />
    </div>
  );
}
