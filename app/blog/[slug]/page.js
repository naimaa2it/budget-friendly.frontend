import BlogDetailClient from '@/components/blog/BlogDetailClient';
import { getStoreName } from '@/lib/storeMeta';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://yourhaat.com';

function getImageUrl(featuredImage, thumbnail) {
  if (featuredImage?.url) return featuredImage.url;
  if (typeof featuredImage === 'string') return featuredImage;
  return thumbnail || null;
}

export async function generateStaticParams() {
  try {
    const res = await fetch(`${API}/api/blog?limit=500&status=published`, { cache: 'force-cache' });
    if (!res.ok) return [];
    const data = await res.json();
    const posts = data.posts || data.items || [];
    return posts.filter(p => p.slug).map(p => ({ slug: p.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const storeName = await getStoreName();

  try {
    const resp = await fetch(`${API}/api/blog/${slug}`, { next: { revalidate: 300 } });
    if (resp.ok) {
      const { post: blog } = await resp.json();
      const imageUrl = getImageUrl(blog?.featuredImage, blog?.thumbnail);
      const description = blog?.excerpt || (blog?.content || '').replace(/<[^>]+>/g, '').slice(0, 160) || `Read this article on ${storeName}`;
      const canonical = `${SITE_URL}/blog/${slug}`;

      return {
        title: `${blog?.title || 'Blog'} | ${storeName}`,
        description,
        alternates: { canonical },
        openGraph: {
          title: blog?.title,
          description,
          type: 'article',
          url: canonical,
          siteName: storeName,
          publishedTime: blog?.createdAt,
          modifiedTime: blog?.updatedAt,
          authors: [SITE_URL],
          images: imageUrl ? [{ url: imageUrl, width: 1200, height: 630, alt: blog?.title }] : [],
        },
        twitter: {
          card: 'summary_large_image',
          title: blog?.title,
          description,
          images: imageUrl ? [imageUrl] : [],
        },
      };
    }
  } catch {
    // fall through to default
  }

  return {
    title: `Blog | ${storeName}`,
    description: `Skincare tips, beauty guides, and product reviews from ${storeName} Bangladesh.`,
  };
}

export default async function BlogDetailPage({ params }) {
  const { slug } = await params;
  const storeName = await getStoreName();

  // Fetch for Article JSON-LD (re-uses Next.js cache from generateMetadata fetch)
  let articleSchema = null;
  try {
    const resp = await fetch(`${API}/api/blog/${slug}`, { next: { revalidate: 300 } });
    if (resp.ok) {
      const { post: blog } = await resp.json();
      const imageUrl = getImageUrl(blog?.featuredImage, blog?.thumbnail);
      articleSchema = {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: blog?.title,
        description: blog?.excerpt || '',
        ...(imageUrl ? { image: imageUrl } : {}),
        datePublished: blog?.createdAt,
        dateModified: blog?.updatedAt || blog?.createdAt,
        author: { '@type': 'Organization', name: storeName, url: SITE_URL },
        publisher: {
          '@type': 'Organization',
          name: storeName,
          url: SITE_URL,
          logo: { '@type': 'ImageObject', url: `${SITE_URL}/logo.png` },
        },
        mainEntityOfPage: { '@type': 'WebPage', '@id': `${SITE_URL}/blog/${slug}` },
      };
    }
  } catch {
    // schema is optional — page renders fine without it
  }

  return (
    <>
      {articleSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
        />
      )}
      <BlogDetailClient slug={slug} />
    </>
  );
}
