'use client';

import { Suspense } from 'react';
import { useUrlParam } from '@/hooks/useUrlParam';
import CategoryPageClient from '@/components/category/CategoryPageClient';

function CategoryPageInner() {
  const slug = useUrlParam();
  return <CategoryPageClient slug={slug} />;
}

export default function CategoryPageWrapper() {
  return (
    <Suspense>
      <CategoryPageInner />
    </Suspense>
  );
}
