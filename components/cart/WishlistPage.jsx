"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/components/context/CartContext';
import Image from 'next/image';
import { FaTrash } from 'react-icons/fa';
import ProductCard from '@/components/Home/ProductCard';
import EmptyState from '@/components/common/EmptyState';

export default function WishlistPage({ embedded = false }) {
  const router = useRouter();
  const { wishlistItems, removeFromWishlist } = useCart();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  // fetch product details for every id in wishlist
  useEffect(() => {
    const load = async () => {
      if (wishlistItems.length === 0) {
        setProducts([]);
        return;
      }
      setLoading(true);
      try {
        const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
        const proms = wishlistItems.map(async (id) => {
          try {
            const resp = await fetch(`${API}/api/products/${id}`);
            const json = await resp.json();
            return json.product || null;
          } catch (err) {
            console.error('Failed to load wishlist product', id, err);
            return null;
          }
        });
        const results = await Promise.all(proms);
        setProducts(results.filter(Boolean));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [wishlistItems]);

  const getId = (p) => p._id || p.id;

  if (loading) {
    return (
      <div className={embedded ? "flex items-center justify-center py-8" : "min-h-screen flex items-center justify-center"}>
        <p>Loading wishlist...</p>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <EmptyState
        title="Your wishlist is empty"
        description="Browse products and tap the heart icon to save them here."
        buttonText="Continue Shopping"
        onButtonClick={() => router.push('/')}
        className={embedded ? "py-8" : ""}
      />
    );
  }

  const content = (
    <>
      {!embedded && <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-2xl font-bold mb-6">My Wishlist</h1>
      </div>}
      <div className={embedded ? "px-4" : "max-w-7xl mx-auto px-4"}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => (
            <div key={getId(product)} className="relative">
              <ProductCard
                product={product}
                imageWidth={250}
                imageHeight={180}
                imageQuality={85}
              />
              <button
                onClick={() => removeFromWishlist(getId(product))}
                className="absolute top-2 right-2 text-red-600 hover:text-red-800 bg-white rounded-full p-1 shadow"
                title="Remove from wishlist"
              >
                <FaTrash />
              </button>
            </div>
          ))}
        </div>
      </div>
    </>
  );

  return content;
}
