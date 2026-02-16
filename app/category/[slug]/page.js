import CategoryPageClient from '@/components/Home/CategoryPageClient';

// Server component that renders a client category page
export default async function CategoryPage({ params }) {
  const resolvedParams = await params;
  const { slug } = resolvedParams;
  return <CategoryPageClient slug={slug} />;
}
