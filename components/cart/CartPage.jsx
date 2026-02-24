"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/components/context/CartContext';
import QuantitySelector from '@/components/cart/QuantitySelector';
import ProductCard from '@/components/Home/ProductCard';
import Image from 'next/image';
import { FaTrash } from 'react-icons/fa';

export default function CartPage() {
  const router = useRouter();
  const { cartItems, updateQty, removeFromCart } = useCart();
  const [recommendedProducts, setRecommendedProducts] = useState([]);

  // Calculate totals
  const subtotal = cartItems.reduce(
    (sum, { product, quantity }) => sum + (product.price || 0) * quantity,
    0
  );
  
  const originalTotal = cartItems.reduce(
    (sum, { product, quantity }) =>
      sum + (product.compareAtPrice || product.price || 0) * quantity,
    0
  );
  
  const saved = originalTotal - subtotal;

  // Fetch recommended products
  useEffect(() => {
    const fetchRecommended = async () => {
      try {
        const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
        const resp = await fetch(`${API}/api/products?badge=popular_pics&limit=12`);
        const json = await resp.json();
        const items = json.items || [];
        setRecommendedProducts(items);
      } catch (err) {
        console.error('Failed to fetch recommended products', err);
      }
    };
    fetchRecommended();
  }, []);

  const handleCheckout = () => {
    router.push('/checkout');
  };

  const getId = (p) => p._id || p.id;

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-3xl font-bold mb-4">Your Cart is Empty</h1>
          <p className="text-gray-600 mb-8">Start shopping to add items to your cart!</p>
          <button
            onClick={() => router.push('/')}
            className="bg-red-600 text-white px-8 py-3 rounded-lg hover:bg-red-700 transition"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Cart Items */}
        <div className="bg-white rounded-lg shadow mb-8">
          {cartItems.map(({ product, quantity }) => {
            const id = getId(product);
            const price = product.price || 0;
            const compareAt = product.compareAtPrice || price;
            const itemSaved = (compareAt - price) * quantity;
            const image = product.images?.[0]?.url || '/assets/placeholder.svg';
            const title = product.title || product.name;

            return (
              <div key={id} className="p-6 border-b last:border-b-0">
                <div className="flex items-center gap-6">
                  {/* Product Image */}
                  <div className="shrink-0">
                    <Image
                      src={encodeURI(image)}
                      alt={title}
                      width={100}
                      height={100}
                      className="object-contain rounded"
                    />
                  </div>

                  {/* Product Details */}
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-2">{title}</h3>
                    <div className="flex items-center gap-4 mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">Price:</span>
                        <span className="text-lg font-bold text-red-600">৳{price}</span>
                        {compareAt > price && (
                          <span className="text-sm text-gray-500 line-through">৳{compareAt}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      {/* Quantity Controls */}
                      <div className="flex items-center gap-4">
                        <button
                          onClick={() => updateQty(id, Math.max(1, quantity - 1))}
                          className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-100 text-lg font-semibold"
                        >
                          -
                        </button>
                        <span className="w-12 text-center font-medium">{quantity}</span>
                        <button
                          onClick={() => updateQty(id, quantity + 1)}
                          className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-100 text-lg font-semibold"
                        >
                          +
                        </button>
                      </div>

                      {/* Item Total */}
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">Total:</span>
                        <span className="text-xl font-bold text-gray-900">৳{(price * quantity).toFixed(2)}</span>
                      </div>

                      {/* Savings */}
                      {itemSaved > 0 && (
                        <div className="text-sm text-green-600">
                          Saved <span className="font-semibold">৳{itemSaved}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Remove Button */}
                  <button
                    onClick={() => removeFromCart(id)}
                    className="text-red-600 hover:text-red-700 p-2"
                    title="Remove item"
                  >
                    <FaTrash className="w-5 h-5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Cart Summary */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Cart Total</h2>
              <p className="text-3xl font-bold text-red-600">৳{subtotal.toFixed(2)}</p>
              {saved > 0 && (
                <p className="text-sm text-green-600 mt-2">
                  You are saving ৳{saved.toFixed(2)} on this order
                </p>
              )}
            </div>
            <button
              onClick={handleCheckout}
              className="bg-[#1a1a2e] text-white px-8 py-3 rounded-lg font-semibold hover:bg-[#16162a] transition text-lg"
            >
              Proceed To Checkout
            </button>
          </div>
        </div>

        {/* Recommended Products */}
        {recommendedProducts.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-6">Picked For You</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {recommendedProducts.slice(0, 10).map((product) => (
                <ProductCard
                  key={product._id || product.id}
                  product={product}
                  imageWidth={250}
                  imageHeight={180}
                  imageQuality={85}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
