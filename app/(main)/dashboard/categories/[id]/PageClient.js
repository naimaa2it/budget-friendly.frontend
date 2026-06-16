"use client";

import React from 'react';
import CategoryCreate from '@/components/dashboard/Category/CategoryCreate';
import CategoryEdit from '@/components/dashboard/Category/CategoryEdit';
import { useUrlParam } from '@/hooks/useUrlParam';

export default function Page() {
  const id = useUrlParam();

  if (!id) return <div className="p-6">Loading...</div>;

  return (
    <div>
      {id === 'new' ? <CategoryCreate /> : <CategoryEdit categoryId={id} />}
    </div>
  );
}
