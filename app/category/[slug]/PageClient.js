'use client';

import { useUrlParam } from '@/hooks/useUrlParam';
import CategoryPageClient from '@/components/category/CategoryPageClient';

export default function CategoryPageWrapper() {
  const slug = useUrlParam();
  return <CategoryPageClient slug={slug} />;
}
