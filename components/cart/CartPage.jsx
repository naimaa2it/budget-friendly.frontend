"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  useCart,
  getItemPrice,
  getItemCompareAtPrice,
} from "@/components/context/CartContext";
import QuantitySelector from "@/components/ui/QuantitySelector";
import ProductCard from "@/components/product/ProductCard";
import Image from "next/image";
import { FaTrash, FaPencilAlt, FaPlus, FaShareAlt } from "react-icons/fa";
import toast from "react-hot-toast";
import EmptyState from "@/components/ui/EmptyState";
import VariantEditModal, {
  getVariantColors,
  getVariantSizes,
} from "@/components/cart/VariantEditModal";
import WaitlistModal from "@/components/cart/WaitlistModal";
import { useLanguage } from "@/components/context/LanguageContext";

export default function CartPage() {
  const router = useRouter();
  const {
    cartItems,
    cartHydrated,
    updateQty,
    removeFromCart,
    updateCartVariant,
    shareCart,
  } = useCart();
  const { t } = useLanguage();
  const [editItem, setEditItem] = useState(null);
  const [editMode, setEditMode] = useState("edit"); // 'edit' or 'add'
  const [waitlistProduct, setWaitlistProduct] = useState(null);
  const [sharing, setSharing] = useState(false);

  const handleShare = async () => {
    if (sharing) return;
    setSharing(true);
    try {
      const url = await shareCart();
      if (navigator.share) {
        await navigator.share({ title: "My Pickob Cart", url });
      } else {
        await navigator.clipboard?.writeText(url);
        toast.success("Cart link copied to clipboard!");
      }
    } catch (err) {
      if (err?.name !== "AbortError")
        toast.error("Could not share cart. Try again.");
    } finally {
      setSharing(false);
    }
  };

  const [recommendedProducts, setRecommendedProducts] = useState([]);
  const [recLoading, setRecLoading] = useState(true);

  // Aggregate frequently bought together products from all cart items
  const fbtProducts = React.useMemo(() => {
    const inCartIds = new Set(
      cartItems.map((i) => String(i.product?._id || i.product?.id)),
    );
    const seen = new Set(inCartIds);
    const results = [];
    for (const item of cartItems) {
      const fbt = item.product?.frequentlyBoughtTogether;
      if (!Array.isArray(fbt)) continue;
      for (const p of fbt) {
        if (!p || !(p._id || p.id)) continue;
        const pid = String(p._id || p.id);
        if (!seen.has(pid)) {
          seen.add(pid);
          results.push(p);
        }
      }
    }
    return results;
  }, [cartItems]);

  // Calculate totals
  const subtotal = cartItems.reduce(
    (sum, item) => sum + getItemPrice(item) * item.quantity,
    0,
  );
  const anyFreeShip = cartItems.some((i) => i.product.freeShipping);
  const originalTotal = cartItems.reduce(
    (sum, item) =>
      sum + (getItemCompareAtPrice(item) || getItemPrice(item)) * item.quantity,
    0,
  );
  const saved = Math.max(0, originalTotal - subtotal);

  // Fetch recommended products — tries popular_pics badge first, falls back to recent
  useEffect(() => {
    const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
    setRecLoading(true);
    fetch(`${API}/api/products?badge=popular_pics&limit=12`)
      .then((r) => r.json())
      .then((json) => {
        const items = json.items || json.products || [];
        if (items.length > 0) {
          setRecommendedProducts(items);
          return;
        }
        // Fallback: fetch any recent products
        return fetch(`${API}/api/products?limit=12&sort=newest`)
          .then((r) => r.json())
          .then((j) => setRecommendedProducts(j.items || j.products || []));
      })
      .catch(() => {})
      .finally(() => setRecLoading(false));
  }, []);

  const handleCheckout = () => {
    router.push("/checkout");
  };

  // Wait for localStorage hydration before deciding cart is empty
  if (!cartHydrated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-gray-400">
          <svg className="animate-spin w-8 h-8" viewBox="0 0 24 24" fill="none">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v8H4z"
            />
          </svg>
          <span className="text-sm">{t("cart.loading")}</span>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <EmptyState
        title={t("cart.cart_empty_title")}
        description={t("cart.cart_empty_msg")}
        buttonText={t("success.continue_shopping")}
        onButtonClick={() => router.push("/")}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-3 md:px-4">
        {/* Back & Home */}
        <div className="flex items-center gap-2 mb-4">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition"
          >
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
          </button>
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition"
          >
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </button>
        </div>
        {/* Cart Items */}
        <div className="bg-white rounded-lg shadow mb-8">
          {cartItems.map((item) => {
            const { product, quantity, cartKey, selectedColor, selectedSize } =
              item;
            const price = getItemPrice(item);
            const compareAt = getItemCompareAtPrice(item) || price;
            const itemSaved = Math.max(0, (compareAt - price) * quantity);
            const image = product.images?.[0]?.url || "/assets/placeholder.svg";
            const title = product.title || product.name;
            const allColors = getVariantColors(product);
            const allSizes = getVariantSizes(product);
            const hasVariants =
              allColors.length > 0 ||
              allSizes.length > 0 ||
              product.variants?.length > 0;

            // Find color hex for the selected color
            const selectedColorObj = selectedColor
              ? allColors.find(
                  (c) => c.name?.toLowerCase() === selectedColor?.toLowerCase(),
                )
              : null;
            const colorHex = selectedColorObj?.hex || null;

            return (
              <div
                key={cartKey}
                className="p-3 md:p-6 border-b last:border-b-0"
              >
                <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6 relative">
                  {/* Product Image */}
                  <div className="shrink-0 self-start">
                    <Image
                      src={encodeURI(image)}
                      alt={title}
                      width={84}
                      height={84}
                      className="object-contain rounded w-[84px] h-[84px] md:w-[100px] md:h-[100px]"
                    />
                  </div>

                  {/* Product Details */}
                  <div className="flex-1">
                    <h3 className="text-base md:text-lg font-semibold mb-1 pr-10 md:pr-0">
                      {title}
                    </h3>

                    {/* Variant display with color swatch */}
                    {selectedColor || selectedSize ? (
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        {selectedColor && (
                          <span className="inline-flex items-center gap-1.5 text-xs bg-gray-100 px-2 py-1 rounded">
                            {colorHex && (
                              <span
                                className="w-4 h-4 rounded-full border border-gray-300 inline-block"
                                style={{ backgroundColor: colorHex }}
                              />
                            )}
                            <span className="text-gray-700 font-medium">
                              {selectedColor}
                            </span>
                          </span>
                        )}
                        {selectedSize && (
                          <span className="inline-flex items-center text-xs bg-gray-100 px-2 py-1 rounded">
                            <span className="text-gray-700 font-medium">
                              {selectedSize}
                            </span>
                          </span>
                        )}
                        {hasVariants && (
                          <button
                            onClick={() => {
                              setEditItem(item);
                              setEditMode("edit");
                            }}
                            title="Edit variant"
                            className="text-gray-400 hover:text-gray-700 p-0.5 ml-1"
                          >
                            <FaPencilAlt className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    ) : (
                      hasVariants && (
                        <button
                          onClick={() => {
                            setEditItem(item);
                            setEditMode("edit");
                          }}
                          className="flex items-center gap-1 mb-2 text-xs text-blue-600 hover:underline"
                        >
                          <FaPencilAlt className="w-3 h-3" />{" "}
                          {t("cart.select_option")}
                        </button>
                      )
                    )}

                    {/* Add more variants button */}
                    {hasVariants && (
                      <button
                        onClick={() => {
                          setEditItem(item);
                          setEditMode("add");
                        }}
                        className="flex items-center gap-1 mb-2 text-xs text-green-600 hover:text-green-700 hover:underline"
                      >
                        <FaPlus className="w-2.5 h-2.5" />{" "}
                        {t("cart.add_size_color")}
                      </button>
                    )}

                    <div className="flex items-center gap-3 md:gap-4 mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">
                          {t("cart.price")}
                        </span>
                        <span className="text-base md:text-lg font-bold text-red-600">
                          ৳{price.toFixed(2)}
                        </span>
                        {compareAt > price && (
                          <span className="text-sm text-gray-500 line-through">
                            ৳{compareAt}
                          </span>
                        )}
                      </div>
                    </div>
                    {product.freeShipping && (
                      <p className="text-sm font-semibold text-green-700 mb-3">
                        {t("home.free_shipping")}
                      </p>
                    )}
                    {product.availability === "out_of_stock" && (
                      <button
                        onClick={() => setWaitlistProduct(product)}
                        className="inline-flex items-center gap-1.5 mb-3 text-sm font-semibold text-amber-700 bg-amber-50 border border-amber-300 rounded-lg px-3 py-1.5 hover:bg-amber-100 transition"
                      >
                        {t("cart.out_of_stock_waitlist")}
                      </button>
                    )}

                    <div className="flex flex-wrap items-center gap-4 md:gap-6">
                      <div className="flex items-center gap-3 md:gap-4">
                        <button
                          onClick={() =>
                            updateQty(cartKey, Math.max(1, quantity - 1))
                          }
                          className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-100 text-base md:text-lg font-semibold"
                        >
                          -
                        </button>
                        <span className="w-10 md:w-12 text-center font-medium">
                          {quantity}
                        </span>
                        <button
                          onClick={() => updateQty(cartKey, quantity + 1)}
                          className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-100 text-base md:text-lg font-semibold"
                        >
                          +
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">
                          {t("checkout.total")}
                        </span>
                        <span className="text-lg md:text-xl font-bold text-gray-900">
                          ৳{(price * quantity).toFixed(2)}
                        </span>
                      </div>
                      {itemSaved > 0 && (
                        <div className="text-sm text-green-600">
                          {t("cart.saved")}{" "}
                          <span className="font-semibold">
                            ৳{itemSaved.toFixed(2)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Remove Button */}
                  <button
                    onClick={() => removeFromCart(cartKey)}
                    className="absolute top-0 right-0 md:static text-red-600 hover:text-red-700 p-1.5 md:p-2"
                    title="Remove item"
                  >
                    <FaTrash className="w-4 h-4 md:w-5 md:h-5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Cart Summary */}
        <div className="bg-[#FFF5ED] rounded-lg shadow p-6 mb-6 -mt-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-2 md:mb-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">
                {t("cart.cart_total")}
              </h2>
              <p className="text-3xl font-bold text-red-600">
                ৳{subtotal.toFixed(2)}
              </p>
              {saved > 0 && (
                <p className="text-sm text-green-600 mt-2">
                  {t("checkout.you_saving_prefix")} ৳{saved.toFixed(2)}{" "}
                  {t("checkout.you_saving_suffix")}
                </p>
              )}
              {anyFreeShip && (
                <p className="text-sm font-semibold text-green-700 mt-2">
                  {t("home.free_shipping")}
                </p>
              )}
            </div>
            <div className="flex items-center gap-3 w-full md:w-auto">
              <button
                onClick={handleShare}
                disabled={sharing}
                className="flex items-center justify-center gap-2 border border-gray-300 text-gray-700 px-2 py-2 rounded-lg font-medium hover:bg-gray-50 transition disabled:opacity-50"
                title="Share this cart"
              >
                <FaShareAlt className="w-4 h-4" /> {t("cart.share_cart")}
              </button>
              <button
                onClick={handleCheckout}
                className="flex-1 md:flex-none bg-rose-500 text-white px-2 py-2 rounded-md font-semibold hover:bg-rose-700 transition text-base md:text-lg"
              >
                {t("cart.proceed_checkout")}
              </button>
            </div>
          </div>
        </div>

        {/* ── Frequently Bought Together ───────────────────────────────── */}
        {fbtProducts.length > 0 && (
          <div className="my-8">
            <div className="flex items-center gap-3 mb-1">
              <span className="text-xl">🛍️</span>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800">
                {t("cart.fbt_title")}
              </h2>
            </div>
            <p className="text-gray-500 text-sm mb-4 ml-9">
              {t("cart.fbt_desc")}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
              {fbtProducts.slice(0, 6).map((p) => (
                <ProductCard
                  key={p._id || p.id}
                  product={p}
                  imageWidth={250}
                  imageHeight={180}
                  imageQuality={85}
                />
              ))}
            </div>
          </div>
        )}

        {/* ── Picked For You (Recommended) ─────────────────────────────── */}
        <div className="my-8">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-xl">✨</span>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800">
              {t("cart.picked_for_you")}
            </h2>
          </div>

          {recLoading ? (
            /* Skeleton cards while loading */
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
              {Array.from({ length: 10 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-white rounded-xl overflow-hidden shadow-sm animate-pulse"
                >
                  <div className="bg-gray-200 h-36 sm:h-44 w-full" />
                  <div className="p-3 space-y-2">
                    <div className="bg-gray-200 h-3 rounded w-3/4" />
                    <div className="bg-gray-200 h-3 rounded w-1/2" />
                    <div className="bg-gray-200 h-7 rounded w-full mt-2" />
                  </div>
                </div>
              ))}
            </div>
          ) : recommendedProducts.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
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
          ) : (
            <p className="text-gray-400 text-sm text-center py-6">
              {t("cart.no_recommendations")}
            </p>
          )}
        </div>
      </div>
      {editItem && (
        <VariantEditModal
          item={editItem}
          mode={editMode}
          onClose={() => {
            setEditItem(null);
            setEditMode("edit");
          }}
          onSave={(c, s, v, q) => {
            updateCartVariant(editItem.cartKey, c, s, v, q);
            setEditItem(null);
            setEditMode("edit");
          }}
        />
      )}
      {waitlistProduct && (
        <WaitlistModal
          product={waitlistProduct}
          onClose={() => setWaitlistProduct(null)}
        />
      )}
    </div>
  );
}
