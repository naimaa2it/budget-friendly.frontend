"use client";

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { useCategories } from '@/components/context/CategoryContext';

const TAGS = [
  { name: 'Best Seller', icon: '⭐', color: 'text-yellow-600' },
  { name: 'Hot', icon: '🔥', color: 'text-red-600' },
  { name: 'New Arrival', icon: '✨', color: 'text-blue-600' },
  { name: 'Popular Pics', icon: '💖', color: 'text-pink-600' },
  { name: 'Trending', icon: '📈', color: 'text-purple-600' },
];

export default function MegaMenuNavbar() {
  const { categories, subcategories, loading } = useCategories();
  const [hoveredCategory, setHoveredCategory] = useState(null);
  const timeoutRef = useRef(null);

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
    <div className="bg-white ">
      <div className="max-w-[1200px] mx-auto">
        {/* Single Row: Categories First, then Tags */}
        <nav className="relative">
          <div className="flex items-center gap-1 px-2 md:px-4 py-0 overflow-x-auto scrollbar-hide">
            {/* Main Categories */}
            {categories.map((category) => {
              const hasSubcategories = getCategorySubcategories(category._id).length > 0;
              const isHovered = hoveredCategory === category._id;

              return (
                <div
                  key={category._id}
                  className="relative flex-shrink-0"
                  onMouseEnter={() => handleMouseEnter(category._id)}
                  onMouseLeave={handleMouseLeave}
                >
                  <Link
                    href={`/category/${category.slug}`}
                    className={`flex items-center gap-0.5 md:gap-1 px-2 md:px-3  text-[8px] font-medium text-gray-700 hover:text-pink-600 hover:bg-pink-50 transition-colors duration-150 whitespace-nowrap ${
                      isHovered ? 'text-pink-600 bg-pink-50' : ''
                    }`}
                  >
                    <span className="text-[12px]">{category.name}</span>
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

                  {/* Mega Menu Dropdown - Only on desktop */}
                  {hasSubcategories && isHovered && (
                    <div
                      className="hidden md:grid absolute left-0 top-full min-w-[800px] max-w-[1000px] bg-white border border-gray-200 shadow-2xl rounded-lg mt-0 p-6 grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6 z-50"
                      style={{ maxHeight: '80vh', overflowY: 'auto' }}
                      onMouseEnter={() => handleMouseEnter(category._id)}
                      onMouseLeave={handleMouseLeave}
                    >
                      {getCategorySubcategories(category._id).map((subcategory) => {
                        const subSubcats = getSubSubcategories(subcategory._id);
                        const iconMap = {
                          'Serums & Treatments': '💧',
                          'Moisturizers': '🧴',
                          'Cleansers': '🧼',
                          'Face Mask': '😷',
                          'Acne Treatment': '💊',
                          'Sun Protection': '☀️',
                          'Lip Care': '💋',
                          'Toners & Exfoliators': '✨',
                          'Eyes': '👁️',
                          'Skin Care Sets & Kits': '🎁',
                        };

                        return (
                          <div key={subcategory._id} className="space-y-2">
                            <Link
                              href={`/category/${subcategory.slug}`}
                              className="flex items-center gap-2 font-semibold text-gray-800 hover:text-pink-600 transition-colors group"
                            >
                              <span className="text-xl lg:text-2xl group-hover:scale-110 transition-transform">
                                {iconMap[subcategory.name] || '📦'}
                              </span>
                              <span className="text-xs lg:text-sm">{subcategory.name}</span>
                            </Link>
                            
                            {subSubcats.length > 0 && (
                              <ul className="space-y-1.5 ml-6 lg:ml-8">
                                {subSubcats.slice(0, 6).map((subSubcat) => (
                                  <li key={subSubcat._id}>
                                    <Link
                                      href={`/category/${subSubcat.slug}`}
                                      className="text-xs text-gray-600 hover:text-pink-600 hover:underline transition-colors block"
                                    >
                                      {subSubcat.name}
                                    </Link>
                                  </li>
                                ))}
                                {subSubcats.length > 6 && (
                                  <li>
                                    <Link
                                      href={`/category/${subcategory.slug}`}
                                      className="text-xs text-pink-600 hover:underline font-medium"
                                    >
                                      View all →
                                    </Link>
                                  </li>
                                )}
                              </ul>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}

            

            {/* Tags */}
            {TAGS.map((tag) => (
              <Link
                key={tag.name}
                href={`/products?tag=${tag.name.toLowerCase().replace(/\s+/g, '-')}`}
                className={`flex items-center gap-1 px-2 md:px-2.5 pb-0.5 whitespace-nowrap text-[12px] font-medium ${tag.color} hover:bg-gray-50 transition-colors flex-shrink-0`}
              >
                <span className="text-sm">{tag.icon}</span>
                <span className="hidden sm:inline">{tag.name}</span>
              </Link>
            ))}
          </div>
        </nav>
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
