"use client";

import React from 'react';
import { FaHeart, FaRegHeart } from 'react-icons/fa';
import { useCart } from '@/components/context/CartContext';
import { useUser } from '@/components/context/UserContext';
import AuthModal from '../authentication/AuthModal';

export default function WishlistButton({ product }) {
  const { wishlistItems, addToWishlist, removeFromWishlist } = useCart();
  const { user } = useUser();
  const [showAuthModal, setShowAuthModal] = React.useState(false);
  const [pendingToggle, setPendingToggle] = React.useState(null);

  const id = product._id || product.id;
  const isFav = wishlistItems.includes(id);

  const toggle = () => {
    if (!user && !isFav) {
      // need login before adding
      setPendingToggle(product);
      setShowAuthModal(true);
      return;
    }

    if (isFav) removeFromWishlist(id);
    else addToWishlist(product);
  };

  React.useEffect(() => {
    if (user && pendingToggle) {
      addToWishlist(pendingToggle);
      setPendingToggle(null);
    }
  }, [user, pendingToggle, addToWishlist]);

  return (
    <>
    <button
      onClick={(e) => { e.stopPropagation(); toggle(); }}
      className={`w-10 h-10 flex items-center justify-center rounded-md transition-colors 
        ${isFav ? 'bg-red-600 text-white' : 'bg-[#1a1a2e] text-white'} hover:bg-red-600`}
      aria-label="Add to wishlist"
    >
      {isFav ? <FaHeart /> : <FaRegHeart />}
    </button>
    <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </>);

}
