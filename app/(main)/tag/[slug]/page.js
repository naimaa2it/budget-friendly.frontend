import TagPageClient from '@/components/category/TagPageClient';

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const labels = {
    'best-seller': 'Best Sellers',
    'hot': 'Hot Products',
    'new-arrival': 'New Arrivals',
    'popular-pics': 'Popular Picks',
    'trending': 'Trending Now',
  };
  const label = labels[slug] || slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  return { title: `${label} — Budget Friendly` };
}

export default async function TagPage({ params }) {
  const { slug } = await params;
  return <TagPageClient slug={slug} />;
}
