"use client";

import React, { useRef } from "react";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import ProductCard from "@/components/product/ProductCard";

export default function RelatedProducts({ products = [] }) {
  const scrollRef = useRef(null);

  if (products.length === 0) return null;

  return (
    <div className="mt-6 relative px-2">
      <h2 className="text-2xl font-semibold mb-2">Related Products</h2>
      {/* carousel container needs relative positioning for absolute arrows */}
      <div className="relative">
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto scrollbar-hide  md:mr-3 md:ml-3"
        >
          {products.map((p) => (
            <div key={p._id || p.id} className="shrink-0 w-46">
              <ProductCard
                product={p}
                imageHeight={120}
                imageWidth={200}
                showDiscount={true}
                maxTags={2}
              />
            </div>
          ))}
        </div>

        {/* left arrow positioned over carousel */}
        <button
          onClick={() => {
            if (scrollRef.current)
              scrollRef.current.scrollBy({
                left: -scrollRef.current.offsetWidth,
                behavior: "smooth",
              });
          }}
          className="absolute top-1/2 -left-4 transform -translate-y-1/2 p-1 md:p-2  rounded-full border border-red-600 bg-white shadow-md hover:bg-gray-100 transition z-10 "
        >
          <FaChevronLeft className="w-4 h-4 text-red-600" />
        </button>

        {/* right arrow positioned over carousel */}
        <button
          onClick={() => {
            if (scrollRef.current)
              scrollRef.current.scrollBy({
                left: scrollRef.current.offsetWidth,
                behavior: "smooth",
              });
          }}
          className="absolute top-1/2 -right-4 transform -translate-y-1/2 p-1 md:p-2 rounded-full border border-red-600 bg-white shadow-md hover:bg-gray-100 transition z-10"
        >
          <FaChevronRight className="w-4 h-4 text-red-600" />
        </button>
      </div>
    </div>
  );
}
