"use client";

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import ProductCard from './ProductCard';
import Link from 'next/link';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default function SearchResultsClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.get('q') || '';

  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);

  // filter state
  const [priceMin, setPriceMin] = useState(0);
  const [priceMax, setPriceMax] = useState(0);
  const [priceRange, setPriceRange] = useState([0, 0]);
  const [selectedCategories, setSelectedCategories] = useState(new Set());
  const [selectedBrands, setSelectedBrands] = useState(new Set());

  // fetch products whenever query changes
  useEffect(() => {
    if (!query.trim()) { setAllProducts([]); setTotal(0); return; }
    setLoading(true);
    setSelectedCategories(new Set());
    setSelectedBrands(new Set());
    (async () => {
      try {
        const res = await fetch(`${API}/api/products?q=${encodeURIComponent(query.trim())}&limit=100`);
        const json = await res.json();
        const items = json.items || [];
        setAllProducts(items);
        setTotal(json.total || items.length);

        // set price range from results
        const prices = items.map(p => p.price ?? p.variants?.[0]?.price ?? 0).filter(Boolean);
        const min = prices.length ? Math.floor(Math.min(...prices)) : 0;
        const max = prices.length ? Math.ceil(Math.max(...prices)) : 10000;
        setPriceMin(min);
        setPriceMax(max);
        setPriceRange([min, max]);
      } catch (err) {
        console.error('search results error', err);
        setAllProducts([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [query]);

  // derive filter options
  const categoryOptions = useMemo(() => {
    const map = new Map();
    allProducts.forEach(p => {
      const name = p.category || 'Uncategorized';
      const id = String(p.categoryId || name);
      if (!map.has(id)) map.set(id, { id, name, count: 0 });
      map.get(id).count++;
    });
    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [allProducts]);

  const brandOptions = useMemo(() => {
    const map = new Map();
    allProducts.forEach(p => {
      if (!p.department) return;
      const name = p.department;
      if (!map.has(name)) map.set(name, { name, count: 0 });
      map.get(name).count++;
    });
    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [allProducts]);

  // apply filters
  const filtered = useMemo(() => {
    return allProducts.filter(p => {
      const price = p.price ?? p.variants?.[0]?.price ?? 0;
      if (price < priceRange[0] || price > priceRange[1]) return false;
      if (selectedCategories.size > 0) {
        const id = String(p.categoryId || p.category || 'Uncategorized');
        if (!selectedCategories.has(id)) return false;
      }
      if (selectedBrands.size > 0) {
        if (!p.department || !selectedBrands.has(p.department)) return false;
      }
      return true;
    });
  }, [allProducts, priceRange, selectedCategories, selectedBrands]);

  const toggleCategory = useCallback((id) => {
    setSelectedCategories(prev => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });
  }, []);

  const toggleBrand = useCallback((name) => {
    setSelectedBrands(prev => {
      const s = new Set(prev);
      s.has(name) ? s.delete(name) : s.add(name);
      return s;
    });
  }, []);

  const resetFilters = () => {
    setPriceRange([priceMin, priceMax]);
    setSelectedCategories(new Set());
    setSelectedBrands(new Set());
  };

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
          {/* ── Filters sidebar ── */}
          <aside className="hidden lg:block w-72 flex-shrink-0">
            <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-5 sticky top-20 space-y-6">
              {/* Price */}
              <div>
                <h3 className="text-base font-semibold mb-3">Price</h3>
                <div className="relative h-2 bg-gray-200 rounded-full mb-4">
                  <div
                    className="absolute h-2 bg-red-500 rounded-full"
                    style={{
                      left: `${((priceRange[0] - priceMin) / Math.max(priceMax - priceMin, 1)) * 100}%`,
                      right: `${100 - ((priceRange[1] - priceMin) / Math.max(priceMax - priceMin, 1)) * 100}%`,
                    }}
                  />
                  <input type="range" min={priceMin} max={priceMax} value={priceRange[0]}
                    onChange={e => setPriceRange(r => [Math.min(Number(e.target.value), r[1]), r[1]])}
                    className="absolute w-full h-2 opacity-0 cursor-pointer" style={{ zIndex: 2 }} />
                  <input type="range" min={priceMin} max={priceMax} value={priceRange[1]}
                    onChange={e => setPriceRange(r => [r[0], Math.max(Number(e.target.value), r[0])])}
                    className="absolute w-full h-2 opacity-0 cursor-pointer" style={{ zIndex: 2 }} />
                </div>
                <div className="flex items-center gap-2">
                  <input type="number" min={priceMin} max={priceRange[1]}
                    value={priceRange[0]}
                    onChange={e => setPriceRange(r => [Math.min(Number(e.target.value), r[1]), r[1]])}
                    className="w-full border border-gray-200 rounded-md px-2 py-1 text-sm text-center focus:outline-none focus:border-red-400"
                  />
                  <span className="text-gray-400">—</span>
                  <input type="number" min={priceRange[0]} max={priceMax}
                    value={priceRange[1]}
                    onChange={e => setPriceRange(r => [r[0], Math.max(Number(e.target.value), r[0])])}
                    className="w-full border border-gray-200 rounded-md px-2 py-1 text-sm text-center focus:outline-none focus:border-red-400"
                  />
                </div>
              </div>

              {/* Category */}
              {categoryOptions.length > 1 && (
                <div>
                  <h3 className="text-base font-semibold mb-3">Category</h3>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {categoryOptions.map(cat => (
                      <label key={cat.id} className="flex items-center gap-2 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={selectedCategories.has(cat.id)}
                          onChange={() => toggleCategory(cat.id)}
                          className="accent-red-500 w-4 h-4 rounded"
                        />
                        <span className="text-sm text-gray-700 group-hover:text-red-600 transition-colors flex-1">
                          {cat.name}
                        </span>
                        <span className="text-xs text-gray-400">({cat.count})</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Brands */}
              {brandOptions.length > 0 && (
                <div>
                  <h3 className="text-base font-semibold mb-3">Brands</h3>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {brandOptions.map(b => (
                      <label key={b.name} className="flex items-center gap-2 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={selectedBrands.has(b.name)}
                          onChange={() => toggleBrand(b.name)}
                          className="accent-red-500 w-4 h-4 rounded"
                        />
                        <span className="text-sm text-gray-700 group-hover:text-red-600 transition-colors flex-1 uppercase">
                          {b.name}
                        </span>
                        <span className="text-xs text-gray-400">({b.count})</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Reset */}
              {(selectedCategories.size > 0 || selectedBrands.size > 0 || priceRange[0] !== priceMin || priceRange[1] !== priceMax) && (
                <button
                  onClick={resetFilters}
                  className="w-full py-2 border border-red-400 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors"
                >
                  Reset Filters
                </button>
              )}
            </div>
          </aside>

          {/* ── Products ── */}
          <div className="flex-1 min-w-0">
            {/* Result count */}
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
