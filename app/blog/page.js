import BlogListClient from '@/components/blog/BlogListClient';

import { siteTitle } from '@/lib/storeMeta';

export async function generateMetadata() {
  return {
    title: await siteTitle('Blog'),
    description: 'Read our latest articles on gadget guides, tech tips, product reviews, and more.',
  };
}

export default function BlogPage() {
  return <BlogListClient />;
}
