"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import ProductCard from './ProductCard';
import ProductFilters from './ProductFilters';
import Link from 'next/link';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default function SearchResultsClient() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';

  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [activeFilters, setActiveFilters] = useState({
    priceRange: [0, 0],
    expandedSubIds: new Set(),
    brands: new Set(),
    minRating: null,
  });

  // fetch whenever query changes
  useEffect(() => {
    if (!query.trim()) { setAllProducts([]); setTotal(0); return; }
    setLoading(true);
    setActiveFilters({ priceRange: [0, 0], expandedSubIds: new Set(), brands: new Set(), minRating: null });
    (async () => {
      try {
        const res = await fetch(`${API}/api/products?q=${encodeURIComponent(query.trim())}&limit=100`);
        const json = await res.json();
        const items = json.items || [];
        setAllProducts(items);
        setTotal(json.total || items.length);
      } catch (err) {
        console.error('search results error', err);
        setAllProducts([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [query]);

  // live filtered list — reacts instantly to any filter change
  const filtered = useMemo(() => {
    const { priceRange, expandedSubIds, brands, minRating } = activeFilters;
    return allProducts.filter(p => {
      const price = p.price ?? p.variants?.[0]?.price ?? 0;
      if (price < priceRange[0] || price > priceRange[1]) return false;
      if (expandedSubIds.size > 0 && !expandedSubIds.has(String(p.categoryId))) return false;
      if (brands.size > 0 && (!p.department || !brands.has(p.department))) return false;
      if (minRating !== null && (p.averageRating || 0) < minRating) return false;
      return true;
    });
  }, [allProducts, activeFilters]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <div className="text-sm text-gray-500 mb-4">
        <Link href="/" className="hover:underline">Home</Link>
        {' '}&gt;{' '}
        <span className="text-gray-900">Search: &quot;{query}&quot;</span>
      </div>

      {/* Heading */}
      <h1 className="text-2xl font-semibold text-center mb-8 text-gray-800">
        Search result for &ldquo;<span className="font-bold"> {query} </span>&rdquo;
      </h1>

      {loading ? (
        <div className="flex justify-center items-center py-32">
          <svg className="animate-spin w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
          </svg>
        </div>
      ) : !query.trim() ? (
        <p className="text-center text-gray-500 py-24">Enter a search term to find products.</p>
      ) : allProducts.length === 0 ? (
        <p className="text-center text-gray-500 py-24">No products found for &ldquo;{query}&rdquo;.</p>
      ) : (
        <div className="flex gap-6">
          {/* Filters sidebar */}
          <div className="hidden lg:block w-72 shrink-0">
            <ProductFilters
              products={allProducts}
              subcategories={[]}
              onChange={setActiveFilters}
            />
          </div>

          {/* Products */}
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-500 mb-4">
              Showing <span className="font-semibold text-gray-800">{filtered.length}</span> of{' '}
              <span className="font-semibold text-gray-800">{total}</span> products
            </p>

            {filtered.length === 0 ? (
              <p className="text-center text-gray-500 py-24">No products match the current filters.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                {filtered.map(p => (
                  <ProductCard key={p._id} product={p} showDiscount={true} maxTags={2} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
