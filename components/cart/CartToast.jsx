"use client";

import React, { useEffect } from 'react';
import { useCart } from '@/components/context/CartContext';

export default function CartToast() {
  const { toastData, setToastData, toggleSidebar, getCartCount } = useCart();

  useEffect(() => {
    if (toastData) {
      const id = setTimeout(() => setToastData(null), 3000);
      return () => clearTimeout(id);
    }
  }, [toastData, setToastData]);

  if (!toastData) return null;

  const { product, qty } = toastData;
  const title = product.title || product.name || 'Item';

  return (
    <div className="fixed top-16 right-4 bg-red-600 text-white rounded-lg px-6 py-3 flex items-center gap-4 z-50 shadow-lg">
      <div>
        <span className="font-medium">{qty} ITEMS</span> &nbsp; ৳{(product.price||0)*qty}
      </div>
      <button
        onClick={toggleSidebar}
        className="text-sm underline"
      >
        View
      </button>
    </div>
  );
}
