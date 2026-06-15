import CategoryPageClient from '@/components/category/CategoryPageClient';
import { getStoreName } from '@/lib/storeMeta';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://yourhaat.com';

// Flatten the category tree and find by slug
async function fetchCategories() {
  try {
    const res = await fetch(`${API}/api/products/categories`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    const { categories = [] } = await res.json();
    const flat = [];
    const walk = (nodes) => {
      for (const c of nodes) {
        flat.push(c);
        if (c.children?.length) walk(c.children);
      }
    };
    walk(categories);
    return flat;
  } catch {
    return [];
  }
}

async function fetchCategoryBySlug(slug) {
  const cats = await fetchCategories();
  return cats.find(c => c.slug === slug) || null;
}

export async function generateStaticParams() {
  const cats = await fetchCategories();
  return cats.filter(c => c.slug).map(c => ({ slug: c.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const [category, storeName] = await Promise.all([fetchCategoryBySlug(slug), getStoreName()]);

  const name = category?.name || slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  const title = `${name} — Buy Online in Bangladesh`;
  const description = `Shop authentic ${name} products in Bangladesh at ${storeName}. Best prices, fast delivery, and verified genuine products.`;
  const image = category?.images?.[0]?.url || null;
  const canonical = `${SITE_URL}/category/${slug}`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      type: 'website',
      url: canonical,
      siteName: storeName,
      ...(image ? { images: [{ url: image, width: 800, height: 600, alt: name }] } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

export default async function CategoryPage({ params }) {
  const { slug } = await params;
  const category = await fetchCategoryBySlug(slug);

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      {
        '@type': 'ListItem',
        position: 2,
        name: category?.name || slug,
        item: `${SITE_URL}/category/${slug}`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <CategoryPageClient slug={slug} categoryName={category?.name} />
    </>
  );
}
