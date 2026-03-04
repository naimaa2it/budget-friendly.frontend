"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import ProductInfoTabs from './ProductInfoTabs';
import { FaChevronLeft, FaChevronRight, FaStar, FaStarHalfAlt, FaRegStar, FaFacebook, FaTwitter, FaWhatsapp, FaCopy, FaTruck, FaClock, FaTimes, FaGift, FaCommentDots, FaPencilAlt } from 'react-icons/fa';
import AddToCartSection from '@/components/cart/AddToCartSection';
import RelatedProducts from './RelatedProducts';
import { FaCartShopping } from 'react-icons/fa6';
import RecentlyViewed, { saveRecentlyViewed } from './RecentlyViewed';

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
  return <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-600"><span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />Only{inventory != null ? ` ${inventory}` : ''} items left in Stock</span>;
}

export default function ProductDetails({ product, relatedProducts = [] }) {
  const images = (product?.images || []).map(i => i.url);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [copied, setCopied] = useState(false);
  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [zoomOpen, setZoomOpen] = useState(false);
  const currentImage = images[currentIndex] || '/assets/placeholder.svg';

  // Save to recently-viewed list on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (product) saveRecentlyViewed(product);
  }, [product?._id]); // intentionally using _id — only re-save when product changes

  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
  const handleCopy = () => {
    navigator.clipboard?.writeText(shareUrl).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  };

  const prevImage = () => { if (images.length) setCurrentIndex(i => (i - 1 + images.length) % images.length); };
  const nextImage = () => { if (images.length) setCurrentIndex(i => (i + 1) % images.length); };

  if (!product) return <div className="py-24 text-center text-gray-500">Loading product...</div>;

  const { title, description, price, compareAtPrice, inventory, availability, averageRating = 0, reviewCount = 0, tags = [], category } = product;
  const discountPct = compareAtPrice && compareAtPrice > price ? Math.round(((compareAtPrice - price) / compareAtPrice) * 100) : null;
  const categoryName = typeof category === 'object' ? (category?.name || '') : (category || '');
  const isClothing = /cloth|apparel|fashion|wear|shirt|pant|dress|garment|tshirt|t-shirt|trouser|jean|tops?|suit|jacket|hoodie|sweater|kurti|saree|lehenga|kurta|blouse|skirt|frock/i.test(categoryName);
  const productColors = product.colors || [];
  const productSizes = product.sizes || [];

  const specs = product.specs || {};
  const specArray = Object.entries(specs).map(([k, v]) => ({ key: k, value: String(v) }));
  const tabProduct = { ...product, description, specifications: specArray };

  const scrollToReviews = () => {
    // activate tab and scroll
    window.dispatchEvent(new Event('openReviews'));
  };

  // Map common color names to hex so swatches always show the right colour
  const COLOR_MAP = {
    red: '#ef4444', blue: '#3b82f6', green: '#22c55e', yellow: '#facc15',
    orange: '#f97316', purple: '#a855f7', pink: '#ec4899', black: '#111827',
    white: '#ffffff', gray: '#9ca3af', grey: '#9ca3af', brown: '#92400e',
    navy: '#1e3a5f', 'navy blue': '#1e3a5f', skyblue: '#7dd3fc',
    'sky blue': '#7dd3fc', 'light blue': '#93c5fd', 'dark blue': '#1d4ed8',
    teal: '#14b8a6', cyan: '#06b6d4', indigo: '#6366f1', violet: '#7c3aed',
    gold: '#ca8a04', silver: '#d1d5db', beige: '#e5d3b3', cream: '#fef9c3',
    maroon: '#7f1d1d', magenta: '#d946ef', lime: '#84cc16', olive: '#65a30d',
    coral: '#fb7185', salmon: '#fda4af', turquoise: '#2dd4bf',
    'off white': '#f5f5f5', offwhite: '#f5f5f5', 'light green': '#86efac',
    'dark green': '#15803d', 'light gray': '#e5e7eb', 'dark gray': '#4b5563',
    'rose gold': '#d4a5a5', charcoal: '#374151', mustard: '#ca8a04',
  };
  const resolveColor = (col) => {
    // 1. Use hex if provided — ensure it starts with #
    if (col.hex && col.hex.trim()) {
      const h = col.hex.trim();
      return h.startsWith('#') ? h : `#${h}`;
    }
    // 2. Look up name in map (exact, then partial)
    const key = (col.name || '').toLowerCase().trim();
    if (COLOR_MAP[key]) return COLOR_MAP[key];
    // partial match — e.g. "Dark Navy Blue" → try "navy blue", "blue"
    for (const mapKey of Object.keys(COLOR_MAP)) {
      if (key.includes(mapKey)) return COLOR_MAP[mapKey];
    }
    // 3. Return as-is (valid CSS color names like "red", "blue" still work)
    return col.name || '#cccccc';
  };

  return (
    <div key={product?._id || product?.id} className="max-w-6xl mx-auto py-6 px-4">

      {/* ── Main product section ── */}
      <div className="flex flex-col lg:flex-row gap-6">

        {/* ── LEFT: image gallery ── */}
        <div className="w-full lg:w-[42%] flex flex-col gap-3">
          <div className="flex gap-3">
            {/* Vertical thumbnail strip */}
            {images.length > 1 && (
              <div className="flex flex-col gap-2 w-16 flex-shrink-0">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentIndex(idx)}
                    className={`rounded border-1 overflow-hidden transition aspect-square ${
                      currentIndex === idx ? 'border-gray-900' : 'border-gray-200 hover:border-gray-400'
                    }`}
                  >
                    <Image src={encodeURI(img)} alt={`${title} ${idx + 1}`} width={64} height={64} className="object-contain w-full h-full p-0" />
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
              <button
                onClick={() => setZoomOpen(true)}
                className="w-full h-full cursor-zoom-in group flex items-center justify-center"
                title="Click to zoom"
              >
                <Image src={encodeURI(currentImage)} alt={title} width={600} height={600} className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-300" />
              </button>
              {images.length > 1 && (
                <button onClick={nextImage} className="absolute right-2 z-10 p-1.5 bg-white border border-gray-300 rounded-full shadow-sm hover:bg-gray-50 transition">
                  <FaChevronRight className="w-3 h-3 text-gray-600" />
                </button>
              )}
              {discountPct && (
                <span className="absolute top-3 left-3 bg-gradient-to-r from-red-400 to-red-600 text-white text-xs font-bold px-2 py-0.5 rounded">
                  -{discountPct}%
                </span>
              )}
              {/* Product badges — top right */}
              {product.badges?.length > 0 && (
                <div className="absolute top-3 right-3 flex flex-col gap-1 items-end">
                  {product.badges.slice(0, 3).map(badge => {
                    const map = {
                      best_seller:     { label: '⭐ Best Seller',    cls: 'bg-gradient-to-r from-yellow-200 to-yellow-300 text-yellow-800' },
                      hot:             { label: '🔥 Hot',            cls: 'bg-gradient-to-r from-orange-200 to-orange-300 text-orange-800' },
                      new_arrival:     { label: '🎀 New Arrival',    cls: 'bg-gradient-to-r from-blue-200 to-blue-300 text-blue-800' },
                      trending:        { label: '📈 Trending',       cls: 'bg-gradient-to-r from-purple-200 to-purple-300 text-purple-800' },
                      limited:         { label: '🔒 Limited',        cls: 'bg-gradient-to-r from-red-200 to-red-300 text-red-800' },
                      popular_pics:    { label: '🎉 Popular',        cls: 'bg-gradient-to-r from-pink-200 to-pink-300 text-pink-800' },
                      deals_of_the_day:{ label: '🏷️ Deal of the Day',cls: 'bg-gradient-to-r from-green-200 to-green-300 text-green-800' },
                    };
                    const b = map[badge];
                    return b ? (
                      <span key={badge} className={`${b.cls} text-[10px] font-bold px-2 py-0.5 rounded`}> 
                        {b.label}
                      </span>
                    ) : null;
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── MIDDLE: product info ── */}
        <div className="w-full lg:flex-1 flex flex-col">

          {/* Title */}
          <h1 className="text-xl font-bold text-gray-900 leading-tight mb-1.5">{title}</h1>

          {/* Stars + review link */}
          <div className="flex items-center gap-2 mb-1">
            <StarDisplay value={averageRating} count={reviewCount} />
            <span className="text-gray-300">|</span>
            <button onClick={scrollToReviews} className="text-xs text-gray-600 hover:text-gray-800 underline underline-offset-3 transition">
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

          {/* Color swatches */}
          {productColors.length > 0 && (
            <div className="mb-3">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Available Colors:</span>
                {selectedColor && <span className="text-xs text-gray-500">{selectedColor.name}</span>}
              </div>
              <div className="flex flex-wrap gap-3">
                {productColors.map((col, idx) => {
                    const isSelected = selectedColor?.name === col.name;
                    const color = resolveColor(col);
                    return (
                      <button
                        key={idx}
                        onClick={() => setSelectedColor(isSelected ? null : col)}
                        title={col.name}
                        className="flex flex-col items-center gap-1 transition-all"
                      >
                        <span
                          className={`w-8 h-8 block transition-all ${
                            isSelected ? 'scale-110' : 'hover:scale-105'
                          }`}
                          style={{
                            backgroundColor: color,
                            border: isSelected
                              ? `3px solid ${color}`
                              : '2px solid #e5e7eb',
                            outline: isSelected ? `3px solid ${color}` : undefined,
                            outlineOffset: isSelected ? '2px' : undefined,
                            boxShadow: isSelected ? `0 0 0 3px ${color}40` : undefined,
                          }}
                        />
                        <span className={`text-[9px] leading-none ${
                          isSelected ? 'font-bold text-gray-900' : 'text-gray-400'
                        }`}>{col.name}</span>
                      </button>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Size selector — clothing category only */}
          {isClothing && productSizes.length > 0 && (
            <div className="mb-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Size:</span>
                {selectedSize && (
                  <span className="text-xs text-gray-500">Selected: <strong className="text-gray-700">{selectedSize}</strong></span>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {productSizes.map((size, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedSize(selectedSize === size ? null : size)}
                    className={`min-w-[36px] h-8 px-3 text-xs font-semibold rounded border transition-all ${
                      selectedSize === size
                        ? 'bg-gray-900 text-white border-gray-900'
                        : 'bg-white text-gray-700 border-gray-200 hover:border-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}

          <hr className="border-gray-200 mb-3 mt-1" />

          {/* Add to cart */}
          <div className="mb-3">
            <AddToCartSection product={product} />
          </div>

         

          {/* Shipping info */}
          <div className="flex flex-col gap-2 mb-3 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <FaTruck className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
              <span>Free shipping on all orders over <strong className="text-gray-700 font-medium">1000 BDT</strong>.</span>
            </div>
            
            <div className="flex items-center gap-2">
              <FaClock className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
              <span>
                Delivers in: <strong className="text-gray-700 font-medium">3–5 Working Days</strong>{' '}
                <a href="/pages/shipping-policy" className="underline underline-offset-2 text-black text-xs hover:text-gray-700 transition">Shipping &amp; Return</a>
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
        {/* ── RIGHT: Available Offers sidebar ── */}
        <div className="w-full lg:w-52 flex-shrink-0 flex flex-col gap-3">

          {/* Available Offer card */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-gray-50 border-b border-gray-200 px-3 py-2">
              <p className="text-xs font-bold text-gray-700 uppercase tracking-wide">Available Offer</p>
            </div>

            {/* Reward Points */}
            <div className="px-3 py-3 flex items-start gap-3 border-b border-gray-100">
              <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                <FaGift className="text-blue-500 w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <p className="text-[11px] font-bold text-gray-800">Earn Points, Save More</p>
                {product.rewardPoints > 0 ? (
                  <p className="text-xs text-blue-600 font-semibold mt-0.5">
                    Earn <strong className='text-red-500'>{product.rewardPoints}</strong> points on this order
                  </p>
                ) : (
                  <p className="text-[10px] text-gray-400 mt-0.5">Points credited after delivery</p>
                )}
              </div>
            </div>

            {/* Ask about product */}
            <div className="px-3 py-2.5">
              <button
                onClick={() => {
                  const el = document.getElementById('reviews-tab');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                  window.dispatchEvent(new Event('openQuestions'));
                }}
                className="w-full flex items-center gap-2 text-[11px] font-semibold text-gray-700 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded px-3 py-2 transition-all"
              >
                <FaCommentDots className="text-orange-400 w-3.5 h-3.5 flex-shrink-0" />
                Ask about this product
              </button>
            </div>

            {/* Write a review */}
            <div className="px-3 pb-3">
              <button
                onClick={scrollToReviews}
                className="w-full flex items-center gap-2 text-[11px] font-semibold text-gray-700 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded px-3 py-2 transition-all"
              >
                <FaPencilAlt className="text-green-500 w-3 h-3 flex-shrink-0" />
                Write your Awesome Review
              </button>
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

      {/* recently viewed */}
      <RecentlyViewed currentProductId={product?._id} />

      {/* ── Image Zoom Modal ── */}
      {zoomOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setZoomOpen(false)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] w-full h-full flex items-center justify-center"
            onClick={e => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setZoomOpen(false)}
              className="absolute top-2 right-2 z-10 w-8 h-8 rounded-full bg-white/90 hover:bg-white flex items-center justify-center shadow-md transition"
            >
              <FaTimes className="w-3.5 h-3.5 text-gray-700" />
            </button>

            {/* Prev / Next */}
            {images.length > 1 && (
              <button
                onClick={() => setCurrentIndex(i => (i - 1 + images.length) % images.length)}
                className="absolute left-2 z-10 p-2 bg-white/90 rounded-full shadow-md hover:bg-white transition"
              >
                <FaChevronLeft className="w-4 h-4 text-gray-700" />
              </button>
            )}
            {images.length > 1 && (
              <button
                onClick={() => setCurrentIndex(i => (i + 1) % images.length)}
                className="absolute right-2 z-10 p-2 bg-white/90 rounded-full shadow-md hover:bg-white transition"
              >
                <FaChevronRight className="w-4 h-4 text-gray-700" />
              </button>
            )}

            {/* Zoomed image */}
            <div className="bg-white rounded-xl overflow-hidden flex items-center justify-center" style={{ maxWidth: '700px', maxHeight: '80vh', width: '100%', height: '100%' }}>
              <Image
                src={encodeURI(currentImage)}
                alt={title}
                width={900}
                height={900}
                className="w-full h-full object-contain p-4"
              />
            </div>

            {/* Thumbnail strip */}
            {images.length > 1 && (
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentIndex(idx)}
                    className={`w-10 h-10 rounded border-2 overflow-hidden bg-white transition ${
                      currentIndex === idx ? 'border-white' : 'border-white/30 hover:border-white/70'
                    }`}
                  >
                    <Image src={encodeURI(img)} alt={`thumb-${idx}`} width={40} height={40} className="w-full h-full object-contain" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
