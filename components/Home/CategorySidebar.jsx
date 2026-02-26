"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useCategories } from "@/components/context/CategoryContext";

const CategorySidebar = ({ onLinkClick }) => {
  const { categories, loading } = useCategories();
  const [expandedCategory, setExpandedCategory] = useState(null); // for mobile
  const [activeCategory, setActiveCategory] = useState(null); // for desktop hover

  const toggleCategory = (categoryId) => {
    setExpandedCategory(expandedCategory === categoryId ? null : categoryId);
    setActiveCategory(categoryId);
  };

  const handleMouseEnter = (categoryId) => {
    setActiveCategory(categoryId);
  };

  const handleLinkClick = () => {
    if (onLinkClick) onLinkClick();
  };

  return (
    <div className="relative w-full bg-white h-full pb-6 overflow-y-auto" onMouseLeave={() => setActiveCategory(null)}>
      {/* left list */}
      <div className="w-full pb-4 pt-2 px-4">
          {loading ? (
            [...Array(6)].map((_, i) => (
              <div key={i} className="border-b border-gray-200 pt-4 pb-3">
                <div className="flex items-center gap-3 px-4">
                  <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse" />
                  <div className="h-5 w-32 bg-gray-200 rounded animate-pulse" />
                </div>
              </div>
            ))
          ) : (
            categories.map((category) => (
              <div key={category._id} className="border-b border-gray-200 pt-4 pb-3">
                <button
                  onMouseEnter={() => handleMouseEnter(category._id)}
                  onClick={() => toggleCategory(category._id)}
                  className="w-full flex items-center justify-between px-4 hover:bg-gray-50 transition-colors duration-200 group ripple-effect"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{category.icon}</span>
                    <span className="font-medium text-gray-800 text-left group-hover:text-primary transition-colors whitespace-nowrap truncate">
                      {category.name}
                    </span>
                  </div>
                  <svg
                    className={`w-5 h-5 text-gray-500 flex-shrink-0 transition-transform duration-200 md:rotate-0 ${
                      expandedCategory === category._id ? "rotate-90" : ""
                    }`}
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

                {/* mobile-only expansion */}
                <div className="md:hidden">
                  {expandedCategory === category._id && (
                    <div className="bg-gray-50 py-2">
                      {category.subcategories?.map((subcategory) => (
                        <Link
                          key={subcategory._id}
                          href={`/products/c/${category.name.replace(/\s+/g, "-")}/${subcategory.name.replace(/\s+/g, "-")}/`}
                          className="block px-8 py-2 text-sm text-gray-700 hover:bg-primary hover:text-white transition-colors duration-150 click-feedback"
                          onClick={handleLinkClick}
                        >
                          {subcategory.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

      {/* floating subcategory panel (desktop) */}
      {activeCategory && (
        <div className="hidden md:block absolute top-0 left-full w-[220px] max-h-full bg-gray-50 overflow-y-auto px-4 py-2 shadow-lg">
          {categories
            .find((c) => c._id === activeCategory)
            ?.subcategories?.map((subcategory) => (
              <Link
                key={subcategory._id}
                href={`/products/c/${
                  categories.find((c) => c._id === activeCategory)?.name.replace(/\s+/g, "-")
                }/${subcategory.name.replace(/\s+/g, "-")}/`}
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-primary hover:text-white transition-colors duration-150 whitespace-nowrap"
                onClick={handleLinkClick}
              >
                {subcategory.name}
              </Link>
            ))}
        </div>
      )}
    </div>
  );
};

export default CategorySidebar;
