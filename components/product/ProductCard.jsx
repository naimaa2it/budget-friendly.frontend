"use client";

import Image from "next/image";
import Link from "next/link";
import React from "react";
import { useRouter } from "next/navigation";
import {
  FaEye,
  FaShoppingCart,
  FaHeart,
  FaBell,
  FaStar,
  FaBalanceScale,
} from "react-icons/fa";
import { useCart } from "@/components/context/CartContext";
import { useUser } from "@/components/context/UserContext";
import AuthModal from "@/components/auth/AuthModal";
import WaitlistModal from "@/components/cart/WaitlistModal";
import { getVariantColors } from "@/components/cart/VariantEditModal";
import { getDisplayPrice } from "@/lib/pricing";
import { trackAddToCart } from "@/lib/metaPixel";
import { useCompare } from "@/components/context/CompareContext";
import { useLanguage } from "@/components/context/LanguageContext";
import Skeleton from "@/components/ui/Skeleton";

export default function ProductCard({
  product,
  imageWidth = 320,
  imageHeight = 200,
  imageQuality = 100,
  showActionsOnHover = true,
  showDiscount = true,
  maxTags = 3,
  loading = false,
}) {
  const router = useRouter();
  const { addToCart, addToWishlist } = useCart();
  const { user } = useUser();
  const { addToCompare, removeFromCompare, isInCompare } = useCompare();
  const { t } = useLanguage();
  const [currentImageIndex, setCurrentImageIndex] = React.useState(0);
  const [hovered, setHovered] = React.useState(false);
  const [showAuthModal, setShowAuthModal] = React.useState(false);
  const [pendingWishlist, setPendingWishlist] = React.useState(null);
  const [waitlistProduct, setWaitlistProduct] = React.useState(null);

  React.useEffect(() => {
    if (user && pendingWishlist) {
      addToWishlist(pendingWishlist);
      setPendingWishlist(null);
    }
  }, [user, pendingWishlist, addToWishlist]);

  if (loading || !product) {
    // simple skeleton card placeholder
    return (
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden flex flex-col h-full">
        <Skeleton className="w-full h-[200px]" />
        <div className="p-3 flex flex-col grow">
          <Skeleton className="h-4 mb-2 w-3/4" />
          <Skeleton className="h-4 mb-2 w-full" />
          <Skeleton className="h-6 w-1/2 mt-auto" />
        </div>
      </div>
    );
  }
  const {
    price,
    compareAtPrice: compareAt,
    discountPct: resolvedDiscount,
  } = getDisplayPrice(product);
  const discountPct = showDiscount ? resolvedDiscount : null;

  // badge config — priority order determines which show first
  const BADGE_PRIORITY = [
    "free_shipping",
    "flash_sale",
    "hot",
    "best_seller",
    "new_arrival",
    "trending",
    "limited",
    "popular_pics",
    "deals_of_the_day",
    "featured",
    "clearance",
    "coupon",
  ];
  const BADGE_MAP = {
    best_seller: { label: "Best Seller", cls: "bg-yellow-400 text-yellow-900" },
    hot: { label: "Hot", cls: "bg-red-500 text-white" },
    new_arrival: { label: "New", cls: "bg-blue-500 text-white" },
    trending: { label: "Trending", cls: "bg-purple-500 text-white" },
    limited: { label: "Limited", cls: "bg-orange-500 text-white" },
    popular_pics: { label: "Popular", cls: "bg-pink-500 text-white" },
    deals_of_the_day: { label: "Deal", cls: "bg-emerald-500 text-white" },
    free_shipping: { label: "Free Ship", cls: "bg-green-500 text-white" },
    flash_sale: { label: "Flash Sale", cls: "bg-rose-600 text-white" },
    featured: { label: "Featured", cls: "bg-indigo-500 text-white" },
    clearance: { label: "Clearance", cls: "bg-amber-500 text-white" },
    coupon: { label: "Coupon", cls: "bg-teal-500 text-white" },
  };

  // collect active flag-based pseudo-badges
  const flagBadges = [
    product.freeShipping && "free_shipping",
    product.flashSale && "flash_sale",
    product.featured && "featured",
    product.clearance && "clearance",
    product.coupon && "coupon",
  ].filter(Boolean);

  // priority-sorted standard badges + flag badges
  const prioritySorted = BADGE_PRIORITY.filter(
    (b) => (product.badges || []).includes(b) || flagBadges.includes(b),
  );
  // append any custom badges not in BADGE_PRIORITY
  const customBadges = (product.badges || []).filter(
    (b) => !BADGE_PRIORITY.includes(b),
  );
  const visibleTags = [...prioritySorted, ...customBadges].slice(0, maxTags);

  // handle image navigation
  const images =
    product.images && product.images.length
      ? product.images.map((i) => i.url)
      : ["/assets/placeholder.svg"];

  const currentImage = () => {
    // On hover, show next image if available, otherwise stay on current
    if (hovered && images[currentImageIndex + 1]) {
      return images[currentImageIndex + 1];
    }
    return images[currentImageIndex];
  };
  const image = encodeURI(currentImage());

  const id = product._id || product.id;
  const isOutOfStock =
    product.availability === "out_of_stock" || product.inventory === 0;
  const href = `/product/${id}/`;

  return (
    <>
      <div
        className="relative bg-white border border-[#F1E4D8] rounded-xl shadow-sm group hover:shadow-xl transition-all duration-300 flex flex-col cursor-pointer h-full"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* Stretched link — full-card click target. Buttons below sit above it
            (higher z-index) so they stay clickable without being nested in <a>. */}
        <Link
          href={href}
          aria-label={product.title || product.slug}
          className="absolute inset-0 z-[1]"
        >
          <span className="sr-only">{product.title || product.slug}</span>
        </Link>
        <div className="relative bg-gray-50" style={{ height: imageHeight }}>
          <div className="absolute inset-0 px-1 flex items-center justify-center overflow-hidden">
            <Image
              src={image}
              alt={product.title || product.slug}
              width={imageWidth}
              height={imageHeight}
              quality={imageQuality}
              loading="lazy"
              decoding="async"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = "/assets/placeholder.svg";
              }}
              className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-300 cursor-pointer"
            />
          </div>

          {/* Image indicators - only show if more than 1 image */}
          {images.length > 1 && (
            <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex gap-1.5 z-10">
              {images.map((_, idx) => (
                <button
                  key={idx}
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentImageIndex(idx);
                  }}
                  className={`w-2 h-2 rounded-full transition-all duration-200 ${
                    idx === currentImageIndex
                      ? "bg-red-600 w-4"
                      : "bg-gray-600/90 hover:bg-red-600"
                  }`}
                  aria-label={`View image ${idx + 1}`}
                />
              ))}
            </div>
          )}

          {/* Overlay: discount LEFT, tags RIGHT — hidden on hover to show action buttons */}
          <div className="absolute inset-x-0 top-0 flex items-start justify-between p-1.5 pointer-events-none group-hover:opacity-0 transition-opacity duration-200">
            {/* Discount badge — top left */}
            <div>
              {discountPct && (
                <span className="bg-gradient-to-r from-rose-500 to-red-600 text-white text-[10px] font-bold px-1 py-0.5 rounded-sm leading-none">
                  -{discountPct}%
                </span>
              )}
            </div>
            {/* Tags — top right, stacked */}
            <div className="flex flex-col items-end gap-0.5">
              {product.availability === "pre_order" && (
                <span className="bg-blue-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-sm leading-none">
                  Pre-Order
                </span>
              )}
              {visibleTags.map((b) => {
                const badge = BADGE_MAP[b] || {
                  label: b
                    .replace(/_/g, " ")
                    .replace(/\b\w/g, (c) => c.toUpperCase()),
                  cls: "bg-gray-700 text-white",
                };
                return (
                  <span
                    key={b}
                    className={`${badge.cls} text-[9px] font-bold px-1.5 py-0.5 rounded-sm leading-none`}
                  >
                    {badge.label}
                  </span>
                );
              })}
            </div>
          </div>

          <div
            className={`absolute top-2 right-2 z-30 flex flex-col gap-1.5 transition-opacity duration-300 ${showActionsOnHover ? "opacity-0 group-hover:opacity-100" : "opacity-100"}`}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                router.push(href);
              }}
              className="w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-md hover:bg-red-600 hover:text-white transition-colors"
            >
              <FaEye className="w-4 h-4" />
            </button>
            {!isOutOfStock && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  addToCart(product, 1);
                  trackAddToCart(product, 1, price);
                }}
                className="w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-md hover:bg-red-600 hover:text-white transition-colors"
                title="Add to cart"
              >
                <FaShoppingCart className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (!user) {
                  setPendingWishlist(product);
                  setShowAuthModal(true);
                } else {
                  addToWishlist(product);
                }
              }}
              className="w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-md hover:bg-red-600 hover:text-white transition-colors"
              title="Add to wishlist"
            >
              <FaHeart className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (isInCompare(product._id)) removeFromCompare(product._id);
                else addToCompare(product);
              }}
              className={`w-9 h-9 rounded-full flex items-center justify-center shadow-md transition-colors ${
                isInCompare(product._id)
                  ? "bg-indigo-600 text-white"
                  : "bg-white hover:bg-indigo-600 hover:text-white"
              }`}
              title={
                isInCompare(product._id)
                  ? "Remove from compare"
                  : "Compare Product"
              }
            >
              <FaBalanceScale className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-3 flex flex-col grow">
          <h3 className="text-sm font-semibold text-gray-900 mb-1 line-clamp-2">
            {product.title}
          </h3>

          <div className="mb-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-lg font-bold text-red-600">
                ৳{price?.toLocaleString()}
              </span>
              {compareAt && compareAt > price && (
                <span className="text-sm text-gray-500 line-through">
                  ৳{compareAt?.toLocaleString()}
                </span>
              )}
              {Number(product.rewardPoints) > 0 && (
                <span className="inline-flex items-center gap-1 bg-gradient-to-r from-amber-300 to-yellow-500 text-amber-900 text-[8px] font-bold px-1.5 py-0.5 rounded-full">
                  <FaStar className="w-2 h-2 text-red-700" />
                  {product.rewardPoints} points
                </span>
              )}
            </div>
            {product.freeShipping && (
              <p className="text-xs font-semibold text-green-700 mt-0.5">
                {t("home.free_shipping")}
              </p>
            )}
            {/* Color swatches - extracted from variants */}
            {(() => {
              const variantColors = getVariantColors(product);
              if (variantColors.length === 0) return null;
              return (
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {variantColors.slice(0, 5).map((c, i) => {
                    const hex = c.hex?.trim()
                      ? c.hex.startsWith("#")
                        ? c.hex
                        : `#${c.hex}`
                      : "#cccccc";
                    return (
                      <span
                        key={i}
                        title={c.name}
                        className="w-3 h-3 rounded-full inline-block border border-gray-200"
                        style={{ backgroundColor: hex }}
                      />
                    );
                  })}
                  {variantColors.length > 5 && (
                    <span className="text-[10px] text-gray-400 leading-4">
                      +{variantColors.length - 5}
                    </span>
                  )}
                </div>
              );
            })()}
          </div>

          {isOutOfStock ? (
            <div className="relative z-[2] mt-auto flex gap-1.5">
              <button
                disabled
                className="bg-gray-100 text-red-500 py-2 px-2 rounded-md text-[10px] font-medium cursor-not-allowed whitespace-nowrap"
              >
                {t("home.out_of_stock")}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setWaitlistProduct(product);
                }}
                className="flex-1 flex items-center justify-center  border border-teal-500 text-teal-700 gap-0.5 py-2 rounded-md text-[8px] md:text-[8px] font-semibold hover:bg-teal-50 transition"
              >
                <FaBell className="w-2 h-2 hidden md:block -mr-0.5" /> Join
                Waitlist
              </button>
            </div>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                addToCart(product, 1);
                trackAddToCart(product, 1, price);
              }}
              className="relative z-[2] w-full bg-red-600 text-white py-2 rounded-md font-medium hover:bg-red-700 transition mt-auto"
            >
              {t("home.add_to_cart")}
            </button>
          )}
        </div>
      </div>
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
      {waitlistProduct && (
        <WaitlistModal
          product={waitlistProduct}
          onClose={() => setWaitlistProduct(null)}
        />
      )}
    </>
  );
}
