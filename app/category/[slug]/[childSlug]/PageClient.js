'use client';

import { Suspense } from 'react';
import { useUrlParam } from '@/hooks/useUrlParam';
import CategoryPageClient from '@/components/category/CategoryPageClient';

function ChildCategoryPageInner() {
  const childSlug = useUrlParam(0);
  const parentSlug = useUrlParam(1);
  return <CategoryPageClient slug={childSlug} parentSlug={parentSlug} />;
}

export default function ChildCategoryPageWrapper() {
  return (
    <Suspense>
      <ChildCategoryPageInner />
    </Suspense>
  );
}
