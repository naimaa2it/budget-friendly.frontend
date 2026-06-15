'use client';

import { useParams } from 'next/navigation';
import CategoryPageClient from '@/components/category/CategoryPageClient';

export default function CategoryPageWrapper() {
  const { slug } = useParams();
  return <CategoryPageClient slug={slug} />;
}
