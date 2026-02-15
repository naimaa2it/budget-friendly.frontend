"use client";

import CategoryEditor from '@/components/dashbaord/Category/CategoryEditor';
import React from 'react';


export default function page({ params }) {
  const id = params.id || 'new';
  return (
    <div>
      <CategoryEditor categoryId={id} />
    </div>
  );
}
