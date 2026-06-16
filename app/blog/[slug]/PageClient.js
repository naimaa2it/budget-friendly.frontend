'use client';

import { useUrlParam } from '@/hooks/useUrlParam';
import BlogDetailClient from '@/components/blog/BlogDetailClient';

export default function BlogPageClient() {
  const slug = useUrlParam();
  return <BlogDetailClient slug={slug} />;
}
