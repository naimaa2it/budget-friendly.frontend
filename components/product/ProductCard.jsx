"use client";

import Image from 'next/image';
import React from 'react';
import { useRouter } from 'next/navigation';
import { FaEye, FaShoppingCart, FaHeart } from 'react-icons/fa';
import { useCart } from '@/components/context/CartContext';
import { useUser } from '@/components/context/UserContext';
import AuthModal from '@/components/auth/AuthModal';

export default function ProductCard({ product, imageWidth = 300, imageHeight = 200, imageQuality = 100, showActionsOnHover = true, showDiscount = true, maxTags = 2 }) {
  const router = useRouter();
  const price = product.price || (product.variants && product.variants[0]?.price) || 0;
  const compareAt = product.compareAtPrice || (product.variants && product.variants[0]?.compareAtPrice) || null;
  const discountPct = showDiscount && compareAt && compareAt > price
    ? Math.round(((compareAt - price) / compareAt) * 100)
    : null;

  // badge config — priority order determines which 2 show first
  const BADGE_PRIORITY = ['hot','best_seller','new_arrival','trending','limited','popular_pics','deals_of_the_day'];
  const BADGE_MAP = {
    best_seller:      { label: 'Best Seller', cls: 'bg-yellow-400 text-yellow-900' },
    hot:              { label: 'Hot',         cls: 'bg-red-500 text-white' },
    new_arrival:      { label: 'New',         cls: 'bg-blue-500 text-white' },
    trending:         { label: 'Trending',    cls: 'bg-purple-500 text-white' },
    limited:          { label: 'Limited',     cls: 'bg-orange-500 text-white' },
    popular_pics:     { label: 'Popular',     cls: 'bg-pink-500 text-white' },
    deals_of_the_day: { label: 'Deal',        cls: 'bg-emerald-500 text-white' },
  };
  const sortedBadges = BADGE_PRIORITY.filter(b => (product.badges || []).includes(b));
  const visibleTags = sortedBadges.slice(0, maxTags);

  // handle hover/click image swap
  const images = (product.images && product.images.length) ? product.images.map(i => i.url) : ['/assets/placeholder.svg'];
  const [useSecond, setUseSecond] = React.useState(false);
  const [hovered, setHovered] = React.useState(false);
  const currentImage = () => {
    if ((hovered || useSecond) && images[1]) return images[1];
    return images[0];
  };
  const image = encodeURI(currentImage());

  const id = product._id || product.id;
  const { addToCart, addToWishlist } = useCart();
  const { user } = useUser();
  const [showAuthModal, setShowAuthModal] = React.useState(false);
  const [pendingWishlist, setPendingWishlist] = React.useState(null);

  // if user becomes available and we had a pending product to add, add it
  React.useEffect(() => {
    if (user && pendingWishlist) {
      addToWishlist(pendingWishlist);
      setPendingWishlist(null);
    }
  }, [user, pendingWishlist, addToWishlist]);
  const href = `/product/${id}`;

  const handleCardClick = () => {
    router.push(href);
  };

  return (
    <> 
    <div 
      onClick={handleCardClick} 
      className="bg-white rounded-lg border border-gray-200 overflow-hidden group hover:shadow-xl transition-all duration-300 flex flex-col cursor-pointer h-full"
    >
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

        {/* Overlay: discount LEFT, tags RIGHT — hidden on hover to show action buttons */}
        <div className="absolute inset-x-0 top-0 flex items-start justify-between p-1.5 pointer-events-none group-hover:opacity-0 transition-opacity duration-200">
          {/* Discount badge — top left */}
          <div>
            {discountPct && (
              <span className="bg-gradient-to-r from-rose-500 to-red-600 text-white text-[10px] font-bold px-1 py-0.5 rounded-sm leading-none">
                -{discountPct}%
              </span>
            )}
          </div>
          {/* Tags — top right, stacked */}
          <div className="flex flex-col items-end gap-0.5">
            {visibleTags.map(b => (
              <span key={b} className={`${BADGE_MAP[b].cls} text-[9px] font-bold px-1.5 py-0.5 rounded-sm leading-none`}>
                {BADGE_MAP[b].label}
              </span>
            ))}
          </div>
        </div>

        <div className={`absolute top-2 right-2 flex flex-col gap-1.5 transition-opacity duration-300 ${showActionsOnHover ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'}`}>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              router.push(href);
            }}
            className="w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-md hover:bg-red-600 hover:text-white transition-colors"
          >
            <FaEye className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              addToCart(product, 1);
            }}
            className="w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-md hover:bg-red-600 hover:text-white transition-colors"
            title="Add to cart"
          >
            <FaShoppingCart className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (!user) {
                setPendingWishlist(product);
                setShowAuthModal(true);
              } else {
                addToWishlist(product);
              }
            }}
            className="w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-md hover:bg-red-600 hover:text-white transition-colors"
            title="Add to wishlist"
          >
            <FaHeart className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="p-3 flex flex-col grow">
        <p className="text-sm text-gray-600 mb-1 line-clamp-1">{product.title || product.category}</p>
        <h3 className="text-sm font-semibold text-gray-900 mb-1 line-clamp-2">{product.description || product.title}</h3>

        <div className="mb-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-lg font-bold text-red-600">৳{price?.toLocaleString()}</span>
            {compareAt && compareAt > price && (
              <span className="text-sm text-gray-500 line-through">৳{compareAt?.toLocaleString()}</span>
            )}
          </div>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            addToCart(product, 1);
          }}
          className="w-full bg-red-600 text-white py-2 rounded-md font-medium hover:bg-red-700 transition mt-auto"
        >
          Add to Cart
        </button>
      </div>
    </div>
    <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </>
  );
}
