"use client";

import React from 'react';
import { useCart } from '@/components/context/CartContext';
import QuantitySelector from './QuantitySelector';
import { FaTimes } from 'react-icons/fa';

export default function CartSidebar() {
  const {
    cartItems,
    isSidebarOpen,
    toggleSidebar,
    updateQty,
    removeFromCart,
  } = useCart();

  const total = cartItems.reduce(
    (sum, { product, quantity }) => sum + (product.price || 0) * quantity,
    0
  );
  const originalTotal = cartItems.reduce(
    (sum, { product, quantity }) =>
      sum + (product.compareAtPrice || product.price || 0) * quantity,
    0
  );
  const saved = originalTotal - total;

  return (
    <div
      className={`fixed top-0 right-0 h-full w-80 bg-white shadow-lg transform transition-transform duration-300 z-40 ${
        isSidebarOpen ? 'translate-x-0' : 'translate-x-full'
      }`}
    >
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-lg font-semibold">My Cart ({cartItems.length})</h2>
        <button onClick={toggleSidebar} className="p-1">
          <FaTimes />
        </button>
      </div>
      <div className="p-4 flex-grow overflow-y-auto">
        {cartItems.length === 0 && <p className="text-center text-gray-500">Your cart is empty</p>}
        {cartItems.map(({ product, quantity }) => {
          const id = product._id || product.id;
          const price = product.price || 0;
          const compare = product.compareAtPrice || price;
          const itemSaved = (compare - price) * quantity;
          const thumb = product.images && product.images[0] && product.images[0].url;
          return (
            <div key={id} className="mb-4 border-b pb-4">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  {thumb && (
                    <img
                      src={encodeURI(thumb)}
                      alt={product.title || product.name}
                      className="w-12 h-12 object-contain"
                    />
                  )}
                  <div>
                    <p className="font-medium text-sm">{product.title || product.name}</p>
                    <p className="text-xs text-gray-500">৳{price} each</p>
                  </div>
                </div>
                <button
                  onClick={() => removeFromCart(getId(product))}
                  className="text-gray-400 hover:text-gray-600"
                >
                  &times;
                </button>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <QuantitySelector
                  quantity={quantity}
                  onChange={(q) => updateQty(getId(product), q)}
                />
                <div className="text-sm">
                  <div>৳{price * quantity}</div>
                  {itemSaved > 0 && (
                    <div className="text-green-600 text-xs">
                      You saved ৳{itemSaved}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {cartItems.length > 0 && (
        <div className="p-4 border-t">
          <div className="flex justify-between mb-2">
            <span className="font-medium">Total</span>
            <span className="font-semibold">৳{total}</span>
          </div>
          {saved > 0 && (
            <div className="text-green-600 text-sm mb-2">
              You are saving ৳{saved} on this order
            </div>
          )}
          <button className="w-full bg-red-600 text-white py-2 rounded">
            Checkout
          </button>
        </div>
      )}
    </div>
  );
}

function getId(p){return p._id||p.id;}
