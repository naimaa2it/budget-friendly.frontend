import TagPageClient from '@/components/category/TagPageClient';
import { getStoreName } from '@/lib/storeMeta';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://yourhaat.com';

const TAG_LABELS = {
  'best-seller':      'Best Sellers',
  'best_seller':      'Best Sellers',
  'hot':              'Hot Products',
  'new-arrival':      'New Arrivals',
  'new_arrival':      'New Arrivals',
  'popular-pics':     "Today's Popular Picks",
  'popular_pics':     "Today's Popular Picks",
  'trending':         'Trending Now',
  'limited-edition':  'Limited Edition',
  'limited':          'Limited Edition',
  'featured':         'Featured Products',
  'flash-sale':       'Flash Sale',
  'clearance':        'Clearance',
  'free-shipping':    'Free Shipping',
  'deals-of-the-day': 'Deal of the Day',
  'deals_of_the_day': 'Deal of the Day',
};

export function generateStaticParams() {
  return Object.keys(TAG_LABELS).map(slug => ({ slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const storeName = await getStoreName();
  const label = TAG_LABELS[slug] || slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  const description = `Browse ${label} at ${storeName} — Bangladesh's trusted beauty & skincare shop. Best prices, fast delivery.`;
  const canonical = `${SITE_URL}/tag/${slug}`;

  return {
    title: `${label} — ${storeName}`,
    description,
    alternates: { canonical },
    openGraph: {
      title: `${label} — ${storeName}`,
      description,
      type: 'website',
      url: canonical,
      siteName: storeName,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${label} — ${storeName}`,
      description,
    },
  };
}

export default async function TagPage({ params }) {
  const { slug } = await params;
  return <TagPageClient slug={slug} />;
}
