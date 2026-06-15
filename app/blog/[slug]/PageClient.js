'use client';

import { useParams } from 'next/navigation';
import BlogDetailClient from '@/components/blog/BlogDetailClient';

export default function BlogPageClient() {
  const { slug } = useParams();
  return <BlogDetailClient slug={slug} />;
}
