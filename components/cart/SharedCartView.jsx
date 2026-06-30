"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import toast from "react-hot-toast";
import { useCart } from "@/components/context/CartContext";
import {
  resolveVariant,
  resolveVariantPrice,
} from "@/components/cart/VariantEditModal";
import { FaShoppingCart, FaUsers } from "react-icons/fa";

const API = process.env.NEXT_PUBLIC_API_URL || "https://api.pickob.com";

export default function SharedCartView({ token }) {
  const router = useRouter();
  const { addToCart } = useCart();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (!token || token === "__placeholder__") return;
    fetch(`${API}/api/cart/share/${token}`)
      .then((r) => r.json().then((data) => ({ ok: r.ok, data })))
      .then(({ ok, data }) => {
        if (!ok) {
          setError(
            data.error || "This shared cart link is invalid or expired.",
          );
          return;
        }
        setItems(data.items || []);
      })
      .catch(() =>
        setError("Could not load this shared cart. Please try again."),
      )
      .finally(() => setLoading(false));
  }, [token]);

  const total = items.reduce((sum, i) => {
    const price =
      resolveVariantPrice(i.product, i.color, i.size) || i.product.price || 0;
    return sum + price * i.quantity;
  }, 0);

  const handleAddAll = () => {
    setAdding(true);
    items.forEach((i) => {
      const variant = resolveVariant(i.product, i.color, i.size);
      addToCart(i.product, i.quantity, {
        selectedColor: i.color || null,
        selectedSize: i.size || null,
        selectedVariant: variant,
        silent: true,
      });
    });
    toast.success(
      `Added ${items.length} item${items.length > 1 ? "s" : ""} to your cart!`,
    );
    setAdding(false);
    router.push("/cart");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-400">
        Loading shared cart…
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 px-4 text-center">
        <p className="text-gray-600 font-medium">{error}</p>
        <button
          onClick={() => router.push("/")}
          className="bg-red-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-red-700 transition"
        >
          Continue Shopping
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-3 md:px-4">
        <div className="flex items-center gap-2 mb-6">
          <FaUsers className="w-5 h-5 text-red-600" />
          <h1 className="text-xl md:text-2xl font-bold text-gray-800">
            Someone shared this cart with you
          </h1>
        </div>

        <div className="bg-white rounded-lg shadow mb-6">
          {items.map((item, idx) => {
            const price =
              resolveVariantPrice(item.product, item.color, item.size) ||
              item.product.price ||
              0;
            const image =
              item.product.images?.[0]?.url || "/assets/placeholder.svg";
            return (
              <div
                key={idx}
                className="p-4 border-b last:border-b-0 flex items-center gap-4"
              >
                <Image
                  src={encodeURI(image)}
                  alt={item.product.title}
                  width={64}
                  height={64}
                  className="object-contain rounded w-16 h-16 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm md:text-base truncate">
                    {item.product.title}
                  </p>
                  <div className="text-xs text-gray-500 mt-0.5">
                    Qty: {item.quantity}
                    {item.color ? ` · ${item.color}` : ""}
                    {item.size ? ` · ${item.size}` : ""}
                  </div>
                </div>
                <div className="text-right font-semibold text-gray-800">
                  ৳{(price * item.quantity).toFixed(2)}
                </div>
              </div>
            );
          })}
        </div>

        <div className="bg-[#FFF5ED] rounded-lg shadow p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-sm text-gray-600">Total</p>
            <p className="text-2xl font-bold text-red-600">
              ৳{total.toFixed(2)}
            </p>
          </div>
          <button
            onClick={handleAddAll}
            disabled={adding || items.length === 0}
            className="flex items-center justify-center gap-2 bg-rose-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-rose-700 transition disabled:opacity-60"
          >
            <FaShoppingCart className="w-4 h-4" />
            Add All to My Cart
          </button>
        </div>
      </div>
    </div>
  );
}
