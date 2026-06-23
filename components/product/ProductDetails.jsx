"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
import ProductInfoTabs from "@/components/product/ProductInfoTabs";
import {
  FaChevronLeft,
  FaChevronRight,
  FaStar,
  FaStarHalfAlt,
  FaRegStar,
  FaFacebook,
  FaTwitter,
  FaWhatsapp,
  FaCopy,
  FaTruck,
  FaClock,
  FaTimes,
  FaGift,
  FaCommentDots,
  FaPencilAlt,
} from "react-icons/fa";
import AddToCartSection from "@/components/product/AddToCartSection";
import {
  getVariantColors,
  getVariantSizes,
} from "@/components/cart/VariantEditModal";
import RelatedProducts from "@/components/product/RelatedProducts";
import ProductCard from "@/components/product/ProductCard";
import { FaCartShopping } from "react-icons/fa6";
import RecentlyViewed, {
  saveRecentlyViewed,
} from "@/components/product/RecentlyViewed";
import AdSlot from "@/components/ui/AdSlot";
import { getDisplayPrice } from "@/lib/pricing";
import DetailedDescriptionRenderer from "@/components/product/DetailedDescriptionRenderer";

function scrollToReviews() {
  window.dispatchEvent(new Event("openReviews"));
}

function StarDisplay({ value = 0, count = 0 }) {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    if (value >= i)
      stars.push(<FaStar key={i} className="text-yellow-400 w-4 h-4" />);
    else if (value >= i - 0.5)
      stars.push(<FaStarHalfAlt key={i} className="text-yellow-400 w-4 h-4" />);
    else stars.push(<FaRegStar key={i} className="text-gray-300 w-4 h-4" />);
  }
  return (
    <div className="flex items-center gap-1.5">
      <span className="flex gap-0.5">{stars}</span>
      <span className="text-sm font-semibold text-gray-700">
        {value > 0 ? value.toFixed(1) : ""}
      </span>
      <button className="text-sm text-gray-500" onClick={scrollToReviews}>
        ({count} review{count !== 1 ? "s" : ""})
      </button>
    </div>
  );
}

function StockBadge({ inventory, availability }) {
  if (availability === "out_of_stock" || inventory === 0) {
    return (
      <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-red-600">
        <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
        Out of Stock
      </span>
    );
  }
  if (availability === "pre_order") {
    return (
      <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600">
        <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
        Pre-Order
      </span>
    );
  }
  if (availability === "upcoming") {
    return (
      <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-purple-600">
        <span className="w-2 h-2 rounded-full bg-purple-500 inline-block" />
        Coming Soon
      </span>
    );
  }
  if (inventory != null && inventory <= 10) {
    return (
      <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-orange-600">
        <span className="w-2 h-2 rounded-full bg-orange-500 inline-block" />
        Only {inventory} left in stock — order soon!
      </span>
    );
  }
  return (
    <span className=" items-center gap-1.5 text-xs font-semibold text-rose-600 hidden md:block">
      <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
      Only{inventory != null ? ` ${inventory}` : ""} items left in Stock
    </span>
  );
}

function toPlainText(desc) {
  if (!desc) return "";
  if (typeof desc === "string") return desc;
  if (Array.isArray(desc))
    return desc
      .map((b) =>
        typeof b === "string"
          ? b
          : (b?.content || b?.text || "").replace(/<[^>]+>/g, ""),
      )
      .filter(Boolean)
      .join(" ");
  return "";
}

// COLOR_MAP is static data — defined once at module level, never recreated on render
const COLOR_MAP = {
  red: "#ef4444",
  blue: "#3b82f6",
  green: "#22c55e",
  yellow: "#facc15",
  orange: "#f97316",
  purple: "#a855f7",
  pink: "#ec4899",
  black: "#111827",
  white: "#ffffff",
  gray: "#9ca3af",
  grey: "#9ca3af",
  brown: "#92400e",
  navy: "#1e3a5f",
  "navy blue": "#1e3a5f",
  skyblue: "#7dd3fc",
  "sky blue": "#7dd3fc",
  "light blue": "#93c5fd",
  "dark blue": "#1d4ed8",
  teal: "#14b8a6",
  cyan: "#06b6d4",
  indigo: "#6366f1",
  violet: "#7c3aed",
  gold: "#ca8a04",
  silver: "#d1d5db",
  beige: "#e5d3b3",
  cream: "#fef9c3",
  maroon: "#7f1d1d",
  magenta: "#d946ef",
  lime: "#84cc16",
  olive: "#65a30d",
  coral: "#fb7185",
  salmon: "#fda4af",
  turquoise: "#2dd4bf",
  "off white": "#f5f5f5",
  offwhite: "#f5f5f5",
  "light green": "#86efac",
  "dark green": "#15803d",
  "light gray": "#e5e7eb",
  "dark gray": "#4b5563",
  "rose gold": "#d4a5a5",
  charcoal: "#374151",
  mustard: "#ca8a04",
};

export default function ProductDetails({ product, relatedProducts = [] }) {
  const router = useRouter();
  const images = (product?.images || []).map((i) => i.url);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [copied, setCopied] = useState(false);
  const [offersOpen, setOffersOpen] = useState(false);
  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [zoomOpen, setZoomOpen] = useState(false);
  const [openPolicy, setOpenPolicy] = useState(null);
  const [isDesktop, setIsDesktop] = useState(false);
  // touch swipe state for zoom modal
  const touchStartX = React.useRef(null);
  const currentImage = images[currentIndex] || "/assets/placeholder.svg";

  // keyboard navigation in zoom modal
  useEffect(() => {
    if (!zoomOpen || images.length <= 1) return;
    const handler = (e) => {
      if (e.key === "ArrowLeft")
        setCurrentIndex((i) => (i - 1 + images.length) % images.length);
      if (e.key === "ArrowRight")
        setCurrentIndex((i) => (i + 1) % images.length);
      if (e.key === "Escape") setZoomOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [zoomOpen, images.length]);

  useEffect(() => {
    const updateViewport = () => setIsDesktop(window.innerWidth >= 1024);
    updateViewport();
    window.addEventListener("resize", updateViewport);
    return () => window.removeEventListener("resize", updateViewport);
  }, []);

  useEffect(() => {
    if (product) saveRecentlyViewed(product);
  }, [product]);

  useEffect(() => {
    if (product?._id) {
      fetch(`${API}/api/analytics/view/${product._id}`, {
        method: "POST",
      }).catch(() => {});
    }
  }, [product?._id]);

  // Inject Product JSON-LD schema for SEO
  useEffect(() => {
    if (!product) return;
    const SITE_URL =
      process.env.NEXT_PUBLIC_SITE_URL || "https://smartproductbuy.com";
    const schema = {
      "@context": "https://schema.org",
      "@type": "Product",
      name: product.title,
      description:
        typeof product.description === "string"
          ? product.description
          : Array.isArray(product.description)
            ? product.description
                .map((b) => (typeof b === "string" ? b : b?.text || ""))
                .join(" ")
            : "",
      image: (product.images || []).map((i) => i.url).filter(Boolean),
      sku: product.sku || undefined,
      brand: product.department
        ? { "@type": "Brand", name: product.department }
        : undefined,
      offers: {
        "@type": "Offer",
        url: `${SITE_URL}/product/${product._id}`,
        priceCurrency: "BDT",
        price: product.price,
        availability:
          product.availability === "out_of_stock"
            ? "https://schema.org/OutOfStock"
            : "https://schema.org/InStock",
        seller: { "@type": "Organization", name: "SmartBuy BD" },
      },
      ...(product.averageRating > 0 && product.reviewCount > 0
        ? {
            aggregateRating: {
              "@type": "AggregateRating",
              ratingValue: product.averageRating.toFixed(1),
              reviewCount: product.reviewCount,
              bestRating: 5,
              worstRating: 1,
            },
          }
        : {}),
    };
    const existing = document.getElementById("product-jsonld");
    if (existing) existing.remove();
    const script = document.createElement("script");
    script.id = "product-jsonld";
    script.type = "application/ld+json";
    script.textContent = JSON.stringify(schema);
    document.head.appendChild(script);
    return () => {
      script.remove();
    };
  }, [product]);

  // Update document title, meta tags, and canonical link client-side.
  // For __placeholder__ pages (new products added after build), this ensures
  // Google sees real metadata on its JS-rendering pass.
  useEffect(() => {
    if (!product) return;

    const SITE_URL =
      process.env.NEXT_PUBLIC_SITE_URL || "https://smartproductbuy.com";

    const seoTitle = product.seo?.title || product.title;
    const seoDesc =
      product.seo?.description ||
      (typeof product.description === "string"
        ? product.description.replace(/<[^>]*>/g, "").slice(0, 160)
        : `Buy ${product.title} at SmartBuy BD. Best price, fast delivery across Bangladesh.`);
    const seoKeywords = (product.seo?.keywords || []).join(", ");
    const seoImage = product.images?.[0]?.url || `${SITE_URL}/mainLogo.png`;
    const productUrl = `${SITE_URL}/product/${product._id}`;

    const prevTitle = document.title;
    document.title = `${seoTitle} | SmartBuy BD`;

    const setMeta = (selector, attr, value) => {
      let el = document.querySelector(selector);
      if (!el) {
        el = document.createElement("meta");
        const [attrName, attrVal] =
          selector.match(/\[([^=]+)="([^"]+)"\]/)?.slice(1) || [];
        if (attrName) el.setAttribute(attrName, attrVal);
        document.head.appendChild(el);
      }
      el.setAttribute(attr, value);
    };

    setMeta('meta[name="description"]', "content", seoDesc);
    if (seoKeywords) setMeta('meta[name="keywords"]', "content", seoKeywords);
    setMeta(
      'meta[property="og:title"]',
      "content",
      `${seoTitle} | SmartBuy BD`,
    );
    setMeta('meta[property="og:description"]', "content", seoDesc);
    setMeta('meta[property="og:image"]', "content", seoImage);
    setMeta('meta[property="og:url"]', "content", productUrl);
    setMeta('meta[property="og:type"]', "content", "website");
    setMeta(
      'meta[name="twitter:title"]',
      "content",
      `${seoTitle} | SmartBuy BD`,
    );
    setMeta('meta[name="twitter:description"]', "content", seoDesc);
    setMeta('meta[name="twitter:image"]', "content", seoImage);

    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", productUrl);

    return () => {
      document.title = prevTitle;
    };
  }, [product]);

  const shareUrl = typeof window !== "undefined" ? window.location.href : "";
  const handleCopy = () => {
    navigator.clipboard?.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const prevImage = () => {
    if (images.length)
      setCurrentIndex((i) => (i - 1 + images.length) % images.length);
  };
  const nextImage = () => {
    if (images.length) setCurrentIndex((i) => (i + 1) % images.length);
  };

  if (!product)
    return (
      <div className="py-24 text-center text-gray-500">Loading product...</div>
    );

  const {
    title,
    description,
    inventory,
    availability,
    averageRating = 0,
    reviewCount = 0,
    tags = [],
    category,
  } = product;
  // Get all colors and sizes from variants (unfiltered)
  const allColors = getVariantColors(product);
  const allSizes = getVariantSizes(product);

  // Get filtered colors/sizes based on current selection
  // When a size is selected, show only colors available for that size
  // When a color is selected, show only sizes available for that color
  const productColors = selectedSize
    ? getVariantColors(product, selectedSize)
    : allColors;
  const productSizes = selectedColor
    ? getVariantSizes(product, selectedColor)
    : allSizes;
  const selectedVariant =
    Array.isArray(product.variants) && product.variants.length
      ? product.variants.find((variant) => {
          const variantColor = String(
            variant?.color?.name ||
              variant?.attributes?.Color ||
              variant?.attributes?.color ||
              "",
          )
            .trim()
            .toLowerCase();
          const variantSize = String(
            variant?.size ||
              variant?.attributes?.Size ||
              variant?.attributes?.size ||
              "",
          )
            .trim()
            .toLowerCase();
          const color = String(selectedColor?.name || "")
            .trim()
            .toLowerCase();
          const size = String(selectedSize || "")
            .trim()
            .toLowerCase();
          if (!color && !size) return false;
          return (
            (!variantColor || !color || variantColor === color) &&
            (!variantSize || !size || variantSize === size) &&
            ((variantColor && color && variantColor === color) ||
              (variantSize && size && variantSize === size))
          );
        }) || null
      : null;
  const { price, compareAtPrice, discountPct } = selectedVariant
    ? getDisplayPrice(product, selectedVariant)
    : {
        price: Number(product.price) || 0,
        compareAtPrice: Number(product.compareAtPrice) || null,
        discountPct:
          product.compareAtPrice && product.compareAtPrice > product.price
            ? Math.round(
                ((product.compareAtPrice - product.price) /
                  product.compareAtPrice) *
                  100,
              )
            : null,
      };

  const tabProduct = { ...product, description };
  const topBadges = [
    ...(product.freeShipping ? ["free_shipping"] : []),
    ...(product.flashSale ? ["flash_sale"] : []),
    ...(product.featured ? ["featured"] : []),
    ...(product.clearance ? ["clearance"] : []),
    ...(product.coupon ? ["coupon"] : []),
    ...(product.badges || []).filter((b) => b !== "free_shipping"),
  ].slice(0, 3);

  const resolveColor = (col) => {
    // 1. Use hex if provided — ensure it starts with #
    if (col.hex && col.hex.trim()) {
      const h = col.hex.trim();
      return h.startsWith("#") ? h : `#${h}`;
    }
    // 2. Look up name in map (exact, then partial)
    const key = (col.name || "").toLowerCase().trim();
    if (COLOR_MAP[key]) return COLOR_MAP[key];
    // partial match — e.g. "Dark Navy Blue" → try "navy blue", "blue"
    for (const mapKey of Object.keys(COLOR_MAP)) {
      if (key.includes(mapKey)) return COLOR_MAP[mapKey];
    }
    // 3. Return as-is (valid CSS color names like "red", "blue" still work)
    return col.name || "#cccccc";
  };

  return (
    <div
      key={product?._id || product?.id}
      className="max-w-7xl mx-auto py-6 px-2"
    >
      {/* Back button */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-4 transition"
      >
        <FaChevronLeft className="w-3 h-3" /> Back
      </button>

      {/* ── Main product section ── */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* ── LEFT: image gallery ── */}
        <div className="w-full lg:w-[42%] flex flex-col gap-3">
          <div className="flex gap-2">
            {/* Vertical thumbnail strip */}
            {images.length > 1 && (
              <div className="flex flex-col gap-2 w-12 md:w-16 flex-shrink-0">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentIndex(idx)}
                    onMouseEnter={() => setCurrentIndex(idx)}
                    className={`rounded border-1 overflow-hidden transition aspect-square ${
                      currentIndex === idx
                        ? "border-gray-900"
                        : "border-gray-200 hover:border-gray-400"
                    }`}
                  >
                    <Image
                      src={encodeURI(img)}
                      alt={`${title} ${idx + 1}`}
                      width={48}
                      height={48}
                      className="object-contain w-full h-full p-0 md:p-0.5"
                    />
                  </button>
                ))}
              </div>
            )}
            {/* Main image */}
            <div className="relative bg-white border border-gray-200 flex-1 aspect-square flex items-center justify-center overflow-hidden rounded">
              {images.length > 1 && (
                <button
                  onClick={prevImage}
                  className="absolute left-2 z-10 p-1.5 bg-white border border-gray-300 rounded-full shadow-sm hover:bg-gray-50 transition"
                >
                  <FaChevronLeft className="w-3 h-3 text-gray-600" />
                </button>
              )}
              <button
                onClick={() => setZoomOpen(true)}
                className="w-full h-full cursor-zoom-in group flex items-center justify-center"
                title="Click to zoom"
              >
                <Image
                  src={encodeURI(currentImage)}
                  alt={title}
                  width={700}
                  height={700}
                  className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-300"
                />
              </button>
              {images.length > 1 && (
                <button
                  onClick={nextImage}
                  className="absolute right-2 z-10 p-1.5 bg-white border border-gray-300 rounded-full shadow-sm hover:bg-gray-50 transition"
                >
                  <FaChevronRight className="w-3 h-3 text-gray-600" />
                </button>
              )}
              {discountPct && (
                <span className="absolute top-3 left-3 bg-gradient-to-r from-red-400 to-red-600 text-white text-xs font-bold px-2 py-0.5 rounded">
                  -{discountPct}%
                </span>
              )}
              {/* Product badges — top right */}
              {topBadges.length > 0 && (
                <div className="absolute top-3 right-3 flex flex-col gap-1 items-end">
                  {topBadges.map((badge) => {
                    const map = {
                      free_shipping: {
                        label: "🚚 Free Shipping",
                        cls: "bg-gradient-to-r from-green-200 to-green-300 text-green-800",
                      },
                      best_seller: {
                        label: "⭐ Best Seller",
                        cls: "bg-gradient-to-r from-yellow-200 to-yellow-300 text-yellow-800",
                      },
                      hot: {
                        label: "🔥 Hot",
                        cls: "bg-gradient-to-r from-orange-200 to-orange-300 text-orange-800",
                      },
                      new_arrival: {
                        label: "🎀 New Arrival",
                        cls: "bg-gradient-to-r from-blue-200 to-blue-300 text-blue-800",
                      },
                      trending: {
                        label: "📈 Trending",
                        cls: "bg-gradient-to-r from-purple-200 to-purple-300 text-purple-800",
                      },
                      limited: {
                        label: "🔒 Limited",
                        cls: "bg-gradient-to-r from-red-200 to-red-300 text-red-800",
                      },
                      popular_pics: {
                        label: "🎉 Popular",
                        cls: "bg-gradient-to-r from-pink-200 to-pink-300 text-pink-800",
                      },
                      deals_of_the_day: {
                        label: "🏷️ Deal of the Day",
                        cls: "bg-gradient-to-r from-green-200 to-green-300 text-green-800",
                      },
                      flash_sale: {
                        label: "⚡ Flash Sale",
                        cls: "bg-gradient-to-r from-rose-200 to-rose-300 text-rose-800",
                      },
                      featured: {
                        label: "🏅 Featured",
                        cls: "bg-gradient-to-r from-indigo-200 to-indigo-300 text-indigo-800",
                      },
                      clearance: {
                        label: "🏷️ Clearance",
                        cls: "bg-gradient-to-r from-amber-200 to-amber-300 text-amber-800",
                      },
                      coupon: {
                        label: "🎫 Coupon",
                        cls: "bg-gradient-to-r from-teal-200 to-teal-300 text-teal-800",
                      },
                    };
                    const b = map[badge] || {
                      label: badge
                        .replace(/_/g, " ")
                        .replace(/\b\w/g, (c) => c.toUpperCase()),
                      cls: "bg-gradient-to-r from-gray-200 to-gray-300 text-gray-800",
                    };
                    return (
                      <span
                        key={badge}
                        className={`${b.cls} text-[10px] font-bold px-2 py-0.5 rounded`}
                      >
                        {b.label}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── MIDDLE: product info ── */}
        <div className="w-full lg:flex-1 flex flex-col">
          {/* Title */}
          <h1 className="text-xl font-bold text-gray-900 leading-tight mb-1.5">
            {title}
          </h1>

          {/* Stars + review link */}
          <div className="flex items-center gap-2 mb-1">
            <StarDisplay value={averageRating} count={reviewCount} />
            <span className="text-gray-300">|</span>
            <button
              onClick={scrollToReviews}
              className="text-xs text-gray-600 hover:text-gray-800 underline underline-offset-3 transition"
            >
              Write a review
            </button>
          </div>

          {/* Price */}
          <div className="flex items-center gap-3 flex-wrap mb-3">
            <span className="text-xl font-bold text-gray-900">
              ৳{price?.toLocaleString()}
            </span>
            {compareAtPrice && compareAtPrice > price && (
              <span className="text-sm text-gray-400 line-through font-normal">
                ৳{compareAtPrice?.toLocaleString()}
              </span>
            )}
          </div>
          {product.freeShipping && (
            <p className="text-lg font-semibold text-green-700 mb-3">
              🚚 FREE SHIPPING
            </p>
          )}

          <hr className="border-gray-200 mb-3 -mt-3" />

          {/* Description */}
          {toPlainText(description) && (
            <p className="text-gray-500 text-sm leading-relaxed mb-1 line-clamp-4">
              {toPlainText(description)}
            </p>
          )}

          {/* Stock */}
          <div className="mb-3">
            <StockBadge inventory={inventory} availability={availability} />
          </div>

          {/* Color swatches */}
          {productColors.length > 0 && (
            <div className="mb-2">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-semibold text-gray-800">
                  Color:
                </span>
                {selectedColor && (
                  <span className="text-sm text-gray-600 font-medium px-2 py-0.5 bg-gray-100 rounded">
                    {selectedColor.name}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-3">
                {productColors.map((col, idx) => {
                  const isSelected = selectedColor?.name === col.name;
                  const color = resolveColor(col);
                  return (
                    <button
                      key={idx}
                      onClick={() => setSelectedColor(isSelected ? null : col)}
                      title={col.name}
                      className="flex flex-col items-center gap-1.5 transition-all group"
                    >
                      <span
                        className={`w-12 h-12 rounded-full block transition-all relative ${
                          isSelected
                            ? "scale-110 ring-2 ring-offset-2 ring-gray-900"
                            : "hover:scale-105"
                        }`}
                        style={{
                          backgroundColor: color,
                          border: "2px solid #e5e7eb",
                          boxShadow: isSelected
                            ? `0 4px 12px ${color}50`
                            : "0 2px 4px rgba(0,0,0,.1)",
                        }}
                      >
                        {isSelected && (
                          <span className="absolute inset-0 flex items-center justify-center">
                            <svg
                              className="w-5 h-5 text-white drop-shadow-md"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </span>
                        )}
                      </span>
                      <span
                        className={`text-xs text-center max-w-[50px] truncate transition-colors ${
                          isSelected
                            ? "font-bold text-gray-900"
                            : "text-gray-500 group-hover:text-gray-700"
                        }`}
                      >
                        {col.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Size selector — box style */}
          {productSizes.length > 0 && (
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-sm font-semibold text-gray-800">
                  Size:
                </span>
                {selectedSize && (
                  <span className="text-sm text-gray-600 font-medium px-2 py-0.5 bg-gray-100 rounded">
                    {selectedSize}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {productSizes.map((size, idx) => (
                  <button
                    key={idx}
                    onClick={() =>
                      setSelectedSize(selectedSize === size ? null : size)
                    }
                    className={`min-w-[48px] h-11 px-4 text-sm font-semibold rounded-lg border-2 transition-all ${
                      selectedSize === size
                        ? "bg-gray-900 text-white border-gray-900 shadow-md scale-105"
                        : "bg-white text-gray-700 border-gray-200 hover:border-gray-900 hover:bg-gray-50"
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}

          <hr className="border-gray-200 mb-3 mt-1" />

          {/* Add to cart */}
          <div className="mb-3">
            <AddToCartSection
              product={product}
              selectedColor={selectedColor?.name ?? null}
              selectedSize={selectedSize ?? null}
            />
          </div>

          {/* Shipping info */}
          <div className="flex flex-col gap-2 mb-3 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <FaClock className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
              <span>
                Delivers in:{" "}
                <strong className="text-gray-700 font-medium">
                  3–5 Working Days
                </strong>{" "}
                <a
                  href="/shipping"
                  className="underline underline-offset-2 text-black text-xs hover:text-gray-700 transition"
                >
                  Shipping &amp; Return
                </a>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <FaCartShopping className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
              <span>Guaranteed Safe Checkout</span>
            </div>
          </div>

          <hr className="border-gray-100 mb-3" />

          {/* SKU / Category / Tags / Share */}
          <div className="flex flex-col gap-2 text-sm">
            {category && (
              <div className="flex items-center gap-2">
                <span className="text-gray-400 w-20 flex-shrink-0">
                  Category:
                </span>
                <span className="text-gray-600">
                  {typeof category === "object" ? category.name : category}
                </span>
              </div>
            )}
            {tags.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-gray-400 w-20 flex-shrink-0">Tags:</span>
                <div className="flex flex-wrap gap-x-2 gap-y-1">
                  {tags.map((tag, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() =>
                        router.push(
                          `/tag/${encodeURIComponent(
                            String(tag).toLowerCase().replace(/\s+/g, "-"),
                          )}`,
                        )
                      }
                      className="text-xs text-gray-500 hover:text-red-600 transition-colors cursor-pointer"
                    >
                      #{tag}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="flex items-center gap-2">
              <span className="text-gray-400 w-20 flex-shrink-0">Share:</span>
              <div className="flex items-center gap-3">
                <a
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-500 hover:text-blue-600 transition"
                >
                  <FaFacebook className="w-4 h-4" />
                </a>
                <a
                  href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(title)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-500 hover:text-sky-500 transition"
                >
                  <FaTwitter className="w-4 h-4" />
                </a>
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(title + " " + shareUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-500 hover:text-green-600 transition"
                >
                  <FaWhatsapp className="w-4 h-4" />
                </a>
                <button
                  onClick={handleCopy}
                  title="Copy link"
                  className="text-gray-500 hover:text-gray-800 transition"
                >
                  <FaCopy className="w-4 h-4" />
                </button>
                {copied && (
                  <span className="text-xs text-green-600">Copied!</span>
                )}
              </div>
            </div>
          </div>
        </div>
        {/* ── RIGHT: Available Offers sidebar ── */}
        <div className="w-full lg:w-52 flex-shrink-0 flex flex-col gap-3">
          {/* Available Offer card */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={() => setOffersOpen((v) => !v)}
              className="lg:cursor-default w-full bg-gray-50 border-b border-gray-200 px-3 py-2 flex items-center justify-between"
            >
              <p className="text-xs font-bold text-gray-700 uppercase tracking-wide">
                Available Offer
              </p>
              <FaChevronRight
                className={`lg:hidden w-3 h-3 text-gray-400 transition-transform duration-200 ${offersOpen ? "rotate-90" : ""}`}
              />
            </button>
            <div className={`lg:block ${offersOpen ? "block" : "hidden"}`}>
              {/* Reward Points */}
              <div className="px-3 py-3 flex items-start gap-3 border-b border-gray-100">
                <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                  <FaGift className="text-blue-500 w-4 h-4" />
                </div>
                <div className="flex flex-col">
                  <p className="text-[11px] font-bold text-gray-800">
                    Earn Points, Save More
                  </p>
                  {product.rewardPoints > 0 ? (
                    <p className="text-xs text-blue-600 font-semibold mt-0.5">
                      Earn{" "}
                      <strong className="text-red-500">
                        {product.rewardPoints}
                      </strong>{" "}
                      points on this order
                    </p>
                  ) : (
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      Points credited after delivery
                    </p>
                  )}
                </div>
              </div>

              {/* Ask about product */}
              <div className="px-3 py-2.5">
                <button
                  onClick={() => {
                    const el = document.getElementById("reviews-tab");
                    if (el) el.scrollIntoView({ behavior: "smooth" });
                    window.dispatchEvent(new Event("openQuestions"));
                  }}
                  className="w-full flex items-center gap-2 text-[11px] font-semibold text-gray-700 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded px-3 py-2 transition-all"
                >
                  <FaCommentDots className="text-orange-400 w-3.5 h-3.5 flex-shrink-0" />
                  Ask about this product
                </button>
              </div>

              {/* Write a review */}
              <div className="px-3 pb-3">
                <button
                  onClick={scrollToReviews}
                  className="w-full flex items-center gap-2 text-[11px] font-semibold text-gray-700 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded px-3 py-2 transition-all"
                >
                  <FaPencilAlt className="text-green-500 w-3 h-3 flex-shrink-0" />
                  Write your Awesome Review
                </button>
              </div>
            </div>
          </div>
          <AdSlot page="productPage" format="rectangle" className="w-full" />
        </div>
      </div>

      {/* product info tabs */}
      <div id="reviews-tab">
        <ProductInfoTabs product={tabProduct} />
      </div>

      {/* ad above related products */}
      <AdSlot page="productPage" className="max-w-6xl mx-auto px-4 mt-10" />

      {/* related products */}
      <RelatedProducts products={relatedProducts} />

      {/* detailed description blocks */}
      {product?.detailedDescription && (
        <DetailedDescriptionRenderer value={product.detailedDescription} />
      )}

      {/* warranty, return policy, customization — accordion */}
      {(product?.warranty?.period?.trim() ||
        product?.warranty?.details?.trim() ||
        product?.returnPolicy?.days > 0 ||
        product?.returnPolicy?.details?.trim() ||
        product?.customization?.customizable) && (
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="border border-gray-200 rounded-xl overflow-hidden bg-white divide-y divide-gray-100">
            {/* Warranty row */}
            {(product.warranty?.period || product.warranty?.details) && (
              <div>
                <button
                  type="button"
                  onClick={() =>
                    setOpenPolicy(openPolicy === "warranty" ? null : "warranty")
                  }
                  className="w-full flex items-center justify-between px-5 py-2 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-50 text-blue-600">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                        />
                      </svg>
                    </span>
                    <div className="text-left">
                      <p className="text-sm font-semibold text-gray-800">
                        Warranty
                      </p>
                      {product.warranty.period && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          {product.warranty.period}
                          {product.warranty.provider
                            ? ` · ${product.warranty.provider}`
                            : ""}
                        </p>
                      )}
                    </div>
                  </div>
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                    {openPolicy === "warranty" ? "Hide" : "See"}
                    <svg
                      className={`w-3 h-3 transition-transform ${openPolicy === "warranty" ? "rotate-180" : ""}`}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </span>
                </button>
                {openPolicy === "warranty" && (
                  <div className="px-5 pb-5 pt-1 bg-blue-50/30">
                    <div className="space-y-1">
                      {product.warranty.period && (
                        <div className="flex justify-between text-sm py-2 border-b border-blue-100">
                          <span className="text-gray-500">Period</span>
                          <span className="font-semibold text-gray-800">
                            {product.warranty.period}
                          </span>
                        </div>
                      )}
                      {product.warranty.provider && (
                        <div className="flex justify-between text-sm py-2 border-b border-blue-100">
                          <span className="text-gray-500">Provider</span>
                          <span className="text-gray-700">
                            {product.warranty.provider}
                          </span>
                        </div>
                      )}
                      {product.warranty.details && (
                        <p className="text-sm text-gray-600 pt-1 leading-relaxed">
                          {product.warranty.details}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Return Policy row */}
            {(product.returnPolicy?.days != null ||
              product.returnPolicy?.details) && (
              <div>
                <button
                  type="button"
                  onClick={() =>
                    setOpenPolicy(openPolicy === "return" ? null : "return")
                  }
                  className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-green-50 text-green-600">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M16 15v-1a4 4 0 00-4-4H8m0 0l3 3m-3-3l3-3m9 14V5a2 2 0 00-2-2H6a2 2 0 00-2 2v16l4-2 4 2 4-2 4 2z"
                        />
                      </svg>
                    </span>
                    <div className="text-left">
                      <p className="text-sm font-semibold text-gray-800">
                        Return Policy
                      </p>
                      {product.returnPolicy.days != null && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          {product.returnPolicy.days}-day return window ·{" "}
                          {product.returnPolicy.refundable
                            ? "Refundable"
                            : "Non-refundable"}
                        </p>
                      )}
                    </div>
                  </div>
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-green-600 bg-green-50 px-3 py-1 rounded-full">
                    {openPolicy === "return" ? "Hide" : "See"}
                    <svg
                      className={`w-3 h-3 transition-transform ${openPolicy === "return" ? "rotate-180" : ""}`}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </span>
                </button>
                {openPolicy === "return" && (
                  <div className="px-5 pb-5 pt-1 bg-green-50/30">
                    <div className="space-y-1">
                      {product.returnPolicy.days != null && (
                        <div className="flex justify-between text-sm py-2 border-b border-green-100">
                          <span className="text-gray-500">Return Window</span>
                          <span className="font-semibold text-gray-800">
                            {product.returnPolicy.days} days
                          </span>
                        </div>
                      )}
                      {product.returnPolicy.refundable != null && (
                        <div className="flex justify-between text-sm py-2 border-b border-green-100">
                          <span className="text-gray-500">Refundable</span>
                          <span
                            className={`font-semibold ${product.returnPolicy.refundable ? "text-green-600" : "text-red-500"}`}
                          >
                            {product.returnPolicy.refundable ? "Yes" : "No"}
                          </span>
                        </div>
                      )}
                      {product.returnPolicy.details && (
                        <p className="text-sm text-gray-600 pt-1 leading-relaxed">
                          {product.returnPolicy.details}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Customization Options row */}
            {product.customization?.customizable &&
              product.customization?.options?.length > 0 && (
                <div>
                  <button
                    type="button"
                    onClick={() =>
                      setOpenPolicy(openPolicy === "custom" ? null : "custom")
                    }
                    className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex items-center justify-center w-8 h-8 rounded-full bg-orange-50 text-orange-500">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                          />
                        </svg>
                      </span>
                      <div className="text-left">
                        <p className="text-sm font-semibold text-gray-800">
                          Customization Options
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {product.customization.options.length} option
                          {product.customization.options.length !== 1
                            ? "s"
                            : ""}{" "}
                          available
                        </p>
                      </div>
                    </div>
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-orange-500 bg-orange-50 px-3 py-1 rounded-full">
                      {openPolicy === "custom" ? "Hide" : "See"}
                      <svg
                        className={`w-3 h-3 transition-transform ${openPolicy === "custom" ? "rotate-180" : ""}`}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </span>
                  </button>
                  {openPolicy === "custom" && (
                    <div className="px-5 pb-5 pt-1 bg-orange-50/20">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {product.customization.options.map((opt, i) => (
                          <div
                            key={i}
                            className="bg-white border border-orange-100 rounded-xl p-3"
                          >
                            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                              {opt.name}
                            </p>
                            {opt.values?.length > 0 ? (
                              <div className="flex flex-wrap gap-1.5">
                                {opt.values.map((v, j) => (
                                  <span
                                    key={j}
                                    className="text-xs px-2.5 py-1 bg-orange-50 border border-orange-200 rounded-full text-orange-700"
                                  >
                                    {v}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <p className="text-xs text-gray-400">
                                Custom input
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
          </div>
        </div>
      )}

      {/* recently viewed — always at the very bottom */}
      <RecentlyViewed
        currentProductId={product?._id}
        mobilePerRow={3}
        desktopPerRow={6}
        rows={1}
      />

      {/* ── Image Zoom Modal ── */}
      {zoomOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4"
          onClick={() => setZoomOpen(false)}
          onTouchStart={(e) => {
            touchStartX.current = e.touches[0].clientX;
          }}
          onTouchEnd={(e) => {
            if (touchStartX.current === null || images.length <= 1) return;
            const diff = e.changedTouches[0].clientX - touchStartX.current;
            if (Math.abs(diff) > 50) {
              if (diff < 0) setCurrentIndex((i) => (i + 1) % images.length);
              else
                setCurrentIndex((i) => (i - 1 + images.length) % images.length);
            }
            touchStartX.current = null;
          }}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] w-full h-full flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setZoomOpen(false)}
              className="absolute top-2 right-2 z-10 w-9 h-9 rounded-full bg-white/90 hover:bg-white flex items-center justify-center shadow-md transition"
            >
              <FaTimes className="w-3.5 h-3.5 text-gray-700" />
            </button>

            {/* Image counter */}
            {images.length > 1 && (
              <div className="absolute top-2 left-2 z-10 bg-black/50 text-white text-xs font-semibold px-3 py-1 rounded-full">
                {currentIndex + 1} / {images.length}
              </div>
            )}

            {/* Prev / Next */}
            {images.length > 1 && (
              <button
                onClick={() =>
                  setCurrentIndex(
                    (i) => (i - 1 + images.length) % images.length,
                  )
                }
                className="absolute left-2 z-10 p-2.5 bg-white/90 rounded-full shadow-md hover:bg-white hover:scale-110 transition-all"
              >
                <FaChevronLeft className="w-4 h-4 text-gray-700" />
              </button>
            )}
            {images.length > 1 && (
              <button
                onClick={() => setCurrentIndex((i) => (i + 1) % images.length)}
                className="absolute right-2 z-10 p-2.5 bg-white/90 rounded-full shadow-md hover:bg-white hover:scale-110 transition-all"
              >
                <FaChevronRight className="w-4 h-4 text-gray-700" />
              </button>
            )}

            {/* Zoomed image */}
            <div
              className="bg-white rounded-2xl overflow-hidden flex items-center justify-center shadow-2xl"
              style={{
                maxWidth: "720px",
                maxHeight: "80vh",
                width: "100%",
                height: "100%",
              }}
            >
              <Image
                src={encodeURI(currentImage)}
                alt={title}
                width={900}
                height={900}
                className="w-full h-full object-contain p-4"
              />
            </div>

            {/* Keyboard hint */}
            {images.length > 1 && (
              <p className="absolute bottom-16 left-1/2 -translate-x-1/2 text-white/40 text-[10px] whitespace-nowrap hidden md:block">
                ← → keys to navigate · ESC to close
              </p>
            )}

            {/* Thumbnail strip */}
            {images.length > 1 && (
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 overflow-x-auto max-w-[90vw] pb-1">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentIndex(idx)}
                    className={`w-12 h-12 shrink-0 rounded-lg border-2 overflow-hidden bg-white transition-all ${
                      currentIndex === idx
                        ? "border-white scale-110 shadow-lg"
                        : "border-white/30 hover:border-white/70 opacity-70 hover:opacity-100"
                    }`}
                  >
                    <Image
                      src={encodeURI(img)}
                      alt={`thumb-${idx}`}
                      width={48}
                      height={48}
                      className="w-full h-full object-contain"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
