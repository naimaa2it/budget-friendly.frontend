"use client";

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCategories } from '@/components/context/CategoryContext';

const DEFAULT_TAGS = [
  { name: 'Eid Offer', icon: '🌙', color: 'text-emerald-600', href: '/tag/best-offer-on-eid-fest' },
  { name: 'Free Shipping', icon: '🚚', color: 'text-green-600' },
  { name: 'Best Seller', icon: '⭐', color: 'text-yellow-600' },
  { name: 'Hot', icon: '🔥', color: 'text-red-600' },
  { name: 'New Arrival', icon: '✨', color: 'text-blue-600' },
  { name: 'Popular Pics', icon: '💖', color: 'text-pink-600' },
  { name: 'Trending', icon: '📈', color: 'text-purple-600' },
  { name: 'Limited Edition', icon: '💎', color: 'text-purple-600' },
  { name: '400 cashback', icon: '💸', color: 'text-cyan-600', href: '/tag/up-to-400-bkash-cashback' },
  { name: '1000 cashback', icon: '💳', color: 'text-sky-600', href: '/tag/up-to-1000-tk-visa-mastercard' },
  { name: 'Under 999', icon: '🧾', color: 'text-lime-700', href: '/tag/under-999-deals' },
  { name: 'Points Save', icon: '🏆', color: 'text-teal-600', href: '/tag/get-points-save-more' },
  { name: 'Featured', icon: '🏅', color: 'text-indigo-600' },
  { name: 'Coupon', icon: '🎟️', color: 'text-teal-600', href: '/#offers' },
  { name: 'Flash Sale', icon: '⚡', color: 'text-rose-600' },
  { name: 'Clearance', icon: '🏷️', color: 'text-amber-600' },
];

export default function MegaMenuNavbar() {
  const { categories, subcategories, loading } = useCategories();
  const [hoveredCategory, setHoveredCategory] = useState(null);
  const [menuTags, setMenuTags] = useState(DEFAULT_TAGS);
  const timeoutRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  useEffect(() => {
    let cancelled = false;
    const loadMenuTags = async () => {
      try {
        const resp = await fetch(`${API}/api/admin/top-banner`, { cache: 'no-store' });
        const data = await resp.json();
        const tags = Array.isArray(data?.megaMenuTags)
          ? data.megaMenuTags
              .filter(t => t && t.name)
              .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
              .filter(t => t.isActive !== false)
          : [];
        if (!cancelled) {
          setMenuTags(tags.length ? tags : DEFAULT_TAGS);
        }
      } catch {
        if (!cancelled) setMenuTags(DEFAULT_TAGS);
      }
    };
    loadMenuTags();
    return () => { cancelled = true; };
  }, [API]);

  // Manual scroll controls
  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -200, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 200, behavior: 'smooth' });
    }
  };

  const handleMouseEnter = (categoryId) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setHoveredCategory(categoryId);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setHoveredCategory(null);
    }, 150);
  };

  const getCategorySubcategories = (categoryId) => {
    const subs = subcategories[categoryId] || [];
    // Group subcategories by level for better organization
    const level1 = subs.filter(s => s.level === 1);
    return level1;
  };

  const getSubSubcategories = (subcategoryId) => {
    return subcategories[subcategoryId] || [];
  };

  return (
    <div className="bg-white border-b border-gray-200 relative">
      <div className="max-w-7xl mx-auto relative">
        {/* Single Row: Tags First, then Categories with Arrows */}
        <nav>
          {/* Left Arrow */}
          <button
            onClick={scrollLeft}
            className="flex absolute left-2 top-0 bottom-0 z-10 items-center justify-center w-6 md:w-8 bg-gradient-to-r from-white via-white to-transparent hover:from-gray-50"
            aria-label="Scroll left"
          >
            <svg className="w-3 h-3 md:w-4 md:h-4 text-rose-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Scrollable Container */}
          <div
            ref={scrollContainerRef}
            className="flex items-center gap-0.5 sm:gap-1 px-7 md:px-10 py-0 overflow-x-auto scrollbar-hide scroll-smooth -mt-1.5"
          >
            {/* Tags */}
            {menuTags.map((tag, idx) => {
              const isCoupon = String(tag.href || '') === '/#offers';
              return (
                <Link
                  key={`${tag.name}-${idx}`}
                  href={tag.href || `/tag/${tag.name.toLowerCase().replace(/\s+/g, '-')}`}
                  scroll={false}
                  onClick={e => {
                    if (isCoupon && typeof window !== 'undefined' && window.location.pathname === '/') {
                      // same-page anchor; prevent next/router from handling navigation
                      e.preventDefault();
                      const el = document.getElementById('offers');
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }
                  }}
                  className={`flex items-center gap-1 px-2 md:px-2.5 py-0.5 whitespace-nowrap text-[12px] font-medium ${tag.color || 'text-gray-700'} hover:bg-gray-50 transition-colors shrink-0`}
                >
                  <span className="text-sm">{tag.icon || '🏷️'}</span>
                  <span className="inline text-[10px] sm:text-[12px]">{tag.name}</span>
                </Link>
              );
            })}

            {/* Main Categories */}
            {categories.map((category) => {
              const hasSubcategories = getCategorySubcategories(category._id).length > 0;
              const isHovered = hoveredCategory === category._id;

              return (
                <div
                  key={category._id}
                  className="shrink-0"
                  onMouseEnter={() => hasSubcategories && handleMouseEnter(category._id)}
                  onMouseLeave={handleMouseLeave}
                >
                  <Link
                    href={`/category/${category.slug}`}
                    className={`flex items-center gap-0.5 md:gap-1 px-2 md:px-3 py-0.5 text-xs font-medium text-gray-700 hover:text-red-600 hover:bg-pink-50 transition-colors duration-150 whitespace-nowrap ${
                      isHovered ? 'text-red-600 bg-pink-50' : ''
                    }`}
                  >
                    <span className="text-xs sm:text-sm">{category.name}</span>
                    {hasSubcategories && (
                      <svg
                        className={`w-3 h-3 transition-transform ${isHovered ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    )}
                  </Link>
                </div>
              );
            })}
          </div>

          {/* Right Arrow */}
          <button
            onClick={scrollRight}
            className="flex absolute right-2 top-0 bottom-0 z-10 items-center justify-center w-6 md:w-8 bg-gradient-to-l from-white via-white to-transparent hover:from-gray-50"
            aria-label="Scroll right"
          >
            <svg className="w-3 h-3 md:w-4 md:h-4 text-rose-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </nav>

        {/* Mega Menu Dropdown - Positioned outside scroll container */}
        {hoveredCategory && (
          <div
            className="hidden md:block absolute left-4 top-full bg-white border border-gray-200 rounded-b-lg shadow-lg z-[100]"
            onMouseEnter={() => {
              if (timeoutRef.current) clearTimeout(timeoutRef.current);
            }}
            onMouseLeave={handleMouseLeave}
          >
            <div className="px-6 py-6">
              <div className="grid grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-4"
                style={{ maxHeight: '70vh', overflowY: 'auto' }}
              >
                {getCategorySubcategories(hoveredCategory).map((subcategory) => {
                  const subSubcats = getSubSubcategories(subcategory._id);
                  const hoveredCategorySlug = categories.find(c => c._id === hoveredCategory)?.slug || '';

                  return (
                    <div key={subcategory._id} className="space-y-3">
                      {/* Subcategory with Icon */}
                      <Link
                        href={`/category/${hoveredCategorySlug}/${subcategory.slug}`}
                        className="flex items-center gap-2.5 group"
                      >
                        {/* Small Icon/Image */}
                        {subcategory.images && subcategory.images[0]?.url ? (
                          <div className="relative w-9 h-9 rounded-full overflow-hidden shrink-0 bg-gray-100">
                            <Image
                              src={subcategory.images[0].url}
                              alt={subcategory.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-pink-50 flex items-center justify-center shrink-0 group-hover:bg-pink-100 transition-colors">
                            <span className="text-lg">📦</span>
                          </div>
                        )}
                        
                        {/* Category Name */}
                        <h3 className="font-semibold text-sm text-gray-800 group-hover:text-rose-600 transition-colors">
                          {subcategory.name}
                        </h3>
                      </Link>
                      
                      {/* Sub-subcategories List */}
                      {subSubcats.length > 0 && (
                        <ul className="space-y-2 pl-0">
                          {subSubcats.map((subSubcat) => (
                            <li key={subSubcat._id}>
                              <Link
                                href={`/category/${subcategory.slug}/${subSubcat.slug}`}
                                className="text-xs text-gray-600 hover:text-red-600 hover:underline transition-colors block"
                              >
                                {subSubcat.name}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
