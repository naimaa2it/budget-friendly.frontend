"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import ProductCard from '@/components/product/ProductCard';
import ProductFilters from '@/components/product/ProductFilters';
import SortDropdown from '@/components/product/SortDropdown';
import Link from 'next/link';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const TAG_CONFIG = {
  'best-seller': {
    label: 'Best Sellers',
    badge: 'best_seller',
    icon: '⭐',
    description: 'Our most loved products — rated and trusted by thousands of customers.',
    gradient: 'from-amber-400 via-yellow-400 to-orange-400',
    patternColor: 'rgba(255,255,255,0.07)',
    textColor: 'text-amber-900',
    pill: 'bg-amber-100 text-amber-800',
  },
  'hot': {
    label: 'Hot Right Now',
    badge: 'hot',
    icon: '🔥',
    description: 'Flying off the shelves — grab these sizzling products before they\'re gone.',
    gradient: 'from-orange-500 via-red-500 to-rose-600',
    patternColor: 'rgba(255,255,255,0.06)',
    textColor: 'text-red-900',
    pill: 'bg-red-100 text-red-800',
  },
  'new-arrival': {
    label: 'New Arrivals',
    badge: 'new_arrival',
    icon: '✨',
    description: 'Fresh drops! Discover the latest additions to our collection.',
    gradient: 'from-sky-400 via-blue-500 to-indigo-500',
    patternColor: 'rgba(255,255,255,0.07)',
    textColor: 'text-blue-900',
    pill: 'bg-blue-100 text-blue-800',
  },
  'popular-pics': {
    label: 'Popular Picks',
    badge: 'popular_pics',
    icon: '💖',
    description: 'Everyone\'s talking about these — the community\'s all-time favourites.',
    gradient: 'from-pink-400 via-rose-500 to-fuchsia-500',
    patternColor: 'rgba(255,255,255,0.07)',
    textColor: 'text-pink-900',
    pill: 'bg-pink-100 text-pink-800',
  },
  'trending': {
    label: 'Trending Now',
    badge: 'trending',
    icon: '📈',
    description: 'What\'s hot across Bangladesh right now — don\'t miss out on the trend.',
    gradient: 'from-violet-500 via-purple-500 to-fuchsia-600',
    patternColor: 'rgba(255,255,255,0.07)',
    textColor: 'text-purple-900',
    pill: 'bg-purple-100 text-purple-800',
  },
};

export default function TagPageClient({ slug }) {
  const router = useRouter();
  const config = TAG_CONFIG[slug] || {
    label: slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
    badge: slug.replace(/-/g, '_'),
    icon: '🏷️',
    description: `Browse all ${slug.replace(/-/g, ' ')} products.`,
    gradient: 'from-gray-400 to-gray-600',
    patternColor: 'rgba(255,255,255,0.06)',
    textColor: 'text-gray-900',
    pill: 'bg-gray-100 text-gray-800',
  };

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const [sortOption, setSortOption] = useState('position');
  const [activeFilters, setActiveFilters] = useState({ priceRange: [0, 0], expandedSubIds: new Set(), brands: new Set(), minRating: null });

  useEffect(() => {
    if (!slug) return;
    // reset UI state when slug changes
    setSortOption('position');
    setShowAll(false);
    setActiveFilters({ priceRange: [0, 0], expandedSubIds: new Set(), brands: new Set(), minRating: null });
    setLoading(true);
    (async () => {
      try {
        const resp = await fetch(
          `${API}/api/products?badge=${encodeURIComponent(config.badge)}&limit=500`
        );
        const json = await resp.json();
        const items = (json.items || []).map(p => ({
          ...p,
          price: p.price || (p.variants && p.variants[0]?.price) || 0,
        }));
        setProducts(items);
      } catch (err) {
        console.error(err);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [slug, config.badge]);

  // live filtering via useMemo
  const filtered = useMemo(() => {
    const { priceRange, brands, minRating } = activeFilters;
    return products.filter(p => {
      const pr = p.price ?? p.variants?.[0]?.price ?? 0;
      if (pr < priceRange[0] || pr > priceRange[1]) return false;
      if (brands.size > 0 && (!p.department || !brands.has(p.department))) return false;
      if (minRating !== null && (p.averageRating || 0) < minRating) return false;
      return true;
    });
  }, [products, activeFilters]);

  const hasExpress = (p) => {
    return (
      (Array.isArray(p.tags) && (p.tags.includes('express') || p.tags.includes('express_delivery')))
      || p.express || p.expressDelivery
    );
  };

  const sorted = useMemo(() => {
    let list = [...filtered];
    switch (sortOption) {
      case 'newest':
        list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        break;
      case 'oldest':
        list.sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
        break;
      case 'nameAsc':
        list.sort((a, b) => (a.title || a.name || '').localeCompare(b.title || b.name || ''));
        break;
      case 'nameDesc':
        list.sort((a, b) => (b.title || b.name || '').localeCompare(a.title || a.name || ''));
        break;
      case 'priceHigh':
        list.sort((a, b) => (b.price || 0) - (a.price || 0));
        break;
      case 'priceLow':
        list.sort((a, b) => (a.price || 0) - (b.price || 0));
        break;
      case 'expressDelivery':
        list.sort((a, b) => (hasExpress(b) ? -1 : 1) - (hasExpress(a) ? -1 : 1));
        break;
      default:
        break;
    }
    return list;
  }, [filtered, sortOption]);

  const displayed = showAll ? sorted : sorted.slice(0, 20);

  return (
    <div>
      {/* Back button */}
      <div className="max-w-7xl mx-auto px-4 pt-4">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition"
        >
          <span className="text-xs">‹</span> Back
        </button>
      </div>
      {/* ── Hero Banner ── */}
      <div className={`relative bg-gradient-to-r ${config.gradient} overflow-hidden`}>
        {/* Subtle dot pattern overlay */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle, ${config.patternColor} 1px, transparent 1px)`,
            backgroundSize: '24px 24px',
          }}
        />

        <div className="relative max-w-7xl mx-auto px-6 py-12 md:py-16 flex flex-col md:flex-row items-center gap-6">
          {/* Text */}
          <div className="flex-1 text-white">
            <div className="flex items-center gap-3 mb-3">
              <span
                className="text-5xl drop-shadow-lg select-none"
                style={{ filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.25))' }}
              >
                {config.icon}
              </span>
              <span className="bg-white/20 backdrop-blur-sm text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-widest">
                {config.label}
              </span>
            </div>

            <h1 className="text-4xl md:text-5xl font-extrabold leading-tight drop-shadow-sm">
              {config.label}
            </h1>
            <p className="mt-3 text-base md:text-lg text-white/85 max-w-lg">
              {config.description}
            </p>

            
          </div>

          {/* Decorative circles */}
          <div className="hidden md:flex gap-3 flex-shrink-0">
            {[80, 60, 44].map((size, i) => (
              <div
                key={i}
                className="rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center animate-pulse"
                style={{ width: size, height: size, animationDelay: `${i * 0.3}s` }}
              >
                <span style={{ fontSize: size * 0.45 }}>{config.icon}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Wave bottom */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 40" preserveAspectRatio="none" className="w-full h-10 fill-white">
            <path d="M0,40 C360,0 1080,40 1440,10 L1440,40 Z" />
          </svg>
        </div>
      </div>

      {/* ── Page Content ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="text-sm text-gray-500 mb-6">
          <Link href="/" className="hover:underline">Home</Link>
          {' '}&gt;{' '}
          <span className="text-gray-900 font-medium">{config.label}</span>
        </div>

        {loading ? (
          <div className="py-32 text-center text-gray-400 text-lg">Loading products…</div>
        ) : products.length === 0 ? (
          <div className="py-32 text-center text-gray-400 text-lg">
            No {config.label} products right now. Check back soon!
          </div>
        ) : (
          <div className="grid grid-cols-12 gap-6">
            {/* Filters */}
            <div className="col-span-12 lg:col-span-3">
              <ProductFilters
                products={products}
                subcategories={[]}
                onChange={f => { setActiveFilters(f); setShowAll(false); }}
              />
            </div>

            {/* Products */}
            <div className="col-span-12 lg:col-span-9">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-800">
                  {config.icon} {config.label}
                </h2>
                <SortDropdown value={sortOption} onChange={setSortOption} />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {displayed.map(p => (
                  <ProductCard key={p._id} product={p} showDiscount={true} maxTags={2} />
                ))}
              </div>

              {filtered.length > 20 && (
                <div className="mt-8 flex justify-center">
                  <button
                    onClick={() => setShowAll(s => !s)}
                    className="px-6 py-2.5 bg-white border border-gray-300 rounded-full text-sm font-medium hover:bg-gray-50 transition"
                  >
                    {showAll ? 'Show less' : `Show all ${sorted.length} products`}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
