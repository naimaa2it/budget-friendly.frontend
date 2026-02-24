"use client";

import React, { useState } from 'react';
import QuantitySelector from './QuantitySelector';
import WishlistButton from './WishlistButton';
import { useCart } from '@/components/context/CartContext';

export default function AddToCartSection({ product }) {
  const [qty, setQty] = useState(1);
  const { addToCart } = useCart();

  const handleAdd = () => {
    addToCart(product, qty);
  };

  const unit = product.price || 0;
  const totalPrice = unit * qty;

  return (
    <div className="flex items-center gap-4">
      <WishlistButton product={product} />
      <QuantitySelector quantity={qty} onChange={setQty} />
      <button
        onClick={handleAdd}
        className="bg-red-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-red-700 transition"
      >
        Add to bag
      </button>
      {qty > 1 && (
        <span className="text-sm text-gray-700">
          ৳{totalPrice}
        </span>
      )}
    </div>
  );
}
