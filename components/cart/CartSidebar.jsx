"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useCart } from '@/components/context/CartContext';
import QuantitySelector from './QuantitySelector';
import { FaTimes, FaShoppingBag, FaTrash } from 'react-icons/fa';
import Lottie from 'lottie-react';

const EMPTY_ANIM = "https://assets5.lottiefiles.com/packages/lf20_usmfx6bp.json";

export default function CartSidebar() {
  const router = useRouter();
  const {
    cartItems,
    isSidebarOpen,
    toggleSidebar,
    updateQty,
    removeFromCart,
  } = useCart();

  // lock body scroll when sidebar is open
  React.useEffect(() => {
    document.body.style.overflow = isSidebarOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isSidebarOpen]);

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
    <>
      <div
        className={`fixed top-0 right-0 h-full w-80 md:w-100 bg-[#FFFCFC] shadow-lg transform transition-transform duration-300 z-50 ${
          isSidebarOpen ? 'translate-x-0' : 'translate-x-full'
        } flex flex-col`}
      >
      <div className="flex items-center justify-between p-4 bg-black text-white shrink-0">
        <div className="flex items-center gap-2">
          <FaShoppingBag className="w-5 h-5" />
          <h2 className="text-lg font-semibold">My Cart Item(s): {cartItems.length}</h2>
        </div>
        <button onClick={toggleSidebar} className="p-1">
          <FaTimes />
        </button>
      </div>
      <div className="p-4 grow overflow-y-auto">
        {cartItems.length === 0 && (
          <EmptyAnimation />
        )}
        {cartItems.map(({ product, quantity }) => {
          const id = product._id || product.id;
          // coerce values to numeric in case they are strings with currency symbols
          const price = parseFloat(String(product.price).replace(/[^0-9.-]+/g, '')) || 0;
          const compare = parseFloat(String(product.compareAtPrice || price).replace(/[^0-9.-]+/g, '')) || price;
          const itemSaved = (compare - price) * quantity;
          const thumb = product.images && product.images[0] && product.images[0].url;
          return (
            <div key={id} className="mb-4 border-b pb-4">
              {/* header row: thumbnail + title/unit price + delete */}
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  {thumb && (
                    <Image
                      src={encodeURI(thumb)}
                      alt={product.title || product.name}
                      width={48}
                      height={48}
                      className="object-contain"
                    />
                  )}
                  <div>
                    <p className="font-medium text-sm">{product.title || product.name}</p>
                    <p className="text-xs text-gray-500">৳{price} each</p>
                  </div>
                </div>
                <button
                  onClick={() => removeFromCart(getId(product))}
                  className="text-gray-400 hover:text-red-600"
                  title="Remove item"
                >
                  <FaTrash />
                </button>
              </div>
              {/* controls row: quantity + savings on left, prices on right */}
              <div className="mt-2 flex items-center justify-between">
                <div className="flex flex-col">
                  <div className="flex items-center gap-4">
                    <QuantitySelector
                      quantity={quantity}
                      onChange={(q) => updateQty(getId(product), q)}
                    />
                    {itemSaved > 0 && (
                      <div className="text-green-600 text-xs whitespace-nowrap">
                        Saved <span className='text-red-600'>
                           ৳{itemSaved}
                          </span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-right text-sm">
                  <div>৳{price * quantity}</div>
                  {/* perhaps show original total if different? */}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {cartItems.length > 0 && (
        <div className="p-4 border-t shrink-0 mt-auto">
          <div className="flex justify-between mb-2">
            <span className="font-medium">Total</span>
            <span className="font-semibold">৳{total}</span>
          </div>
          {saved > 0 && (
            <div className="text-green-600 text-sm mb-2">
              You are saving ৳{saved} on this order
            </div>
          )}
          <div className="flex gap-2">
            <button
              onClick={() => {
                toggleSidebar();
                router.push('/cart');
              }}
              className="flex-1 border border-gray-300 text-gray-700 py-2 rounded hover:bg-gray-50"
            >
              View Cart
            </button>
            <button
              onClick={() => {
                toggleSidebar();
                router.push('/checkout');
              }}
              className="flex-1 bg-red-600 text-white py-2 rounded hover:bg-red-700"
            >
              Proceed Checkout
            </button>
          </div>
        </div>
      )}
    </div>
    </>
  );
}

function getId(p){return p._id||p.id;}

// small helper component used when sidebar is empty
function EmptyAnimation() {
  const router = useRouter();
  const [anim, setAnim] = useState(null);

  useEffect(() => {
    fetch(EMPTY_ANIM)
      .then((r) => r.json())
      .then((json) => setAnim(json))
      .catch((err) => console.error('Failed to load sidebar animation', err));
  }, []);

  return (
    <div className="text-center">
      {anim && (
        <div className="w-full max-w-[120px] mx-auto mb-4" style={{ height: 120 }}>
          <Lottie animationData={anim} loop autoplay />
        </div>
      )}
      <p className="text-gray-500 mb-4">Your cart is empty</p>
      <button
        onClick={() => router.push('/')}
        className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition text-sm"
      >
        Explore More
      </button>
    </div>
  );
}
