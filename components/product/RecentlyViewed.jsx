"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  FaStar,
  FaChevronLeft,
  FaChevronRight,
  FaShoppingCart,
} from "react-icons/fa";
import { useCart } from "@/components/context/CartContext";

const STORAGE_KEY = "SmartBuy BD_recentlyViewed";
const MAX_ITEMS = 30;

export function saveRecentlyViewed(product) {
  if (typeof window === "undefined" || !product?._id) return;
  try {
    const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
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
      availability: product.availability,
    };
    const updated = [entry, ...filtered].slice(0, MAX_ITEMS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (_) {}
}

export default function RecentlyViewed({ currentProductId }) {
  const [items, setItems] = useState([]);
  const scrollRef = useRef(null);
  const { addToCart } = useCart();

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      setItems(stored.filter((p) => p._id !== currentProductId));
    } catch (_) {
      setItems([]);
    }
  }, [currentProductId]);

  const scrollBy = (dir) => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: dir * 220, behavior: "smooth" });
    }
  };

  if (items.length === 0) return null;

  return (
    <section className="max-w-7xl mx-auto  mt-12 mb-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg md:text-xl font-bold text-gray-900 tracking-tight">
          Recently Viewed
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => scrollBy(-1)}
            className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-100 transition"
          >
            <FaChevronLeft className="w-3 h-3 text-gray-600" />
          </button>
          <button
            onClick={() => scrollBy(1)}
            className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-100 transition"
          >
            <FaChevronRight className="w-3 h-3 text-gray-600" />
          </button>
          <button
            onClick={() => {
              localStorage.removeItem(STORAGE_KEY);
              setItems([]);
            }}
            className="text-xs text-gray-400 hover:text-red-500 transition ml-1"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Horizontal scroll container */}
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto pb-2 scroll-smooth"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {items.map((item) => {
          const href = `/product/${item._id}`;
          const discount =
            item.compareAtPrice && item.compareAtPrice > item.price
              ? Math.round(
                  ((item.compareAtPrice - item.price) / item.compareAtPrice) *
                    100,
                )
              : null;
          const isOutOfStock = item.availability === "out_of_stock";

          return (
            <div
              key={item._id}
              className="group shrink-0 w-40 md:w-44 bg-white border border-orange-100 rounded-xl overflow-hidden hover:shadow-md hover:border-orange-300 transition-all duration-200 flex flex-col"
            >
              {/* Image */}
              <Link
                href={href}
                className="relative bg-gray-50 aspect-square overflow-hidden block"
              >
                {item.image ? (
                  <Image
                    src={encodeURI(item.image)}
                    alt={item.title}
                    fill
                    className="object-contain p-2 group-hover:scale-105 transition-transform duration-300"
                    sizes="176px"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">
                    No image
                  </div>
                )}
                {discount && (
                  <span className="absolute top-1.5 left-1.5 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                    -{discount}%
                  </span>
                )}
              </Link>

              {/* Info */}
              <div className="p-2 flex flex-col gap-0.5 flex-1">
                <Link
                  href={href}
                  className="text-[11px] font-medium text-gray-800 line-clamp-2 leading-snug hover:text-red-600 transition"
                >
                  {item.title}
                </Link>

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

                <div className="flex items-center gap-1 flex-wrap mt-auto pt-1">
                  <span className="text-xs font-bold text-gray-900">
                    ৳{item.price?.toLocaleString()}
                  </span>
                  {item.compareAtPrice && item.compareAtPrice > item.price && (
                    <span className="text-[10px] text-gray-400 line-through">
                      ৳{item.compareAtPrice?.toLocaleString()}
                    </span>
                  )}
                </div>

                {/* Quick add button */}
                {!isOutOfStock ? (
                  <button
                    onClick={() => addToCart(item, 1)}
                    className="mt-1.5 w-full flex items-center justify-center gap-1.5 bg-gray-900 hover:bg-red-600 text-white text-[10px] font-semibold py-1.5 rounded-lg transition-colors"
                  >
                    <FaShoppingCart className="w-2.5 h-2.5" />
                    Add to Cart
                  </button>
                ) : (
                  <span className="mt-1.5 block text-center text-[10px] text-red-500 font-medium py-1.5">
                    Out of Stock
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
