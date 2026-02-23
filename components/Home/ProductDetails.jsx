"use client";

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import ProductCard from './ProductCard';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';

export default function ProductDetails({ product, relatedProducts = [] }) {
  // Expect `product` object with fields coming from API
  const images = (product?.images || []).map(i => i.url);
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollRef = useRef(null);


  const currentImage = images[currentIndex] || '/assets/placeholder.svg';

  const prevImage = () => {
    if (images.length === 0) return;
    setCurrentIndex(i => (i - 1 + images.length) % images.length);
  };

  const nextImage = () => {
    if (images.length === 0) return;
    setCurrentIndex(i => (i + 1) % images.length);
  };

  if (!product) {
    return <div className="py-24 text-center text-gray-500">Loading product...</div>;
  }

  const { title, description, price, compareAtPrice, department, specs = {} } = product;

  return (
    <div key={product?._id || product?.id} className="max-w-6xl mx-auto py-8 px-4">
      {/* upper section: large image with right-side thumbnails + product info column */}
      <div className="flex flex-col lg:flex-row gap-8">
        {/* left: image with vertical thumbnails on right */}
        <div className="flex-1 flex">
          <div className="relative bg-white rounded shadow p-4 h-96 flex items-center justify-center flex-1">
            <button
              onClick={prevImage}
              className="absolute left-2 z-10 p-2 bg-white rounded-full shadow hover:bg-gray-100"
            >
              <FaChevronLeft className="w-6 h-6 text-gray-600" />
            </button>
            <Image
              src={encodeURI(currentImage)}
              alt={title}
              width={800}
              height={800}
              className="max-h-full max-w-full object-contain"
            />
            <button
              onClick={nextImage}
              className="absolute right-2 z-10 p-2 bg-white rounded-full shadow hover:bg-gray-100"
            >
              <FaChevronRight className="w-6 h-6 text-gray-600" />
            </button>
          </div>
          {images.length > 1 && (
            <div className="ml-4 flex flex-col gap-2 overflow-y-auto h-96">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  className={`border rounded ${currentIndex === idx ? 'border-red-600' : 'border-gray-200'}`}
                  onClick={() => setCurrentIndex(idx)}
                >
                  <Image
                    src={encodeURI(img)}
                    alt={`${title} thumbnail ${idx + 1}`}
                    width={80}
                    height={80}
                    className="object-contain"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* details column */}
        <div className="flex-1 flex flex-col gap-4">
          {/* category/brand header could go here */}
          <h1 className="text-3xl font-bold">{title}</h1>
          {/* rating placeholder */}
          <div className="flex items-center gap-2">
            {/* star icons could be added here */}
            <span className="text-sm text-gray-500">(0 reviews)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-red-600">৳{price}</span>
            {compareAtPrice && <span className="text-xl text-gray-500 line-through">৳{compareAtPrice}</span>}
            {compareAtPrice && (
              <span className="bg-green-100 text-green-800 px-2 rounded text-sm">
                {Math.round(((compareAtPrice - price) / compareAtPrice) * 100)}% OFF
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-4">
            <button className="bg-pink-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-pink-700 transition">
              Add to bag
            </button>
            <button className="border border-red-600 text-red-600 py-3 px-6 rounded-lg font-medium hover:bg-red-50 transition">
              App Price: ৳{product.appPrice || price}
            </button>
          </div>
          {/* info badges section (you can populate accordingly) */}
        </div>
      </div>

      {/* related products section */}
      {relatedProducts.length > 0 && (
        <div className="mt-12 relative">
          <h2 className="text-2xl font-semibold mb-4">Related Products</h2>
          <div className="flex items-center">
            <button
              onClick={() => {
                if (scrollRef.current) scrollRef.current.scrollBy({ left: -scrollRef.current.offsetWidth, behavior: 'smooth' });
              }}
              className="p-2 rounded-full bg-white shadow-md hover:bg-gray-100 transition -mr-2"
            >
              <FaChevronLeft className="w-6 h-6" />
            </button>

            <div
              ref={scrollRef}
              className="flex gap-4 overflow-x-auto scrollbar-hide py-2" // custom utility to hide scrollbar
            >
              {relatedProducts.map(p => (
                <div key={p._id || p.id} className="shrink-0 w-40">
                  <ProductCard product={p} imageHeight={150} imageWidth={200} />
                </div>
              ))}
            </div>

            <button
              onClick={() => {
                if (scrollRef.current) scrollRef.current.scrollBy({ left: scrollRef.current.offsetWidth, behavior: 'smooth' });
              }}
              className="p-2 rounded-full bg-white shadow-md hover:bg-gray-100 transition -ml-2"
            >
              <FaChevronRight className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}

      {/* specs table */}
      {specs && Object.keys(specs).length > 0 && (
        <div className="mt-12">
          <h2 className="text-2xl font-semibold mb-4">Specifications</h2>
          <table className="w-full text-left border-collapse">
            <tbody>
              {Object.entries(specs).map(([k, v]) => (
                <tr key={k} className="border-b">
                  <th className="py-2 px-4 font-medium text-gray-700">{k}</th>
                  <td className="py-2 px-4 text-gray-600">{String(v)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* optional brand description section (could be populated from department lookup) */}
    </div>
  );
}
