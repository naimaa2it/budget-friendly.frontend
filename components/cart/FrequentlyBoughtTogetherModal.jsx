"use client";

import React, { useEffect, useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/context/CartContext";
import { FaStar } from "react-icons/fa";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const VISIBLE = 4;

async function fetchFbt(pid) {
  try {
    const r = await fetch(`${API}/api/products/${pid}`);
    const json = await r.json();
    return Array.isArray(json.product?.frequentlyBoughtTogether)
      ? json.product.frequentlyBoughtTogether.filter(
          (p) => p && (p._id || p.id),
        )
      : [];
  } catch {
    return [];
  }
}

export default function FrequentlyBoughtTogetherModal() {
  const router = useRouter();
  const { fbtModalData, setFbtModalData, addToCart, cartItems } = useCart();
  const [fbtItems, setFbtItems] = useState([]);
  const [baseItems, setBaseItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [slideIndex, setSlideIndex] = useState(0);
  const [imageIndices, setImageIndices] = useState({});
  const initialProductId = useRef(null);

  useEffect(() => {
    if (!fbtModalData) {
      setFbtItems([]);
      setBaseItems([]);
      setSlideIndex(0);
      initialProductId.current = null;
      return;
    }

    const pid = String(
      fbtModalData.product?._id || fbtModalData.product?.id || "",
    );
    if (!pid || pid === initialProductId.current) return;
    initialProductId.current = pid;
    setSlideIndex(0);

    if (
      Array.isArray(fbtModalData.fbtItems) &&
      fbtModalData.fbtItems.length > 0
    ) {
      setFbtItems(fbtModalData.fbtItems);
      setBaseItems(fbtModalData.fbtItems);
      return;
    }

    setLoading(true);
    fetchFbt(pid)
      .then((items) => {
        setFbtItems(items);
        setBaseItems(items);
      })
      .finally(() => setLoading(false));
  }, [fbtModalData]);

  if (!fbtModalData) return null;

  const { product, qty } = fbtModalData;

  const close = () => {
    setFbtModalData(null);
    setFbtItems([]);
    setBaseItems([]);
    setSlideIndex(0);
    setImageIndices({});
    initialProductId.current = null;
  };

  const handleViewCart = () => {
    close();
    router.push("/cart");
  };

  const isInCart = (id) =>
    cartItems.some(
      (i) => String(i.product?._id || i.product?.id) === String(id),
    );

  const handleAddFbt = async (fbtProduct) => {
    addToCart(fbtProduct, 1, { silent: true });
    const pid = fbtProduct._id || fbtProduct.id;
    const newFbt = await fetchFbt(pid);
    if (newFbt.length > 0) {
      const newIds = new Set(newFbt.map((p) => String(p._id || p.id)));
      setFbtItems([
        ...newFbt,
        ...baseItems.filter((p) => !newIds.has(String(p._id || p.id))),
      ]);
      setSlideIndex(0);
    }
    // else: keepshowing current baseItems unchanged
  };

  const getAllImages = (p) => {
    if (Array.isArray(p.images) && p.images.length > 0) {
      return p.images.map((img) => img.url);
    }
    return [];
  };

  const getCurrentImage = (p, pid) => {
    const images = getAllImages(p);
    if (images.length === 0) return null;
    const index = imageIndices[pid] || 0;
    return images[index];
  };

  const setProductImageIndex = (pid, index) => {
    setImageIndices((prev) => ({ ...prev, [pid]: index }));
  };

  const getImageUrl = (p) => {
    if (Array.isArray(p.images) && p.images.length > 0) return p.images[0].url;
    return null;
  };

  const maxSlide = Math.max(0, fbtItems.length - VISIBLE);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl">
        {/* Header */}
        <div className="p-5 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg
                viewBox="0 0 20 20"
                fill="currentColor"
                className="w-5 h-5 text-green-500"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="font-semibold text-gray-900">
                {qty} item{qty > 1 ? "s" : ""} added to cart
              </span>
            </div>
            <button
              onClick={close}
              className="text-gray-400 hover:text-gray-700 text-xl leading-none"
            >
              ✕
            </button>
          </div>
          <div className="flex gap-3 mt-4">
            <button
              onClick={close}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors"
            >
              Continue Shopping
            </button>
            <button
              onClick={handleViewCart}
              className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
            >
              View Cart
            </button>
          </div>
        </div>

        {/* FBT Section */}
        <div className="p-5">
          {loading ? (
            <div className="flex items-center justify-center py-10 gap-3 text-gray-400">
              <svg
                className="animate-spin w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
              >
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
                  d="M4 12a8 8 0 018-8v8z"
                />
              </svg>
              <span className="text-sm">Finding related products…</span>
            </div>
          ) : fbtItems.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-8">
              No related products found.
            </p>
          ) : (
            <>
              <h3 className="text-2xl font-bold text-rose-500 mb-4">
                Your May Need
              </h3>
              <div className="relative">
                {/* Prev arrow */}
                {slideIndex > 0 && (
                  <button
                    onClick={() => setSlideIndex((i) => Math.max(0, i - 1))}
                    className="absolute -left-3 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white border border-gray-200 rounded-full shadow-md flex items-center justify-center text-gray-600 hover:bg-gray-50 text-lg font-bold"
                  >
                    ‹
                  </button>
                )}

                {/* Viewport */}
                <div className="overflow-hidden">
                  <div
                    className="flex transition-transform duration-300 ease-in-out"
                    style={{
                      transform: `translateX(calc(-${slideIndex * (100 / VISIBLE)}% - ${slideIndex * (10 / VISIBLE)}px))`,
                    }}
                  >
                    {fbtItems.map((fbtProduct) => {
                      const pid = fbtProduct._id || fbtProduct.id;
                      const allImages = getAllImages(fbtProduct);
                      const imgUrl = getCurrentImage(fbtProduct, pid);
                      const inCart = isInCart(pid);
                      return (
                        <div
                          key={String(pid)}
                          className="flex-none rounded-2xl overflow-hidden border border-gray-100 bg-white shadow-sm hover:shadow-lg transition-all duration-200 group"
                          style={{
                            width: `calc(${100 / VISIBLE}% - ${(10 * (VISIBLE - 1)) / VISIBLE}px)`,
                            marginRight: "10px",
                          }}
                        >
                          {/* Image */}
                          <Link href={`/product/${pid}`} onClick={close}>
                            <div
                              className="relative bg-gradient-to-br from-gray-50 to-gray-100"
                              style={{ aspectRatio: "1" }}
                            >
                              {imgUrl ? (
                                <Image
                                  src={imgUrl}
                                  alt={fbtProduct.title || "Product"}
                                  fill
                                  sizes="160px"
                                  className="object-contain p-2 group-hover:scale-105 transition-transform duration-200"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-200 text-4xl">
                                  🛍
                                </div>
                              )}
                              {fbtProduct.compareAtPrice > fbtProduct.price && (
                                <span className="absolute top-1.5 left-1.5 bg-rose-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                                  {Math.round(
                                    100 -
                                      (fbtProduct.price /
                                        fbtProduct.compareAtPrice) *
                                        100,
                                  )}
                                  % OFF
                                </span>
                              )}

                              {/* Image indicators - only show if more than 1 image */}
                              {allImages.length > 1 && (
                                <div className="absolute bottom-1.5 left-1/2 transform -translate-x-1/2 flex gap-1 z-10">
                                  {allImages.map((_, idx) => (
                                    <button
                                      key={idx}
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setProductImageIndex(pid, idx);
                                      }}
                                      className={`w-1 h-1 rounded-full transition-all duration-200 ${
                                        idx === (imageIndices[pid] || 0)
                                          ? "bg-rose-600 w-3"
                                          : "bg-white/70 hover:bg-white"
                                      }`}
                                      aria-label={`View image ${idx + 1}`}
                                    />
                                  ))}
                                </div>
                              )}
                            </div>
                          </Link>

                          {/* Info */}
                          <div className="p-2">
                            {fbtProduct.department && (
                              <p className="text-[10px] font-bold text-orange-500 uppercase tracking-wide mb-0.5 truncate">
                                {fbtProduct.department}
                              </p>
                            )}
                            <Link href={`/product/${pid}`} onClick={close}>
                              <p className="text-[11px] font-medium text-gray-800 line-clamp-2 hover:text-rose-600 transition-colors leading-snug mb-1.5 min-h-[28px]">
                                {fbtProduct.title}
                              </p>
                            </Link>
                            <div className="flex flex-col mb-2">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-sm font-extrabold text-rose-600 leading-none">
                                  ৳{fbtProduct.price?.toLocaleString() ?? 0}
                                </span>
                                {fbtProduct.compareAtPrice >
                                  fbtProduct.price && (
                                  <span className="text-[10px] text-gray-400 line-through leading-tight">
                                    ৳
                                    {fbtProduct.compareAtPrice?.toLocaleString()}
                                  </span>
                                )}
                              </div>
                              {Number(fbtProduct.rewardPoints) > 0 && (
                                <span className="inline-flex items-center gap-0.5 bg-gradient-to-r from-amber-300 to-yellow-500 text-amber-900 text-[8px] font-bold px-1.5 py-0.5 rounded-full w-fit mt-1">
                                  <FaStar className="w-1.5 h-1.5 text-red-700" />
                                  {fbtProduct.rewardPoints} points
                                </span>
                              )}
                            </div>
                            <button
                              onClick={() => handleAddFbt(fbtProduct)}
                              disabled={inCart}
                              className={`w-full py-1.5 rounded-lg text-[11px] font-bold transition-all duration-200 ${
                                inCart
                                  ? "bg-green-50 text-green-600 border border-green-200 cursor-default"
                                  : "bg-rose-600 text-white hover:bg-rose-700 active:scale-95 shadow-sm"
                              }`}
                            >
                              {inCart ? "✓ Added" : "+ Add"}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Next arrow */}
                {slideIndex < maxSlide && (
                  <button
                    onClick={() =>
                      setSlideIndex((i) => Math.min(maxSlide, i + 1))
                    }
                    className="absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white border border-gray-200 rounded-full shadow-md flex items-center justify-center text-gray-600 hover:bg-gray-50 text-lg font-bold"
                  >
                    ›
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
