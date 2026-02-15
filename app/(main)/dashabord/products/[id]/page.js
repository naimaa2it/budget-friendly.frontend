"use client";

import React from 'react';
import ProductEditor from '@/components/dashbaord/ProductEditor';

export default function page({ params }) {
  const id = params.id || 'new';
  return (
    <div>
      <ProductEditor productId={id} />
    </div>
  );
}
