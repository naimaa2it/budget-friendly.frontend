"use client";
import React, { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { useCategories } from "@/components/context/CategoryContext";

const CategorySidebar = ({ onLinkClick }) => {
  const { categories, loading, subcategories } = useCategories();
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [activeCategory, setActiveCategory] = useState(null);
  const [flyoutTop, setFlyoutTop] = useState(0);
  const timeoutRef = useRef(null);
  const containerRef = useRef(null);
  const listRef = useRef(null);
  const categoryRefs = useRef({});

  // Collapse when clicking anywhere outside the sidebar + flyout
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setActiveCategory(null);
        setExpandedCategory(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const updateFlyoutTop = useCallback((categoryId) => {
    if (
      !categoryId ||
      !categoryRefs.current[categoryId] ||
      !containerRef.current
    )
      return;
    const itemEl = categoryRefs.current[categoryId];
    const containerRect = containerRef.current.getBoundingClientRect();
    const itemRect = itemEl.getBoundingClientRect();
    setFlyoutTop(Math.max(0, itemRect.top - containerRect.top));
  }, []);

  const handleMouseEnter = (categoryId) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setActiveCategory(categoryId);
    updateFlyoutTop(categoryId);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setActiveCategory(null);
    }, 150);
  };

  const toggleCategory = (categoryId) => {
    setExpandedCategory(expandedCategory === categoryId ? null : categoryId);
  };

  const handleLinkClick = () => {
    if (onLinkClick) onLinkClick();
    setActiveCategory(null);
    setExpandedCategory(null);
  };

  const getSubcategoriesLevel1 = (categoryId) => {
    return (subcategories[categoryId] || []).filter(
      (s) => s.level === 1 || !s.level,
    );
  };

  const getSubSubcategories = (subcategoryId) => {
    return subcategories[subcategoryId] || [];
  };

  const activeCategoryData = categories.find((c) => c._id === activeCategory);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full flex flex-col"
      onMouseLeave={() => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
          setActiveCategory(null);
        }, 100);
      }}
    >
      {/* Scrollable category list — fills sidebar height, no scrollbar UI */}
      <div
        ref={listRef}
        className="w-full flex-1 overflow-y-auto bg-white py-2 category-list-scroll"
        style={{ scrollbarWidth: "none" }}
        onScroll={() => activeCategory && updateFlyoutTop(activeCategory)}
      >
        {/* All Products — always at top */}
        <div className="border-b border-gray-200">
          <Link
            href="/products"
            className="w-full flex items-center gap-3 px-4 py-1 transition-colors duration-200 hover:bg-pink-50 group"
            onClick={handleLinkClick}
          >
            <span className="text-xl">🛍️</span>
            <span className="font-medium text-sm text-gray-800 group-hover:text-rose-600 transition-colors whitespace-nowrap">
              All Products
            </span>
          </Link>
        </div>

        {loading
          ? [...Array(6)].map((_, i) => (
              <div key={i} className="border-b border-gray-200 pt-4 pb-3">
                <div className="flex items-center gap-3 px-4">
                  <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse" />
                  <div className="h-5 w-32 bg-gray-200 rounded animate-pulse" />
                </div>
              </div>
            ))
          : categories.map((category) => {
              const hasSubs = getSubcategoriesLevel1(category._id).length > 0;
              const isActive = activeCategory === category._id;

              return (
                <div
                  key={category._id}
                  ref={(el) => {
                    categoryRefs.current[category._id] = el;
                  }}
                  className="border-b border-gray-200"
                  onMouseEnter={() => hasSubs && handleMouseEnter(category._id)}
                >
                  <div
                    className={`w-full flex items-center justify-between transition-colors duration-200 group ${
                      isActive ? "bg-pink-50" : "hover:bg-pink-50"
                    }`}
                  >
                    <Link
                      href={`/category/${category.slug}`}
                      className="flex items-center gap-3 flex-1 px-4 py-2"
                      onClick={handleLinkClick}
                    >
                      <span className="text-xl">{category.icon}</span>
                      <span
                        className={`font-medium text-sm text-left transition-colors whitespace-nowrap truncate ${
                          isActive
                            ? "text-rose-600"
                            : "text-gray-800 group-hover:text-rose-600"
                        }`}
                      >
                        {category.name}
                      </span>
                    </Link>
                    {hasSubs && (
                      <button
                        onClick={() => toggleCategory(category._id)}
                        className="px-3 py-2 shrink-0"
                        aria-label="Expand subcategories"
                      >
                        <svg
                          className={`w-3 h-3 shrink-0 transition-transform duration-200 ${
                            isActive ? "text-rose-500" : "text-gray-400"
                          } ${expandedCategory === category._id ? "rotate-90 md:rotate-0" : ""}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </button>
                    )}
                  </div>

                  {/* Mobile accordion — 2-column grid, clear and readable */}
                  <div className="md:hidden">
                    {expandedCategory === category._id && (
                      <div className="bg-gray-50 border-t border-gray-100 px-4 py-2">
                        <div className="grid grid-cols-2 gap-x-4 gap-y-0">
                          {(subcategories[category._id] || []).map(
                            (subcategory) => (
                              <Link
                                key={subcategory._id}
                                href={`/category/${category.slug}/${subcategory.slug}`}
                                className="flex items-center gap-1.5 py-1 text-xs text-gray-700 hover:text-rose-600 transition-colors duration-150 border-b border-gray-100"
                                onClick={handleLinkClick}
                              >
                                <span className="w-1 h-1 rounded-full bg-rose-300 shrink-0" />
                                {subcategory.name}
                              </Link>
                            ),
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
      </div>

      {/* Desktop flyout panel — content-adaptive width and height, 3 columns */}
      {activeCategory && activeCategoryData && (
        <div
          className="hidden md:block absolute left-full z-[200] bg-white border border-gray-200 shadow-2xl w-max"
          style={{ top: flyoutTop }}
          onMouseEnter={() => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
          }}
          onMouseLeave={() => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            timeoutRef.current = setTimeout(() => {
              setActiveCategory(null);
            }, 100);
          }}
        >
          {/* Category heading — bold */}
          <div className="px-5 py-2.5 border-b border-gray-100 bg-pink-50">
            <Link
              href={`/category/${activeCategoryData.slug}`}
              className="font-bold text-sm text-rose-600 hover:underline"
              onClick={handleLinkClick}
            >
              {activeCategoryData.name}
            </Link>
          </div>

          {/* Subcategories — not bold, 3 columns, full text no truncation */}
          <div className="px-5 py-3">
            <div className="grid grid-cols-3 gap-x-10 gap-y-0.5">
              {getSubcategoriesLevel1(activeCategory).map((subcategory) => (
                <Link
                  key={subcategory._id}
                  href={`/category/${activeCategoryData.slug}/${subcategory.slug}`}
                  className="block py-1.5 text-sm font-normal text-gray-600 whitespace-nowrap hover:text-rose-600 transition-colors"
                  onClick={handleLinkClick}
                >
                  {subcategory.name}
                </Link>
              ))}
            </div>
          </div>

          {/* View all */}
          <div className="px-5 py-2.5 border-t border-gray-100">
            <Link
              href={`/category/${activeCategoryData.slug}`}
              className="text-xs font-semibold text-rose-600 hover:underline"
              onClick={handleLinkClick}
            >
              View all in {activeCategoryData.name} →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategorySidebar;
