"use client";

import ProductCreate from '@/components/dashbaord/Product/ProductCreate';
import ProductEdit from '@/components/dashbaord/Product/ProductEdit';
import React from 'react';

export default function page({ params }) {
  const id = params.id || 'new';
  return (
    <div>
      {id === 'new' ? <ProductCreate /> : <ProductEdit productId={id} />}
    </div>
  );
}
