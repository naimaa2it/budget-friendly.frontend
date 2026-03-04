"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import ProductInfoTabs from './ProductInfoTabs';
import { FaChevronLeft, FaChevronRight, FaStar, FaStarHalfAlt, FaRegStar } from 'react-icons/fa';
import AddToCartSection from '@/components/cart/AddToCartSection';
import RelatedProducts from './RelatedProducts';

function StarDisplay({ value = 0, count = 0 }) {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    if (value >= i) stars.push(<FaStar key={i} className="text-yellow-400 w-4 h-4" />);
    else if (value >= i - 0.5) stars.push(<FaStarHalfAlt key={i} className="text-yellow-400 w-4 h-4" />);
    else stars.push(<FaRegStar key={i} className="text-gray-300 w-4 h-4" />);
  }
  return (
    <div className="flex items-center gap-1.5">
      <span className="flex gap-0.5">{stars}</span>
      <span className="text-sm font-semibold text-gray-700">{value > 0 ? value.toFixed(1) : ''}</span>
      <span className="text-sm text-gray-500">({count} review{count !== 1 ? 's' : ''})</span>
    </div>
  );
}

function StockBadge({ inventory, availability }) {
  if (availability === 'out_of_stock' || inventory === 0) {
    return <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-red-600"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" />Out of Stock</span>;
  }
  if (availability === 'pre_order') {
    return <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600"><span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />Pre-Order</span>;
  }
  if (availability === 'upcoming') {
    return <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-purple-600"><span className="w-2 h-2 rounded-full bg-purple-500 inline-block" />Coming Soon</span>;
  }
  if (inventory != null && inventory <= 10) {
    return (
      <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-orange-600">
        <span className="w-2 h-2 rounded-full bg-orange-500 inline-block" />
        Only {inventory} left in stock — order soon!
      </span>
    );
  }
  return <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-green-600"><span className="w-2 h-2 rounded-full bg-green-500 inline-block" />In Stock{inventory != null ? ` (${inventory} available)` : ''}</span>;
}

const TRUST_BADGES = [
  { src: 'https://img.icons8.com/?size=100&id=TO90p62OH8nn&format=png&color=000000', alt: 'Genuine', label: '100% Genuine Products' },
  { src: 'https://img.icons8.com/?size=100&id=BHOd3uqHFKXN&format=png&color=000000', alt: 'Secure', label: '100% Secure Payments' },
  { src: 'https://img.icons8.com/?size=100&id=45147&format=png&color=000000', alt: 'Help', label: 'Help Center (+8809666737475)' },
];

export default function ProductDetails({ product, relatedProducts = [] }) {
  const images = (product?.images || []).map(i => i.url);
  const [currentIndex, setCurrentIndex] = useState(0);
  const currentImage = images[currentIndex] || '/assets/placeholder.svg';

  const prevImage = () => { if (images.length) setCurrentIndex(i => (i - 1 + images.length) % images.length); };
  const nextImage = () => { if (images.length) setCurrentIndex(i => (i + 1) % images.length); };

  if (!product) return <div className="py-24 text-center text-gray-500">Loading product...</div>;

  const { title, description, price, compareAtPrice, inventory, availability, averageRating = 0, reviewCount = 0 } = product;
  const discountPct = compareAtPrice && compareAtPrice > price ? Math.round(((compareAtPrice - price) / compareAtPrice) * 100) : null;

  const specs = product.specs || {};
  const specArray = Object.entries(specs).map(([k, v]) => ({ key: k, value: String(v) }));
  const tabProduct = { ...product, description, specifications: specArray };

  const scrollToReviews = () => {
    const el = document.getElementById('reviews-tab');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div key={product?._id || product?.id} className="max-w-6xl mx-auto py-8 px-4">

      {/* ── Main product section ── */}
      <div className="flex flex-col lg:flex-row gap-10">

        {/* ── LEFT: image gallery ── */}
        <div className="w-full lg:w-[45%] flex flex-col gap-3">
          {/* Main image */}
          <div className="relative bg-white rounded-xl border border-gray-200 shadow-sm aspect-square flex items-center justify-center overflow-hidden">
            {images.length > 1 && (
              <button onClick={prevImage} className="absolute left-2 z-10 p-2 bg-white border border-red-400 rounded-full shadow hover:bg-red-50 transition">
                <FaChevronLeft className="w-3.5 h-3.5 text-red-600" />
              </button>
            )}
            <Image
              src={encodeURI(currentImage)}
              alt={title}
              width={600}
              height={600}
              className="w-full h-full object-contain p-4"
            />
            {images.length > 1 && (
              <button onClick={nextImage} className="absolute right-2 z-10 p-2 bg-white border border-red-400 rounded-full shadow hover:bg-red-50 transition">
                <FaChevronRight className="w-3.5 h-3.5 text-red-600" />
              </button>
            )}
            {discountPct && (
              <span className="absolute top-3 left-3 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                -{discountPct}%
              </span>
            )}
          </div>

          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="flex gap-2 flex-wrap">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={`rounded-lg border-2 overflow-hidden transition ${currentIndex === idx ? 'border-red-500 shadow-md' : 'border-gray-200 hover:border-gray-400'}`}
                >
                  <Image src={encodeURI(img)} alt={`${title} ${idx + 1}`} width={72} height={72} className="object-contain w-16 h-16 p-1" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── RIGHT: product info ── */}
        <div className="flex-1 flex flex-col gap-4">

          {/* 1. Title */}
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 leading-snug">{title}</h1>

          {/* 2. Stars + review count + write review */}
          <div className="flex flex-wrap items-center gap-3">
            <StarDisplay value={averageRating} count={reviewCount} />
            <span className="text-gray-300">|</span>
            <button
              id="reviews"
              onClick={scrollToReviews}
              className="text-sm font-semibold text-pink-600 hover:text-pink-800 underline underline-offset-2 transition"
            >
              ✍️ Write Your Precious Review
            </button>
          </div>

          {/* 3. Prices */}
          <div className="flex items-baseline gap-3 flex-wrap">
            <span className="text-3xl font-bold text-red-600">৳{price?.toLocaleString()}</span>
            {compareAtPrice && compareAtPrice > price && (
              <>
                <span className="text-xl text-gray-400 line-through">৳{compareAtPrice?.toLocaleString()}</span>
                <span className="bg-green-100 text-green-800 text-sm font-bold px-2.5 py-0.5 rounded-full">
                  {discountPct}% OFF
                </span>
              </>
            )}
          </div>

          {/* 4. Short description */}
          {description && (
            <p className="text-gray-600 text-sm leading-relaxed line-clamp-4 border-l-4 border-gray-200 pl-3">
              {description}
            </p>
          )}

          {/* 5. Stock indicator */}
          <div>
            <StockBadge inventory={inventory} availability={availability} />
          </div>

          {/* 6. Add to cart (qty + wishlist + add to bag) */}
          <div className="pt-1">
            <AddToCartSection product={product} />
          </div>

          {/* 7. Buy Now */}
          <button
            onClick={() => {
              // add to cart then navigate to checkout
              window.location.href = '/checkout';
            }}
            className="w-full sm:w-auto bg-red-600 text-white py-3 px-8 rounded-lg font-semibold hover:bg-red-700 active:scale-95 transition text-base shadow"
          >
            Buy Now
          </button>

          {/* 8. App price strip */}
          <div className="border border-dashed border-red-300 bg-red-50 rounded-lg px-4 py-2.5 flex items-center gap-2 text-sm text-red-700 font-medium">
            📱 App exclusive price: <span className="font-bold">৳{product.appPrice || price}</span>
            <span className="text-xs text-red-500 font-normal ml-1">(Download our app)</span>
          </div>

          {/* 9. Trust badges */}
          <div className="mt-2 grid grid-cols-3 gap-3 border-t pt-4">
            {TRUST_BADGES.map(b => (
              <div key={b.alt} className="flex flex-col items-center gap-1.5 text-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={b.src} alt={b.alt} className="w-9 h-9" />
                <span className="text-xs text-gray-600 leading-tight">{b.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* related products */}
      <RelatedProducts products={relatedProducts} />

      {/* product info tabs */}
      <div id="reviews-tab">
        <ProductInfoTabs product={tabProduct} />
      </div>
    </div>
  );
}
