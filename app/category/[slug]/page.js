import CategoryPageClient from '@/components/Home/CategoryPageClient';

// Server component that renders a client category page
export default function CategoryPage({ params }) {
  const { slug } = params;
  return <CategoryPageClient slug={slug} />;
}
