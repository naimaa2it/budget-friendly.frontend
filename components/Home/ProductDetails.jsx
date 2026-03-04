"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import ProductInfoTabs from './ProductInfoTabs';
import { FaChevronLeft, FaChevronRight, FaStar, FaStarHalfAlt, FaRegStar, FaShareAlt, FaFacebook, FaTwitter, FaWhatsapp, FaCopy } from 'react-icons/fa';
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
  const [copied, setCopied] = useState(false);
  const currentImage = images[currentIndex] || '/assets/placeholder.svg';

  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
  const handleCopy = () => {
    navigator.clipboard?.writeText(shareUrl).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  };

  const prevImage = () => { if (images.length) setCurrentIndex(i => (i - 1 + images.length) % images.length); };
  const nextImage = () => { if (images.length) setCurrentIndex(i => (i + 1) % images.length); };

  if (!product) return <div className="py-24 text-center text-gray-500">Loading product...</div>;

  const { title, description, price, compareAtPrice, inventory, availability, averageRating = 0, reviewCount = 0, tags = [], category } = product;
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
        <div className="w-full lg:w-[45%] flex flex-col gap-4">

          {/* Vertical thumbnails + main image */}
          <div className="flex gap-3">
            {/* Vertical thumbnail strip */}
            {images.length > 1 && (
              <div className="flex flex-col gap-2 w-[72px] flex-shrink-0">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentIndex(idx)}
                    className={`rounded-lg border-2 overflow-hidden transition flex-shrink-0 ${
                      currentIndex === idx ? 'border-red-500 shadow-md' : 'border-gray-200 hover:border-gray-400'
                    }`}
                  >
                    <Image src={encodeURI(img)} alt={`${title} ${idx + 1}`} width={72} height={72} className="object-contain w-full h-[68px] p-1" />
                  </button>
                ))}
              </div>
            )}

            {/* Main image */}
            <div className="relative bg-white rounded-xl border border-gray-200 shadow-sm flex-1 aspect-square flex items-center justify-center overflow-hidden">
              {images.length > 1 && (
                <button onClick={prevImage} className="absolute left-2 z-10 p-1.5 bg-white border border-red-400 rounded-full shadow hover:bg-red-50 transition">
                  <FaChevronLeft className="w-3 h-3 text-red-600" />
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
                <button onClick={nextImage} className="absolute right-2 z-10 p-1.5 bg-white border border-red-400 rounded-full shadow hover:bg-red-50 transition">
                  <FaChevronRight className="w-3 h-3 text-red-600" />
                </button>
              )}
              {discountPct && (
                <span className="absolute top-3 left-3 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                  -{discountPct}%
                </span>
              )}
            </div>
          </div>

          {/* Category, Tags & Share */}
          <div className="flex flex-col gap-2 text-sm border-t pt-3">
            {category && (
              <div className="flex items-center gap-2">
                <span className="text-gray-500 font-medium w-20 flex-shrink-0">Category:</span>
                <span className="text-gray-800 font-semibold">{category}</span>
              </div>
            )}
            {tags.length > 0 && (
              <div className="flex items-start gap-2">
                <span className="text-gray-500 font-medium w-20 flex-shrink-0 mt-0.5">Tags:</span>
                <div className="flex flex-wrap gap-1.5">
                  {tags.map(tag => (
                    <span key={tag} className="bg-gray-100 text-gray-700 px-2.5 py-0.5 rounded-full text-xs font-medium border border-gray-200">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
            <div className="flex items-center gap-2 mt-1">
              <span className="text-gray-500 font-medium w-20 flex-shrink-0">Share:</span>
              <div className="flex items-center gap-2">
                <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`} target="_blank" rel="noopener noreferrer"
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-blue-600 text-white hover:bg-blue-700 transition">
                  <FaFacebook className="w-4 h-4" />
                </a>
                <a href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(title)}`} target="_blank" rel="noopener noreferrer"
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-sky-500 text-white hover:bg-sky-600 transition">
                  <FaTwitter className="w-4 h-4" />
                </a>
                <a href={`https://wa.me/?text=${encodeURIComponent(title + ' ' + shareUrl)}`} target="_blank" rel="noopener noreferrer"
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-green-500 text-white hover:bg-green-600 transition">
                  <FaWhatsapp className="w-4 h-4" />
                </a>
                <button onClick={handleCopy}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-200 text-gray-700 hover:bg-gray-300 transition" title="Copy link">
                  <FaCopy className="w-3.5 h-3.5" />
                </button>
                {copied && <span className="text-xs text-green-600 font-medium">Copied!</span>}
              </div>
            </div>
          </div>
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

          {/* 7. Trust badges */}
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
