"use client";

import React, { useEffect, useMemo, useState } from 'react';
import ProductCard from './ProductCard';
import CategoryFilters from './CategoryFilters';
import Link from 'next/link';
import { useUser } from '@/components/context/UserContext';
import { FaTrash } from 'react-icons/fa';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default function CategoryPageClient({ slug }) {
  const [category, setCategory] = useState(null);
  const [subcategories, setSubcategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  // fetch category tree + products
  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    (async () => {
      try {
        const catsResp = await fetch(`${API}/api/products/categories`);
        const catsJson = await catsResp.json();
        const flat = [];
        const walk = (nodes) => {
          for (const n of (nodes || [])) {
            flat.push(n);
            if (n.children && n.children.length) walk(n.children);
          }
        };
        walk(catsJson.categories || []);

        const match = flat.find(c => (c.name || '').replace(/\s+/g, '-') === slug);
        if (!match) {
          setCategory({ name: slug, description: '' });
          setSubcategories([]);
          setProducts([]);
          setFiltered([]);
          setLoading(false);
          return;
        }

        setCategory(match);
        setSubcategories(match.children || []);

        // fetch products for this category id (server doesn't have price filter, so fetch and filter client-side)
        const prodResp = await fetch(`${API}/api/products?categoryId=${encodeURIComponent(match._id)}&limit=200`);
        const prodJson = await prodResp.json();
        const items = (prodJson.items || []).map(p => ({
          ...p,
          price: p.price || (p.variants && p.variants[0]?.price) || 0,
        }));
        setProducts(items);
        setFiltered(items);
      } catch (err) {
        console.error(err);
        setProducts([]);
        setFiltered([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [slug]);

  const stats = useMemo(() => {
    const prices = products.map(p => p.price || 0);
    const min = prices.length ? Math.min(...prices) : 0;
    const max = prices.length ? Math.max(...prices) : 1000;
    return { minPrice: min, maxPrice: max, total: products.length };
  }, [products]);

  const applyFilters = ({ minPrice, maxPrice, subIds, reset }) => {
    if (reset) { setFiltered(products); return; }
    const result = products.filter(p => {
      const pr = p.price || 0;
      if (pr < (minPrice ?? 0) || pr > (maxPrice ?? Infinity)) return false;
      if (subIds && subIds.length) {
        return subIds.includes(String(p.categoryId));
      }
      return true;
    });
    setFiltered(result);
  };

  const { user } = useUser();

  const deleteProduct = async (id) => {
    if (!confirm('Are you sure you want to archive this product?')) return;
    try {
      const r = await fetch(`${API}/api/admin/products/${id}`, { method: 'DELETE', credentials: 'include' });
      const body = await r.json();
      if (!r.ok) return alert(body.error || 'Delete failed');
      setProducts(prev => prev.filter(x => x._id !== id));
      setFiltered(prev => prev.filter(x => x._id !== id));
    } catch (err) {
      console.error(err);
      alert('Delete failed');
    }
  }; 

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb & header */}
      <div className="text-sm text-gray-500 mb-4">Home &gt; Category &gt; <span className="text-gray-900">{category?.name || slug}</span></div>
      <div className="mb-6 flex items-start gap-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{category?.name || slug}</h1>
          <p className="text-gray-600 mt-2">{category?.description || `Products for ${category?.name || slug}.`}</p>
        </div>
        {category?.images && category.images[0] && (
          <div className="w-28 h-28 rounded-lg overflow-hidden border bg-gray-50">
            <img src={category.images[0].url} alt={category.name} className="w-full h-full object-cover" />
          </div>
        )}
      </div>

      {/* Subcategory circles */}
      {subcategories.length > 0 && (
        <div className="flex gap-6 flex-wrap items-center mb-8">
          {subcategories.map((sub) => {
            const sslug = (sub.name || '').replace(/\s+/g, '-');
            return (
              <div key={sub._id} className="relative flex flex-col items-center w-36">
                {user?.role === 'admin' && (
                  <button
                    onClick={async (e) => {
                      e.stopPropagation(); e.preventDefault();
                      if (!confirm('Delete this subcategory?')) return;
                      try {
                        const r = await fetch(`${API}/api/admin/categories/${sub._id}`, { method: 'DELETE', credentials: 'include' });
                        const body = await r.json();
                        if (!r.ok) return alert(body.error || 'Delete failed');
                        setSubcategories(prev => prev.filter(s => s._id !== sub._id));
                      } catch (err) {
                        console.error(err);
                        alert('Delete failed');
                      }
                    }}
                    className="absolute -top-2 -right-2 z-20 bg-white rounded-full p-1 shadow border border-gray-200 hover:bg-red-600 hover:text-white transition"
                    aria-label="Delete subcategory"
                  >
                    <FaTrash className="w-4 h-4" />
                  </button>
                )}

                <Link href={`/category/${sslug}`} className="flex flex-col items-center group cursor-pointer">
                  <div className="w-28 h-28 rounded-full bg-gray-50 border border-gray-100 shadow-md flex items-center justify-center overflow-hidden group-hover:scale-105 transition-transform">
                    <img src={(sub.images && sub.images[0] && sub.images[0].url) ? sub.images[0].url : '/assets/placeholder.svg'} alt={sub.name} className="w-20 h-20 object-contain" />
                  </div>
                  <div className="mt-3 text-sm text-center font-medium text-gray-700">{sub.name}</div>
                </Link>
              </div>
            );
          })}
        </div>
      )} 

      <div className="grid grid-cols-1 lg:grid-cols-[1fr,280px] gap-6">
        {/* Main product area */}
        <main>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold">Best Selling</h2>
            <button className="px-4 py-2 border rounded-full text-sm hover:bg-gray-50">see all →</button>
          </div>

          {loading ? (
            <div className="py-24 text-center text-gray-500">Loading products...</div>
          ) : filtered.length === 0 ? (
            <div className="py-24 text-center text-gray-500">No products found in this category.</div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {(showAll ? filtered : filtered.slice(0, 5)).map(p => (
                <ProductCard key={p._id} product={p} onDelete={user?.role === 'admin' ? deleteProduct : undefined} />
              ))} 
            </div>
          )}

          {filtered.length > 5 && (
            <div className="mt-6 flex justify-center">
              <button className="px-4 py-2 bg-white border rounded-md" onClick={() => setShowAll(s => !s)}>{showAll ? 'Show less' : `Show all (${filtered.length})`}</button>
            </div>
          )}
        </main>

        {/* Sidebar filters */}
        <CategoryFilters stats={stats} subcategories={subcategories} onApply={applyFilters} />
      </div>
    </div>
  );
}
