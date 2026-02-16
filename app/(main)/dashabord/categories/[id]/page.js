"use client";

import React from 'react';
import CategoryCreate from '@/components/dashbaord/Category/CategoryCreate';
import CategoryEdit from '@/components/dashbaord/Category/CategoryEdit';

export default function page({ params }) {
  const id = params.id || 'new';
  return (
    <div>
      {id === 'new' ? <CategoryCreate /> : <CategoryEdit categoryId={id} />}
    </div>
  );
}
