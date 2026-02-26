"use client";

import React, { useEffect, useMemo, useState } from 'react';
import ProductCard from './ProductCard';
import CategoryFilters from './CategoryFilters';
import Link from 'next/link';
import { useUser } from '@/components/context/UserContext';
import { useCategories } from '@/components/context/CategoryContext';
import { FaTrash } from 'react-icons/fa';
import Image from 'next/image';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default function CategoryPageClient({ slug }) {
  const { getCategoryBySlug, categoriesMap, getSubcategories } = useCategories();
  const [category, setCategory] = useState(null);
  const [parentCategory, setParentCategory] = useState(null);
  const [subcategories, setSubcategories] = useState([]);
  const [isSubcategoryPage, setIsSubcategoryPage] = useState(false);
  const [products, setProducts] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [bestSelling, setBestSelling] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  // fetch products using category from context
  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    (async () => {
      try {
        // Get category from context instead of fetching
        let match = getCategoryBySlug(slug);
        
        if (!match) {
          setCategory({ name: slug, description: '' });
          setSubcategories([]);
          setProducts([]);
          setFiltered([]);
          setIsSubcategoryPage(false);
          setLoading(false);
          return;
        }

        setCategory(match);
        const subs = getSubcategories(match._id);
        setSubcategories(subs);
        
        // determine if this category has a parent
        setIsSubcategoryPage(Boolean(match.parent));
        if (match.parent && categoriesMap[match.parent]) {
          setParentCategory(categoriesMap[match.parent]);
        } else {
          setParentCategory(null);
        }

        // gather all descendant category ids (include self)
        const collectIds = (catId) => {
          let ids = [String(catId)];
          const children = getSubcategories(catId);
          children.forEach(c => ids = ids.concat(collectIds(c._id)));
          return ids;
        };
        const ids = collectIds(match._id);
        const param = ids.join(',');
        
        // Fetch products
        const prodResp = await fetch(`${API}/api/products?categoryId=${encodeURIComponent(param)}&limit=200`);
        const prodJson = await prodResp.json();
        const items = (prodJson.items || []).map(p => ({
          ...p,
          price: p.price || (p.variants && p.variants[0]?.price) || 0,
        }));
        setProducts(items);
        setFiltered(items);
        
        // determine best-selling subset
        const best = items.filter(p => Array.isArray(p.badges) && p.badges.includes('best_seller'));
        setBestSelling(best);
      } catch (err) {
        console.error(err);
        setProducts([]);
        setFiltered([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [slug, getCategoryBySlug, categoriesMap, getSubcategories]);

  const stats = useMemo(() => {
    const prices = products.map(p => p.price || 0);
    const min = prices.length ? Math.min(...prices) : 0;
    const max = prices.length ? Math.max(...prices) : 1000;
    return { minPrice: min, maxPrice: max, total: products.length };
  }, [products]);

  const applyFilters = ({ minPrice, maxPrice, subIds, reset }) => {
    console.log('applying filters', { minPrice, maxPrice, subIds, reset, total: products.length });
    if (reset) { setFiltered(products); setShowAll(false); return; }
    const result = products.filter(p => {
      const pr = p.price || 0;
      if (pr < (minPrice ?? 0) || pr > (maxPrice ?? Infinity)) return false;
      if (subIds && subIds.length) {
        return subIds.includes(String(p.categoryId));
      }
      return true;
    });
    console.log('filtered count', result.length);
    setFiltered(result);
    setShowAll(false);
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
      <div className="text-sm text-gray-500 mb-4">
        <Link href="/" className="hover:underline">Home</Link>
        {category && category.name ? (
          <>
            {' '} &gt; 
            {parentCategory ? (
              <>
                <Link href={`/category/${parentCategory.slug || (parentCategory.name||'').toLowerCase().replace(/\s+/g,'-')}`} className="hover:underline">
                  {parentCategory.name}
                </Link>
                {' '} &gt; <span className="text-gray-900">{category.name}</span>
              </>
            ) : (
              <span className="text-gray-900">{category.name}</span>
            )}
          </>
        ) : null}
      </div>
      <div className="mb-3 text-center">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900">{category?.name || slug}</h1>
        <p className="text-gray-600 mt-2">{category?.description || `Products for ${category?.name || slug}.`}</p>
      </div>

      {/* Subcategory circles */}
      {!isSubcategoryPage && subcategories.length > 0 && (
        <div className="flex gap-6 flex-wrap justify-center items-center mb-8">
          {subcategories.map((sub) => {
            // prefer explicit slug from backend; fallback to name-based slug
            const sslug = sub.slug || (sub.name || '').toLowerCase().replace(/\s+/g, '-');
            return (
              <div key={sub._id} className="relative flex flex-col items-center w-36">
                <Link href={`/category/${sslug}`} className="flex flex-col items-center group cursor-pointer">
                  <div className="w-28 h-28 rounded-full bg-gray-10 border-6 border-[#f9f3f1] shadow-md flex items-center justify-center overflow-hidden group-hover:scale-105 transition-transform">
                    <Image src={(sub.images && sub.images[0] && sub.images[0].url) ? sub.images[0].url : '/assets/placeholder.svg'} alt={sub.name} width={80} height={80} className="w-30 h-30 object-contain" />
                  </div>
                  <div className="mt-3 text-sm text-center font-medium text-gray-700">{sub.name}</div>
                </Link>
              </div>
            );
          })}
        </div>
      )} 

      {/* Best Selling section sits full width above filter/product flex */}
      <div className="mb-6 mt-2">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-3xl font-semibold">Best Selling</h2>
          <button className="px-4 py-2 border rounded-full text-sm hover:bg-gray-50">see all →</button>
        </div>

        {loading ? (
          <div className="py-24 text-center text-gray-500">Loading products...</div>
        ) : bestSelling.length === 0 ? (
          <div className="py-24 text-center text-gray-500">No best-selling products available.</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {bestSelling.slice(0, 5).map(p => (
              <ProductCard
                key={p._id}
                product={p}
                imageWidth={360}
                imageHeight={160}
                showActionsOnHover={false} // always show add/cart/details/wishlist icons
              />
            ))}
          </div>
        )}
      </div>

      {/* all-products heading spans full width */}
      {!loading && filtered.length > 0 && (
        <h2 className="text-3xl font-semibold mt-12 mb-3">All Products</h2>
      )}
      {/* product/filter grid below best-selling */}
      <div className="grid grid-cols-12 gap-4">
        {/* Filters occupy 4/12 columns */}
        <div className="col-span-12 lg:col-span-3">
          <CategoryFilters stats={stats} subcategories={subcategories} onApply={applyFilters} />
        </div>
        {/* Products occupy 8/12 columns */}
        <div className="col-span-12 lg:col-span-9">
          {!loading && filtered.length > 0 && (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {(showAll ? filtered : filtered.slice(0, 5)).map(p => (
                  <ProductCard key={p._id} product={p} />
                ))}
              </div>
            </>
          )}

          {filtered.length > 5 && (
            <div className="mt-6 flex justify-center">
              <button className="px-4 py-2 bg-white border rounded-md" onClick={() => setShowAll(s => !s)}>{showAll ? 'Show less' : `Show all (${filtered.length})`}</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
