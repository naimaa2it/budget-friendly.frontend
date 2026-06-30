"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/context/CartContext";
import Image from "next/image";
import { FaTrash } from "react-icons/fa";
import ProductCard from "@/components/product/ProductCard";
import EmptyState from "@/components/ui/EmptyState";
import { useLanguage } from "@/components/context/LanguageContext";

export default function WishlistPage({ embedded = false }) {
  const router = useRouter();
  const { wishlistItems, removeFromWishlist } = useCart();
  const { t } = useLanguage();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  // fetch product details for every id in wishlist
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (wishlistItems.length === 0) {
        setProducts([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const API = process.env.NEXT_PUBLIC_API_URL || "https://api.pickob.com";
        const proms = wishlistItems.map(async (id) => {
          try {
            const resp = await fetch(`${API}/api/products/${id}`);
            const json = await resp.json();
            return json.product || null;
          } catch (err) {
            console.error("Failed to load wishlist product", id, err);
            return null;
          }
        });
        const results = await Promise.all(proms);
        if (!cancelled) {
          setProducts(results.filter(Boolean));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [wishlistItems]);

  const getId = (p) => p._id || p.id;

  if (loading) {
    return (
      <div
        className={
          embedded
            ? "flex items-center justify-center py-8"
            : "min-h-screen flex items-center justify-center"
        }
      >
        <p>{t("wishlist.loading")}</p>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <EmptyState
        title={t("wishlist.empty_title")}
        description={t("wishlist.empty_msg")}
        buttonText={t("success.continue_shopping")}
        onButtonClick={() => router.push("/")}
        className={embedded ? "py-8" : ""}
      />
    );
  }

  const content = (
    <>
      {!embedded && (
        <div className="max-w-7xl mx-auto px-2">
          <h1 className="text-2xl font-bold mb-6">{t("wishlist.title")}</h1>
        </div>
      )}
      <div
        className={embedded ? "px-1 md:px-4" : "max-w-7xl mx-auto px-3 md:px-4"}
      >
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 md:gap-6">
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
                className="absolute top-10 left-2 text-red-600 hover:text-red-800 bg-white rounded-full p-1 shadow"
                title={t("wishlist.remove")}
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
