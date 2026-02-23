"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import ProductCard from './ProductCard';

export default function ProductDetails({ product, relatedProducts = [] }) {
  // Expect `product` object with fields coming from API
  const images = (product?.images || []).map(i => i.url);
  const [currentImage, setCurrentImage] = useState(images[0] || '/assets/placeholder.svg');

  useEffect(() => {
    setCurrentImage(images[0] || '/assets/placeholder.svg');
  }, [images]);

  if (!product) {
    return <div className="py-24 text-center text-gray-500">Loading product...</div>;
  }

  const { title, description, price, compareAtPrice, department, specs = {} } = product;

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      {/* upper section: thumbnails + main image + basic info */}
      <div className="flex flex-col lg:flex-row gap-8">
        {/* image column */}
        <div className="flex-1">
          <div className="relative bg-white rounded shadow p-4 h-96 flex items-center justify-center">
            <Image
              src={encodeURI(currentImage)}
              alt={title}
              width={800}
              height={800}
              className="max-h-full max-w-full object-contain"
            />
          </div>
          {images.length > 1 && (
            <div className="mt-4 flex gap-2 overflow-x-auto">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  className={`border rounded ${currentImage === img ? 'border-red-600' : 'border-gray-200'}`}
                  onClick={() => setCurrentImage(img)}
                >
                  <Image
                    src={encodeURI(img)}
                    alt={`${title} thumbnail ${idx+1}`}
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
          <h1 className="text-3xl font-bold">{title}</h1>
          <div className="flex items-center gap-4">
            <span className="text-2xl font-bold text-red-600">৳{price}</span>
            {compareAtPrice && <span className="text-xl text-gray-500 line-through">৳{compareAtPrice}</span>}
          </div>
          <p className="text-gray-700">{description}</p>
          <button className="w-full md:w-auto bg-red-600 text-white py-2 px-6 rounded hover:bg-red-700 transition">
            Add to Cart
          </button>
          {/* additional info area */}
          <div className="mt-6">
            <h2 className="text-lg font-semibold mb-2">About the Brand</h2>
            <p className="text-gray-600">{department || 'N/A'}</p>
          </div>
        </div>
      </div>

      {/* related products section */}
      {relatedProducts.length > 0 && (
        <div className="mt-12">
          <h2 className="text-2xl font-semibold mb-4">Related Products</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {relatedProducts.map(p => (
              <ProductCard key={p._id || p.id} product={p} imageHeight={150} imageWidth={200} />
            ))}
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
