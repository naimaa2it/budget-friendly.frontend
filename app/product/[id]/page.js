import React from 'react';
import ProductDetails from '@/components/product/ProductDetails';
import { getStoreName } from '@/lib/storeMeta';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://yourhaat.com';

// Pre-generate static pages for all published products (required for static export,
// beneficial for SSR as it warms the Next.js fetch cache at build time).
export async function generateStaticParams() {
  const params = [];
  let page = 1;
  const PER_PAGE = 500;

  while (true) {
    try {
      const res = await fetch(
        `${API}/api/products?status=published&limit=${PER_PAGE}&page=${page}`,
        { cache: 'force-cache' },
      );
      if (!res.ok) break;
      const { items = [], total = 0 } = await res.json();
      for (const p of items) params.push({ id: p._id });
      if (params.length >= total || items.length < PER_PAGE) break;
      page++;
    } catch {
      break;
    }
  }
  return params;
}

async function fetchProduct(id) {
  const resp = await fetch(`${API}/api/products/${id}`, { next: { revalidate: 300 } });
  if (!resp.ok) return null;
  const json = await resp.json();
  return json.product || null;
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  const [product, storeName] = await Promise.all([fetchProduct(id), getStoreName()]);
  if (!product) return { title: `Product not found — ${storeName}` };

  const title = `${product.title} — ${storeName}`;
  const description = product.description
    ? product.description.replace(/<[^>]+>/g, '').slice(0, 160)
    : `Buy ${product.title} at the best price on ${storeName}.`;
  const image = product.images?.[0]?.url || product.image || null;

  return {
    title,
    description,
    alternates: { canonical: `${SITE_URL}/product/${id}` },
    openGraph: {
      title,
      description,
      type: 'website',
      url: `${SITE_URL}/product/${id}`,
      siteName: storeName,
      ...(image ? { images: [{ url: image, width: 800, height: 800, alt: product.title }] } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      ...(image ? { images: [image] } : {}),
    },
  };
}

export default async function ProductPage({ params }) {
  const { id } = await params;
  const storeName = await getStoreName();
  let product = null;
  let related = [];
  let error = null;

  if (!id || id === 'undefined') {
    return (
      <div className="py-24 text-center">
        <p className="text-red-600 text-lg">Error loading product</p>
        <p className="text-gray-500 mt-2">Invalid product ID</p>
      </div>
    );
  }

  try {
    product = await fetchProduct(id);
    if (!product) {
      error = 'Product not found';
    } else {
      const fetches = [];

      // Priority 1: same category (most relevant)
      if (product.categoryId) {
        fetches.push(
          fetch(`${API}/api/products?categoryId=${product.categoryId}&limit=14`, { next: { revalidate: 300 } })
            .then(r => r.ok ? r.json() : { items: [] })
            .then(d => d.items || [])
            .catch(() => [])
        );
      }

      // Priority 2: same brand / department
      if (product.department) {
        fetches.push(
          fetch(`${API}/api/products?brand=${encodeURIComponent(product.department)}&limit=14`, { next: { revalidate: 300 } })
            .then(r => r.ok ? r.json() : { items: [] })
            .then(d => d.items || [])
            .catch(() => [])
        );
      }

      if (fetches.length > 0) {
        const results = await Promise.all(fetches);
        const seen = new Set([String(id)]);
        for (const arr of results) {
          for (const p of arr) {
            const pid = String(p._id);
            if (!seen.has(pid)) {
              seen.add(pid);
              related.push(p);
            }
          }
        }
      }

      // Fallback: newest products if nothing matched
      if (related.length === 0) {
        const fallback = await fetch(`${API}/api/products?limit=14&sort=newest`, { next: { revalidate: 300 } })
          .then(r => r.ok ? r.json() : { items: [] })
          .then(d => d.items || [])
          .catch(() => []);
        related = fallback.filter(p => String(p._id) !== String(id));
      }

      related = related.slice(0, 12);
    }
  } catch (err) {
    error = err.message;
  }

  if (error) {
    return (
      <div className="py-24 text-center">
        <p className="text-red-600 text-lg">Error loading product</p>
        <p className="text-gray-500 mt-2">{error}</p>
      </div>
    );
  }

  const primaryImage = product.images?.[0]?.url || product.image || null;
  const price = product.variants?.[0]?.price ?? product.price ?? 0;
  const availability = product.availability === false || product.status === 'archived'
    ? 'https://schema.org/OutOfStock'
    : 'https://schema.org/InStock';

  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    description: product.description
      ? product.description.replace(/<[^>]+>/g, '').slice(0, 500)
      : undefined,
    ...(primaryImage ? { image: [primaryImage] } : {}),
    brand: product.department ? { '@type': 'Brand', name: product.department } : undefined,
    sku: product._id,
    offers: {
      '@type': 'Offer',
      priceCurrency: 'BDT',
      price: price,
      availability,
      url: `${SITE_URL}/product/${product._id}`,
      seller: { '@type': 'Organization', name: storeName, url: SITE_URL },
    },
    ...(product.reviewCount > 0 ? {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: Number((product.averageRating || 5).toFixed(1)),
        reviewCount: product.reviewCount,
        bestRating: 5,
        worstRating: 1,
      },
    } : {}),
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      ...(product.categoryId ? [{ '@type': 'ListItem', position: 2, name: product.department || 'Products', item: `${SITE_URL}/category/${product.categoryId}` }] : []),
      { '@type': 'ListItem', position: product.categoryId ? 3 : 2, name: product.title, item: `${SITE_URL}/product/${product._id}` },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <ProductDetails product={product} relatedProducts={related} />
    </>
  );
}
