"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { FaStar } from "react-icons/fa";
import { HiMiniArrowsUpDown } from "react-icons/hi2";

const STORAGE_KEY = "SmartBuy BD_recentlyViewed";
const MAX_ITEMS = 30;

/**
 * Save the current product to recently-viewed list in localStorage.
 * Call this once per product page mount.
 */
export function saveRecentlyViewed(product) {
  if (typeof window === "undefined" || !product?._id) return;
  try {
    const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    // Remove duplicate entry (if revisited)
    const filtered = existing.filter((p) => p._id !== product._id);
    const entry = {
      _id: product._id,
      title: product.title,
      slug: product.slug,
      price: product.price,
      compareAtPrice: product.compareAtPrice,
      averageRating: product.averageRating || 0,
      reviewCount: product.reviewCount || 0,
      image: product.images?.[0]?.url || null,
    };
    const updated = [entry, ...filtered].slice(0, MAX_ITEMS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (_) {}
}

export default function RecentlyViewed({
  currentProductId,
  mobilePerRow = 3,
  desktopPerRow = 6,
  rows = 2,
}) {
  const [items, setItems] = useState([]);
  const [isDesktop, setIsDesktop] = useState(false);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    const updateViewport = () => setIsDesktop(window.innerWidth >= 1024);
    updateViewport();
    window.addEventListener("resize", updateViewport);
    return () => window.removeEventListener("resize", updateViewport);
  }, []);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      // Exclude the current product
      setItems(stored.filter((p) => p._id !== currentProductId));
    } catch (_) {
      setItems([]);
    }
  }, [currentProductId]);

  const perRow = isDesktop ? desktopPerRow : mobilePerRow;
  const visibleItems = showAll
    ? items.slice(0, perRow * 2)
    : items.slice(0, perRow);

  if (items.length === 0) return null;

  return (
    <section className="max-w-7xl mx-auto px-4 mt-12 mb-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg md:text-2xl font-bold text-gray-900 tracking-tight">
          Recently Viewed
        </h2>
        <button
          onClick={() => {
            localStorage.removeItem(STORAGE_KEY);
            setItems([]);
          }}
          className="text-xs text-gray-600 hover:text-red-600 underline transition"
        >
          Clear history
        </button>
      </div>

      <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
        {visibleItems.map((item) => {
          const href = item.slug
            ? `/product/${item._id}`
            : `/product/${item._id}`;
          const discount =
            item.compareAtPrice && item.compareAtPrice > item.price
              ? Math.round(
                  ((item.compareAtPrice - item.price) / item.compareAtPrice) *
                    100,
                )
              : null;

          return (
            <Link
              key={item._id}
              href={href}
              className="group bg-white border border-orange-200 rounded-lg overflow-hidden hover:shadow-md hover:border-gray-300 transition-all duration-200 flex flex-col"
            >
              {/* Image */}
              <div className="relative bg-gray-50 aspect-square overflow-hidden">
                {item.image ? (
                  <Image
                    src={encodeURI(item.image)}
                    alt={item.title}
                    fill
                    className="object-contain p-2 group-hover:scale-105 transition-transform duration-300"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">
                    No image
                  </div>
                )}
                {discount && (
                  <span className="absolute top-1.5 left-1.5 bg-gradient-to-r from-red-400 to-red-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                    -{discount}%
                  </span>
                )}
              </div>

              {/* Info */}
              <div className="p-2 flex flex-col gap-0.5 flex-1">
                <p className="text-[11px] font-medium text-gray-800 line-clamp-2 leading-snug">
                  {item.title}
                </p>

                {/* Stars */}
                {item.averageRating > 0 && (
                  <div className="flex items-center gap-0.5 mt-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <FaStar
                        key={s}
                        className={`w-2.5 h-2.5 ${s <= Math.round(item.averageRating) ? "text-yellow-400" : "text-gray-200"}`}
                      />
                    ))}
                    {item.reviewCount > 0 && (
                      <span className="text-[9px] text-gray-400 ml-0.5">
                        ({item.reviewCount})
                      </span>
                    )}
                  </div>
                )}

                {/* Price */}
                <div className="flex items-center gap-1.5 flex-wrap mt-auto pt-1">
                  <span className="text-xs font-bold text-gray-900">
                    ৳{item.price?.toLocaleString()}
                  </span>
                  {item.compareAtPrice && item.compareAtPrice > item.price && (
                    <span className="text-[10px] text-gray-400 line-through">
                      ৳{item.compareAtPrice?.toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {items.length > perRow && (
        <div className="mt-2 flex justify-center">
          <button
            type="button"
            onClick={() => setShowAll((s) => !s)}
            className="px-4 py-1  text-sm hover:bg-gray-50 transition flex items-center gap-1"
          >
            {showAll ? "Show Less" : "Show More"}
            <span className="text-red-500">
              <HiMiniArrowsUpDown />
            </span>
          </button>
        </div>
      )}
    </section>
  );
}
