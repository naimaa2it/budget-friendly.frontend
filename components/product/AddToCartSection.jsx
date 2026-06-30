"use client";

import React, { useState } from "react";
import QuantitySelector from "@/components/ui/QuantitySelector";
import WishlistButton from "@/components/product/WishlistButton";
import { useCart } from "@/components/context/CartContext";
import {
  resolveVariantPrice,
  resolveVariant,
  getVariantColors,
  getVariantSizes,
} from "@/components/cart/VariantEditModal";
import { FaBell, FaClock } from "react-icons/fa";
import { useRouter } from "next/navigation";

const STORAGE_KEY = (id) => `waitlist_joined_${id}`;

export default function AddToCartSection({
  product,
  selectedColor = null,
  selectedSize = null,
}) {
  const [qty, setQty] = useState(1);
  const { addToCart } = useCart();
  const router = useRouter();
  const [notifyType, setNotifyType] = useState("email");
  const [notifyValue, setNotifyValue] = useState("");
  const [notifyLoading, setNotifyLoading] = useState(false);
  const [notifySuccess, setNotifySuccess] = useState(() => {
    // Initialise from localStorage so success state survives page reloads
    if (typeof window === "undefined") return false;
    return !!localStorage.getItem(STORAGE_KEY(product._id));
  });
  const [notifyError, setNotifyError] = useState("");

  const isPreorder = product.availability === "pre_order";
  const isOutOfStock =
    !isPreorder &&
    (product.availability === "out_of_stock" ||
      (product.inventory != null && product.inventory === 0));

  const handleNotify = async (e) => {
    e.preventDefault();
    if (!notifyValue.trim()) {
      setNotifyError("Please enter a value.");
      return;
    }
    setNotifyLoading(true);
    setNotifyError("");
    try {
      const API = process.env.NEXT_PUBLIC_API_URL || "https://api.pickob.com";
      const body = {
        productId: product._id,
        productTitle: product.title || product.name,
      };
      if (notifyType === "email") body.email = notifyValue.trim();
      else body.phone = notifyValue.trim();
      const res = await fetch(`${API}/api/waitlist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error();
      // Persist to localStorage so this product's success state survives reloads
      localStorage.setItem(STORAGE_KEY(product._id), "1");
      setNotifySuccess(true);
    } catch {
      setNotifyError("Something went wrong. Try again.");
    } finally {
      setNotifyLoading(false);
    }
  };

  // Check if product has variants (either through new variant structure or legacy colors/sizes)
  const allColors = getVariantColors(product);
  const allSizes = getVariantSizes(product);
  const hasVariants =
    allColors.length > 0 || allSizes.length > 0 || product.variants?.length > 0;

  const effectivePrice = hasVariants
    ? resolveVariantPrice(product, selectedColor, selectedSize)
    : product.price || 0;

  // Use the shared resolveVariant function for consistent matching logic
  const selectedVariant = hasVariants
    ? resolveVariant(product, selectedColor, selectedSize)
    : null;

  const handleAdd = () => {
    addToCart(product, qty, {
      selectedColor: selectedColor || null,
      selectedSize: selectedSize || null,
      selectedVariant,
    });
  };

  const handleBuyNow = () => {
    addToCart(product, qty, {
      selectedColor: selectedColor || null,
      selectedSize: selectedSize || null,
      selectedVariant,
      silent: true,
    });
    router.push("/checkout");
  };

  return (
    <div className="flex flex-col gap-4">
      {isPreorder ? (
        <>
          <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-700 px-4 py-2.5 rounded-lg text-sm font-medium w-fit">
            <FaClock className="w-3.5 h-3.5" />
            Pre-order now — ships as soon as stock arrives
          </div>
          <div className="flex items-center gap-4 flex-wrap">
            <WishlistButton product={product} />
            <QuantitySelector quantity={qty} onChange={setQty} />
            <button
              onClick={handleAdd}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition"
            >
              Pre-order now
            </button>
            {qty > 1 && (
              <span className="text-sm text-gray-700">
                ৳{(effectivePrice * qty).toFixed(2)}
              </span>
            )}
          </div>
        </>
      ) : isOutOfStock ? (
        <>
          <div className="flex items-center gap-4 flex-wrap">
            <WishlistButton product={product} />
            <button
              disabled
              className="bg-gray-300 text-gray-500 px-6 py-3 rounded-lg font-medium cursor-not-allowed"
            >
              Out of Stock
            </button>
          </div>

          {/* Inline waitlist notification block */}
          <div className="rounded-2xl bg-[#e8f5f0] border border-[#c0e4d8] px-5 py-3 mt-1 max-w-sm">
            {notifySuccess ? (
              <div className="text-center py-2">
                <div className="text-3xl mb-2">🎉</div>
                <p className="font-semibold text-green-800">
                  You&apos;re on the list!
                </p>
                <p className="text-sm text-green-700 mt-1">
                  We&apos;ll notify you when it&apos;s back in stock.
                </p>
              </div>
            ) : (
              <>
                <p className="font-bold text-gray-800 text-base mb-0.5">
                  In stock very soon!
                </p>
                <p className="text-sm text-gray-500 mb-3">
                  Get notification in sec upon arrival
                </p>
                <div className="flex items-center gap-5 mb-3">
                  <label className="flex items-center gap-1.5 cursor-pointer text-sm font-medium text-gray-700">
                    <input
                      type="radio"
                      name="notifyType"
                      value="email"
                      checked={notifyType === "email"}
                      onChange={() => {
                        setNotifyType("email");
                        setNotifyValue("");
                      }}
                      className="accent-teal-600"
                    />
                    Mail address
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer text-sm font-medium text-gray-700">
                    <input
                      type="radio"
                      name="notifyType"
                      value="phone"
                      checked={notifyType === "phone"}
                      onChange={() => {
                        setNotifyType("phone");
                        setNotifyValue("");
                      }}
                      className="accent-teal-600"
                    />
                    Phone number
                  </label>
                </div>
                <form
                  onSubmit={handleNotify}
                  className="flex items-center gap-2"
                >
                  <input
                    type={notifyType === "email" ? "email" : "tel"}
                    value={notifyValue}
                    onChange={(e) => setNotifyValue(e.target.value)}
                    placeholder={
                      notifyType === "email"
                        ? "ex. example@mail.com"
                        : "+880 1XXX-XXXXXX"
                    }
                    className="flex-1 border-0 bg-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 shadow-sm"
                  />
                  <button
                    type="submit"
                    disabled={notifyLoading}
                    className="flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition disabled:opacity-60 whitespace-nowrap"
                  >
                    <FaBell className="w-3.5 h-3.5" /> Notify me
                  </button>
                </form>
                {notifyError && (
                  <p className="text-red-600 text-xs mt-2">{notifyError}</p>
                )}
              </>
            )}
          </div>
        </>
      ) : (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-4 flex-wrap">
            <WishlistButton product={product} />
            <QuantitySelector quantity={qty} onChange={setQty} />
            <button
              onClick={handleAdd}
              className="bg-red-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-red-700 transition"
            >
              Add to cart
            </button>
            {qty > 1 && (
              <span className="text-sm text-gray-700">
                ৳{(effectivePrice * qty).toFixed(2)}
              </span>
            )}
          </div>
          <button
            onClick={handleBuyNow}
            className="w-full mr-8 bg-gray-900 text-white py-2.5 rounded-md font-medium hover:bg-gray-700 transition"
          >
            Buy Now
          </button>
        </div>
      )}
    </div>
  );
}
