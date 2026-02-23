"use client";

import React from 'react';
import Image from 'next/image';

export default function BestSellingCard({ product, onDelete }) {
  const price = product.price || (product.variants && product.variants[0]?.price) || 0;
  const compareAt = product.compareAtPrice || (product.variants && product.variants[0]?.compareAtPrice) || null;
  const image = (product.images && product.images[0]?.url) || '/assets/placeholder.svg';
  const brand = product.department || product.category || '';

  const isOnSale = compareAt && compareAt > price;

  return (
    <div className="relative">
      {/* gradient border wrapper */}
      <div className="bg-gradient-to-tr from-purple-300 to-cyan-300 p-[2px] rounded-lg">
        <div className="bg-white rounded-md shadow-lg overflow-hidden flex flex-col h-full group hover:shadow-2xl transition-all duration-300">
          {isOnSale && (
            <span className="absolute top-2 left-2 bg-pink-500 text-white text-[10px] font-semibold uppercase px-2 py-1 rounded-full">
              On sale
            </span>
          )}
          <div className="p-4 flex items-center justify-center h-40">
            <Image
              src={encodeURI(image)}
              alt={product.title || product.slug}
              width={160}
              height={160}
              className="max-h-full object-contain"
              loading="lazy"
              decoding="async"
              onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/assets/placeholder.svg'; }}
            />
          </div>

          <div className="px-4 pb-4 flex flex-col flex-grow">
            <p className="text-xs uppercase text-pink-600 mb-1 truncate">{brand}</p>
            <h3 className="text-sm font-semibold text-gray-900 mb-2 line-clamp-2">{product.title}</h3>
            <div className="mt-auto">
              <div className="flex items-center gap-2">
                {isOnSale && (
                  <span className="text-sm text-gray-500 line-through">
                    ৳{compareAt}
                  </span>
                )}
                <span className="text-lg font-bold text-red-600">৳{price}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
