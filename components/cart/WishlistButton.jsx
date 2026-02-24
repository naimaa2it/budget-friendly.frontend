"use client";

import React from 'react';
import { FaHeart, FaRegHeart } from 'react-icons/fa';
import { useCart } from '@/components/context/CartContext';

export default function WishlistButton({ product }) {
  const { wishlistItems, addToWishlist, removeFromWishlist } = useCart();
  const id = product._id || product.id;
  const isFav = wishlistItems.includes(id);

  const toggle = () => {
    if (isFav) removeFromWishlist(id);
    else addToWishlist(product);
  };

  return (
    <button
      onClick={(e) => { e.stopPropagation(); toggle(); }}
      className={`w-10 h-10 flex items-center justify-center rounded-md transition-colors 
        ${isFav ? 'bg-red-600 text-white' : 'bg-[#1a1a2e] text-white'} hover:bg-red-600`}
      aria-label="Add to wishlist"
    >
      {isFav ? <FaHeart /> : <FaRegHeart />}
    </button>
  );
}
