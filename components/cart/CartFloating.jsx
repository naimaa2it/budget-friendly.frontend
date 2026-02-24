"use client";

import React from 'react';
import { useCart } from '@/components/context/CartContext';
import { FaShoppingBag } from 'react-icons/fa';

export default function CartFloating() {
  const { cartItems, getCartCount, toggleSidebar, isSidebarOpen } = useCart();
  const count = getCartCount();
  if (count === 0 || isSidebarOpen) return null;

  const total = cartItems.reduce(
    (sum, { product, quantity }) => sum + (product.price || 0) * quantity,
    0
  );

  return (
    <button
      onClick={toggleSidebar}
      className="fixed right-0 top-1/2 transform -translate-y-1/2 flex items-center gap-2 bg-[#1a1a2e] text-white px-4 py-2 rounded-l-lg shadow-lg z-50 hover:bg-[#16162a] transition"
    >
      <FaShoppingBag className="w-5 h-5" />
      <div className="flex flex-col items-start text-sm leading-tight">
        <span>{count} ITEM{count>1?"S":""}</span>
        <span>৳{total}</span>
      </div>
    </button>
  );
}
