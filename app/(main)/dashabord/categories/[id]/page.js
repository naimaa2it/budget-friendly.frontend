"use client";

import React from 'react';
import CategoryEditor from '@/components/dashbaord/CategoryEditor';

export default function page({ params }) {
  const id = params.id || 'new';
  return (
    <div>
      <CategoryEditor categoryId={id} />
    </div>
  );
}
