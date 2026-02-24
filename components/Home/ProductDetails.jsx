"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import ProductCard from './ProductCard';
import ProductInfoTabs from './ProductInfoTabs';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import AddToCartSection from '@/components/cart/AddToCartSection';
import RelatedProducts from './RelatedProducts';

export default function ProductDetails({ product, relatedProducts = [] }) {
  // Expect `product` object with fields coming from API
  const images = (product?.images || []).map(i => i.url);
  const [currentIndex, setCurrentIndex] = useState(0);

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

  // convert specs object into specifications array for tabs component
  const specArray = Object.entries(specs).map(([k,v]) => ({ key:k, value: String(v) }));

  const tabProduct = {
    ...product,
    description,
    specifications: specArray,
  };

  return (
    <div key={product?._id || product?.id} className="max-w-6xl mx-auto py-8 px-4">
      {/* upper section: large image with right-side thumbnails + product info column */}
      <div className="flex flex-col lg:flex-row gap-8">
        {/* left: image with vertical thumbnails on right */}
        <div className="flex-1 flex">
          <div className="relative bg-white rounded shadow p-4 h-126 flex items-center justify-center flex-1">
            <button
              onClick={prevImage}
              className="absolute left-2 z-10 p-2 bg-white rounded-full shadow hover:bg-gray-100"
            >
              <FaChevronLeft className="w-6 h-6 text-gray-600" />
            </button>
            <Image
              src={encodeURI(currentImage)}
              alt={title}
              width={1200}
              height={1200}
              className="max-h-full max-w-full object-contain"
            />
            <button
              onClick={nextImage}
              className="absolute right-2 z-10 p-2 bg-white rounded-full shadow hover:bg-gray-100"
            >
              <FaChevronRight className="w-6 h-6 text-gray-600" />
            </button>
          </div>
        </div>

        {/* mobile thumbnails below image */}
        {images.length > 1 && (
          <>
            <div className="-mt-4 flex gap-2 lg:hidden">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  className={`border rounded ${currentIndex === idx ? 'border-red-600' : 'border-gray-200'}`}
                  onClick={() => setCurrentIndex(idx)}
                >
                  <Image
                    src={encodeURI(img)}
                    alt={`${title} thumbnail ${idx + 1}`}
                    width={60}
                    height={50}
                    className="object-contain"
                  />
                </button>
              ))}
            </div>
            <div className="mt-6 flex justify-between items-center text-center text-sm text-gray-700 gap-2 lg:hidden">
              <div className="flex flex-col items-center gap-1">
                <img src="https://img.icons8.com/?size=100&id=TO90p62OH8nn&format=png&color=000000" alt="Genuine" className="w-10 h-10" />
                <span>100% Genuine Products</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <img src="https://img.icons8.com/?size=100&id=BHOd3uqHFKXN&format=png&color=000000" alt="Secure Payments" className="w-10 h-10" />
                <span>100% Secure Payments</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <img src="https://img.icons8.com/?size=100&id=45147&format=png&color=000000" alt="Help Center" className="w-10 h-10" />
                <span>Help Center (+8809666737475)</span>
              </div>
            </div>
          </>
        )}

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

          <div className="flex flex-col gap-4">
            <AddToCartSection product={product} />
            <button className="border border-red-600 text-red-600 py-3 px-6 rounded-lg font-medium hover:bg-red-50 transition">
              App Price: ৳{product.appPrice || price}
            </button>
          </div>

          {/* thumbnail row after buttons */}
          {images.length > 1 && (
            <>
              <div className="mt-4 flex gap-2 hidden md:block">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    className={`border rounded ${currentIndex === idx ? 'border-red-600' : 'border-gray-200'}`}
                    onClick={() => setCurrentIndex(idx)}
                  >
                    <Image
                      src={encodeURI(img)}
                      alt={`${title} thumbnail ${idx + 1}`}
                      width={70}
                      height={50}
                      className="object-contain"
                    />
                  </button>
                ))}
              </div>

              {/* trust/feature bar below thumbnails using icon8 SVGs */}
              <div className="mt-6 flex justify-between items-center text-center text-sm text-gray-700 gap-2">
                <div className="flex flex-col items-center gap-1">
                  <img src="https://img.icons8.com/?size=100&id=TO90p62OH8nn&format=png&color=000000" alt="Genuine" className="w-10 h-10" />
                  <span>100% Genuine Products</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <img src="https://img.icons8.com/?size=100&id=BHOd3uqHFKXN&format=png&color=000000" alt="Secure Payments" className="w-10 h-10" />
                  <span>100% Secure Payments</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <img src="https://img.icons8.com/?size=100&id=45147&format=png&color=000000" alt="Help Center" className="w-10 h-10" />
                  <span>Help Center (+8809666737475)</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* related products section */}
      <RelatedProducts products={relatedProducts} />

      {/* product info tabs for description/specs */}
      <ProductInfoTabs product={tabProduct} />

      {/* optional brand description section (could be populated from department lookup) */}
    </div>
  );
}
