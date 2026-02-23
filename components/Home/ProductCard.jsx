"use client";

import Image from 'next/image';
import React from 'react';
import { FaEye, FaShoppingCart, FaHeart } from 'react-icons/fa';

export default function ProductCard({ product, imageWidth = 300, imageHeight = 200, imageQuality = 100 }) {
  const price = product.price || (product.variants && product.variants[0]?.price) || 0;
  const compareAt = product.compareAtPrice || (product.variants && product.variants[0]?.compareAtPrice) || null;
  // handle hover/click image swap
  const images = (product.images && product.images.length) ? product.images.map(i => i.url) : ['/assets/placeholder.svg'];
  const [useSecond, setUseSecond] = React.useState(false);
  const [hovered, setHovered] = React.useState(false);
  const currentImage = () => {
    if ((hovered || useSecond) && images[1]) return images[1];
    return images[0];
  };
  const image = encodeURI(currentImage());

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden group hover:shadow-xl transition-all duration-300 flex flex-col">
      <div
        className="relative bg-gray-50 px-2 flex items-center justify-center overflow-hidden"
        style={{ height: imageHeight }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={() => setUseSecond(prev => !prev)}
      >
        <Image
          src={image}
          alt={product.title || product.slug}
          width={imageWidth}
          height={imageHeight}
          quality={imageQuality}
          loading="lazy"
          decoding="async"
          onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/assets/placeholder.svg'; }}
          className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-300 cursor-pointer"
        />

        <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <button className="w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-md hover:bg-red-600 hover:text-white transition-colors">
            <FaEye className="w-4 h-4" />
          </button>
          <button className="w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-md hover:bg-red-600 hover:text-white transition-colors">
            <FaShoppingCart className="w-4 h-4" />
          </button>
          <button className="w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-md hover:bg-red-600 hover:text-white transition-colors">
            <FaHeart className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="p-3 flex flex-col flex-grow">
        <p className="text-sm text-gray-600 mb-1 line-clamp-1">{product.title || product.category}</p>
        <h3 className="text-sm font-semibold text-gray-900 mb-1 line-clamp-2">{product.description || product.title}</h3>

        <div className="mb-2">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-red-600">৳{price}</span>
            {compareAt && <span className="text-sm text-gray-500 line-through">৳{compareAt}</span>}
          </div>
        </div>

        <button className="w-full bg-red-600 text-white py-2 rounded-md font-medium hover:bg-red-700 transition mt-auto ">
          Add to Cart
        </button>
      </div>
    </div>
  );
}
