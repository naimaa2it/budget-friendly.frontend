'use client';

import { Suspense } from 'react';
import { useUrlParam } from '@/hooks/useUrlParam';
import CategoryPageClient from '@/components/category/CategoryPageClient';

function CategoryPageInner(props) {
  const slug = useUrlParam();
  return <CategoryPageClient slug={slug} {...props} />;
}

export default function CategoryPageWrapper(props) {
  return (
    <Suspense>
      <CategoryPageInner {...props} />
    </Suspense>
  );
}
