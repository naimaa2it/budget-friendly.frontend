"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import ProductInfoTabs from './ProductInfoTabs';
import { FaChevronLeft, FaChevronRight, FaStar, FaStarHalfAlt, FaRegStar, FaFacebook, FaTwitter, FaWhatsapp, FaCopy, FaTruck, FaClock } from 'react-icons/fa';
import AddToCartSection from '@/components/cart/AddToCartSection';
import RelatedProducts from './RelatedProducts';
import { FaCartShopping } from 'react-icons/fa6';

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
    <div key={product?._id || product?.id} className="max-w-6xl mx-auto py-6 px-4">

      {/* ── Main product section ── */}
      <div className="flex flex-col lg:flex-row gap-8">

        {/* ── LEFT: image gallery (50%) ── */}
        <div className="w-full lg:w-1/2 flex flex-col gap-3">
          <div className="flex gap-3">
            {/* Vertical thumbnail strip */}
            {images.length > 1 && (
              <div className="flex flex-col gap-2 w-16 flex-shrink-0">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentIndex(idx)}
                    className={`rounded border-2 overflow-hidden transition aspect-square ${
                      currentIndex === idx ? 'border-gray-900' : 'border-gray-200 hover:border-gray-400'
                    }`}
                  >
                    <Image src={encodeURI(img)} alt={`${title} ${idx + 1}`} width={64} height={64} className="object-contain w-full h-full p-1" />
                  </button>
                ))}
              </div>
            )}
            {/* Main image */}
            <div className="relative bg-white border border-gray-200 flex-1 aspect-square flex items-center justify-center overflow-hidden rounded">
              {images.length > 1 && (
                <button onClick={prevImage} className="absolute left-2 z-10 p-1.5 bg-white border border-gray-300 rounded-full shadow-sm hover:bg-gray-50 transition">
                  <FaChevronLeft className="w-3 h-3 text-gray-600" />
                </button>
              )}
              <Image src={encodeURI(currentImage)} alt={title} width={600} height={600} className="w-full h-full object-contain p-6" />
              {images.length > 1 && (
                <button onClick={nextImage} className="absolute right-2 z-10 p-1.5 bg-white border border-gray-300 rounded-full shadow-sm hover:bg-gray-50 transition">
                  <FaChevronRight className="w-3 h-3 text-gray-600" />
                </button>
              )}
              {discountPct && (
                <span className="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded">
                  -{discountPct}%
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ── RIGHT: product info (50%) ── */}
        <div className="w-full lg:w-1/2 flex flex-col">

          {/* Title */}
          <h1 className="text-xl font-bold text-gray-900 leading-tight mb-1.5">{title}</h1>

          {/* Stars + review link */}
          <div className="flex items-center gap-2 mb-1">
            <StarDisplay value={averageRating} count={reviewCount} />
            <span className="text-gray-300">|</span>
            <button onClick={scrollToReviews} className="text-xs text-gray-500 hover:text-gray-800 underline underline-offset-3 transition">
              Write a review
            </button>
          </div>

          {/* Price */}
          <div className="flex items-center gap-3 flex-wrap mb-3">
            <span className="text-xl font-bold text-gray-900">৳{price?.toLocaleString()}</span>
            {compareAtPrice && compareAtPrice > price && (
              <span className="text-sm text-gray-400 line-through font-normal">৳{compareAtPrice?.toLocaleString()}</span>
            )}
          </div>

          <hr className="border-gray-200 mb-3 -mt-3" />

          {/* Description */}
          {description && (
            <p className="text-gray-500 text-sm leading-relaxed mb-1 line-clamp-4">
              {description}
            </p>
          )}

          {/* Stock */}
          <div className="mb-3">
            <StockBadge inventory={inventory} availability={availability} />
          </div>

          <hr className="border-gray-200 mb-3 mt-1" />

          {/* Add to cart */}
          <div className="mb-3">
            <AddToCartSection product={product} />
          </div>

         

          {/* Shipping info */}
          <div className="flex flex-col gap-2 mb-3 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <FaTruck className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
              <span>Free shipping on all orders over <strong className="text-gray-700 font-medium">1000 BDT</strong>.</span>
            </div>
            
            <div className="flex items-center gap-2">
              <FaClock className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
              <span>
                Delivers in: <strong className="text-gray-700 font-medium">3–5 Working Days</strong>{' '}
                <a href="/pages/shipping-policy" className="underline underline-offset-2 hover:text-gray-700 transition">Shipping &amp; Return</a>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <FaCartShopping className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
              <span>Guaranteed Safe Checkout</span>
            </div>
          </div>

          <hr className="border-gray-100 mb-3" />

          {/* SKU / Category / Tags / Share */}
          <div className="flex flex-col gap-2 text-sm">
            {product.sku && (
              <div className="flex items-center gap-2">
                <span className="text-gray-400 w-20 flex-shrink-0">SKU:</span>
                <span className="text-gray-600">{product.sku}</span>
              </div>
            )}
            {category && (
              <div className="flex items-center gap-2">
                <span className="text-gray-400 w-20 flex-shrink-0">Category:</span>
                <span className="text-gray-600">{typeof category === 'object' ? category.name : category}</span>
              </div>
            )}
            {tags.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-gray-400 w-20 flex-shrink-0">Tags:</span>
                <span className="text-gray-600">{tags.join(', ')}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <span className="text-gray-400 w-20 flex-shrink-0">Share:</span>
              <div className="flex items-center gap-3">
                <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-blue-600 transition">
                  <FaFacebook className="w-4 h-4" />
                </a>
                <a href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(title)}`} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-sky-500 transition">
                  <FaTwitter className="w-4 h-4" />
                </a>
                <a href={`https://wa.me/?text=${encodeURIComponent(title + ' ' + shareUrl)}`} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-green-600 transition">
                  <FaWhatsapp className="w-4 h-4" />
                </a>
                <button onClick={handleCopy} title="Copy link" className="text-gray-500 hover:text-gray-800 transition">
                  <FaCopy className="w-4 h-4" />
                </button>
                {copied && <span className="text-xs text-green-600">Copied!</span>}
              </div>
            </div>
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
