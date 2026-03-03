"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useCategories } from "@/components/context/CategoryContext";

const CategorySidebar = ({ onLinkClick }) => {
  const { categories, loading, subcategories } = useCategories();
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [activeCategory, setActiveCategory] = useState(null);
  const timeoutRef = useRef(null);

  const handleMouseEnter = (categoryId) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setActiveCategory(categoryId);
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
    return (subcategories[categoryId] || []).filter((s) => s.level === 1 || !s.level);
  };

  const getSubSubcategories = (subcategoryId) => {
    return subcategories[subcategoryId] || [];
  };

  const activeCategoryData = categories.find((c) => c._id === activeCategory);

  return (
    <div
      className="relative w-full bg-white h-full flex"
      onMouseLeave={handleMouseLeave}
    >
      {/* Left category list — scrollable */}
      <div className="w-full overflow-y-auto pb-6 pt-2">
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
                  className="border-b border-gray-200"
                  onMouseEnter={() => hasSubs && handleMouseEnter(category._id)}
                >
                  <button
                    onClick={() => toggleCategory(category._id)}
                    className={`w-full flex items-center justify-between px-4 py-3 transition-colors duration-200 group ${
                      isActive ? "bg-pink-50" : "hover:bg-pink-50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
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
                    </div>
                    {hasSubs && (
                      <svg
                        className={`w-4 h-4 shrink-0 transition-transform duration-200 ${
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
                    )}
                  </button>

                  {/* Mobile-only accordion expansion */}
                  <div className="md:hidden">
                    {expandedCategory === category._id && (
                      <div className="bg-gray-50 py-2">
                        {(subcategories[category._id] || []).map((subcategory) => (
                          <Link
                            key={subcategory._id}
                            href={`/category/${subcategory.slug}`}
                            className="block px-8 py-2 text-sm text-gray-700 hover:bg-rose-50 hover:text-rose-600 transition-colors duration-150"
                            onClick={handleLinkClick}
                          >
                            {subcategory.name}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
      </div>

      {/* Desktop flyout mega-panel — styled like MegaMenuNavbar */}
      {activeCategory && activeCategoryData && (
        <div
          className="hidden md:block absolute top-0 left-full z-200 w-95 bg-white border border-gray-200 shadow-2xl rounded-r-lg"
          style={{ minHeight: "100%", maxHeight: "80vh", overflowY: "auto" }}
          onMouseEnter={() => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
          }}
          onMouseLeave={handleMouseLeave}
        >
          <div className="px-5 py-4">
            {/* Panel header */}
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-[0.12em] mb-4 pb-2 border-b border-gray-100">
              {activeCategoryData.name}
            </h3>

            {/* Grid of subcategories with icons */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-5">
              {getSubcategoriesLevel1(activeCategory).map((subcategory) => {
                const subSubs = getSubSubcategories(subcategory._id);
                return (
                  <div key={subcategory._id} className="space-y-2">
                    {/* Subcategory with icon */}
                    <Link
                      href={`/category/${subcategory.slug}`}
                      className="flex items-center gap-2.5 group"
                      onClick={handleLinkClick}
                    >
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
                          <span className="text-base">📦</span>
                        </div>
                      )}
                      <span className="font-semibold text-sm text-gray-800 group-hover:text-rose-600 transition-colors leading-tight">
                        {subcategory.name}
                      </span>
                    </Link>

                    {/* Sub-subcategories list */}
                    {subSubs.length > 0 && (
                      <ul className="space-y-1 pl-1">
                        {subSubs.map((sub) => (
                          <li key={sub._id}>
                            <Link
                              href={`/category/${sub.slug}`}
                              className="text-xs text-gray-500 hover:text-rose-600 hover:underline transition-colors block"
                              onClick={handleLinkClick}
                            >
                              {sub.name}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>

            {/* View all link */}
            <div className="mt-5 pt-3 border-t border-gray-100">
              <Link
                href={`/category/${activeCategoryData.slug}`}
                className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:underline transition-colors"
                onClick={handleLinkClick}
              >
                View all in {activeCategoryData.name} →
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategorySidebar;
