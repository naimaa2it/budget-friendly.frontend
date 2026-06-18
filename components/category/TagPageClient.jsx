"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import ProductCard from "@/components/product/ProductCard";
import ProductFilters from "@/components/product/ProductFilters";
import SortDropdown from "@/components/product/SortDropdown";
import Link from "next/link";
import { getDisplayPrice } from "@/lib/pricing";
import AdSlot from "@/components/ui/AdSlot";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const TAG_CONFIG = {
  "deals-of-the-day": {
    label: "Deal of the Day",
    badge: "deals_of_the_day",
    icon: "🔥",
    defaultSort: "newest",
  },
  deals_of_the_day: {
    label: "Deal of the Day",
    badge: "deals_of_the_day",
    icon: "🔥",
    defaultSort: "newest",
  },
  "popular-pics": {
    label: "Today's Popular Picks",
    badge: "popular_pics",
    icon: "💖",
    defaultSort: "position",
  },
  popular_pics: {
    label: "Today's Popular Picks",
    badge: "popular_pics",
    icon: "💖",
    defaultSort: "position",
  },
  "best-seller": {
    label: "Best Sellers",
    badge: "best_seller",
    icon: "⭐",
    defaultSort: "priceHigh",
  },
  best_seller: {
    label: "Best Sellers",
    badge: "best_seller",
    icon: "⭐",
    defaultSort: "priceHigh",
  },
  hot: {
    label: "Hot Right Now",
    badge: "hot",
    icon: "🔥",
    defaultSort: "newest",
  },
  "new-arrival": {
    label: "New Arrivals",
    badge: "new_arrival",
    icon: "✨",
    defaultSort: "newest",
  },
  new_arrival: {
    label: "New Arrivals",
    badge: "new_arrival",
    icon: "✨",
    defaultSort: "newest",
  },
  trending: {
    label: "Trending Now",
    badge: "trending",
    icon: "📈",
    defaultSort: "newest",
  },
  "limited-edition": {
    label: "Limited Edition",
    badge: "limited",
    icon: "💎",
    defaultSort: "position",
  },
  limited: {
    label: "Limited Edition",
    badge: "limited",
    icon: "💎",
    defaultSort: "position",
  },
  featured: {
    label: "Featured Products",
    flag: "featured",
    icon: "🏅",
    defaultSort: "position",
  },
  "flash-sale": {
    label: "Flash Sale",
    flag: "flash-sale",
    icon: "⚡",
    defaultSort: "priceLow",
  },
  clearance: {
    label: "Clearance",
    flag: "clearance",
    icon: "🏷️",
    defaultSort: "priceLow",
  },
  "free-shipping": {
    label: "Free Shipping",
    flag: "freeShipping",
    icon: "🚚",
    defaultSort: "position",
  },
  "up-to-400-bkash-cashback": {
    label: "Up To 400 Bkash Cashback",
    badge: "bkash_cashback_400",
    icon: "💸",
    defaultSort: "position",
    badgeAliases: [
      "bkash_cashback_400",
      "up_to_400_bkash_cashback",
      "400_cashback",
    ],
  },
  "up-to-1000-tk-visa-mastercard": {
    label: "Up To 1000 Tk Visa/Mastercard",
    badge: "visa_mastercard_1000",
    icon: "💳",
    defaultSort: "position",
    badgeAliases: [
      "visa_mastercard_1000",
      "up_to_1000_tk_visa_mastercard",
      "1000_cashback",
    ],
  },
  "under-999-deals": {
    label: "Under 999 Deals",
    icon: "🧾",
    defaultSort: "priceLow",
    maxPrice: 999,
  },
  "get-points-save-more": {
    label: "Get Points Save More",
    icon: "🏆",
    defaultSort: "position",
    mode: "custom",
  },
};

export default function TagPageClient({ slug }) {
  const router = useRouter();

  const config = TAG_CONFIG[slug] || {
    label: slug.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    icon: "🏷️",
    defaultSort: "newest",
    mode: "productTag",
    // try both space-separated and hyphenated forms; backend regex handles case
    tagValue: slug.replace(/-/g, " "),
  };

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);
  const [sortOption, setSortOption] = useState(
    config.defaultSort || "position",
  );
  const [activeFilters, setActiveFilters] = useState({
    priceRange: [0, 0],
    expandedSubIds: new Set(),
    brands: new Set(),
    minRating: null,
  });

  useEffect(() => {
    const updateViewport = () => setIsMobileView(window.innerWidth < 640);
    updateViewport();
    window.addEventListener("resize", updateViewport);
    return () => window.removeEventListener("resize", updateViewport);
  }, []);

  useEffect(() => {
    if (!slug) return;
    setSortOption(config.defaultSort || "position");
    setShowAll(false);
    setShowMobileFilters(false);
    setActiveFilters({
      priceRange: [0, 0],
      expandedSubIds: new Set(),
      brands: new Set(),
      minRating: null,
    });
    setLoading(true);

    (async () => {
      try {
        let query = "limit=500";

        if (config.mode !== "custom" && config.mode !== "productTag") {
          if (config.flag) query += `&flag=${encodeURIComponent(config.flag)}`;
          if (config.maxPrice != null)
            query += `&maxPrice=${encodeURIComponent(String(config.maxPrice))}`;
        }

        let items = [];

        if (config.mode === "productTag") {
          const resp = await fetch(
            `${API}/api/products?${query}&tag=${encodeURIComponent(config.tagValue)}`,
          );
          const json = await resp.json();
          items = (json.items || []).map((p) => ({
            ...p,
            price: getDisplayPrice(p).price,
          }));
          // fallback: try slug form (with hyphens) if no results
          if (items.length === 0 && config.tagValue !== slug) {
            const resp2 = await fetch(
              `${API}/api/products?${query}&tag=${encodeURIComponent(slug)}`,
            );
            const json2 = await resp2.json();
            items = (json2.items || []).map((p) => ({
              ...p,
              price: getDisplayPrice(p).price,
            }));
          }
        } else if (
          config.mode !== "custom" &&
          Array.isArray(config.badgeAliases) &&
          config.badgeAliases.length > 0
        ) {
          const seen = new Set();
          for (const badgeName of config.badgeAliases) {
            const resp = await fetch(
              `${API}/api/products?${query}&badge=${encodeURIComponent(badgeName)}`,
            );
            const json = await resp.json();
            (json.items || []).forEach((p) => {
              const id = String(p._id || p.id || "");
              if (id && !seen.has(id)) {
                seen.add(id);
                items.push({ ...p, price: getDisplayPrice(p).price });
              }
            });
          }
        } else {
          if (config.mode !== "custom" && config.badge) {
            query += `&badge=${encodeURIComponent(config.badge)}`;
          }
          const resp = await fetch(`${API}/api/products?${query}`);
          const json = await resp.json();
          items = (json.items || []).map((p) => ({
            ...p,
            price: getDisplayPrice(p).price,
          }));
        }

        if (config.mode === "custom" && slug === "get-points-save-more") {
          items = items.filter((p) => Number(p.rewardPoints || 0) > 0);
        }

        setProducts(items);
      } catch (err) {
        console.error(err);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  const filtered = useMemo(() => {
    const { priceRange, brands, minRating } = activeFilters;
    return products.filter((p) => {
      const pr = getDisplayPrice(p).price;
      if (pr < priceRange[0] || pr > priceRange[1]) return false;
      if (brands.size > 0 && (!p.department || !brands.has(p.department)))
        return false;
      if (minRating !== null && (p.averageRating || 0) < minRating)
        return false;
      return true;
    });
  }, [products, activeFilters]);

  const sorted = useMemo(() => {
    const list = [...filtered];
    switch (sortOption) {
      case "newest":
        list.sort(
          (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0),
        );
        break;
      case "oldest":
        list.sort(
          (a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0),
        );
        break;
      case "nameAsc":
        list.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
        break;
      case "nameDesc":
        list.sort((a, b) => (b.title || "").localeCompare(a.title || ""));
        break;
      case "priceHigh":
        list.sort(
          (a, b) => getDisplayPrice(b).price - getDisplayPrice(a).price,
        );
        break;
      case "priceLow":
        list.sort(
          (a, b) => getDisplayPrice(a).price - getDisplayPrice(b).price,
        );
        break;
      default:
        break;
    }
    return list;
  }, [filtered, sortOption]);

  const displayed = showAll ? sorted : sorted.slice(0, 20);

  return (
    <div className="bg-white min-h-screen">
      {/* Back */}
      <div className="max-w-7xl mx-auto px-2 pt-4">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 transition mb-2"
        >
          ‹ Back
        </button>
      </div>

      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-2 mb-4 text-sm text-gray-500">
        <Link href="/" className="hover:underline">
          Home
        </Link>
        {" > "}
        <span className="text-gray-900 font-medium">{config.label}</span>
      </div>

      {/* Page title */}
      <div className="max-w-7xl mx-auto px-2 mb-2">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
          {config.icon} {config.label}
        </h1>
        {!loading && (
          <p className="text-sm text-gray-500 mt-1">
            {products.length} products found
          </p>
        )}
      </div>

      <AdSlot page="categoryPage" className="max-w-7xl mx-auto px-2 py-3" />

      {/* Main layout */}
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-6">
        {loading ? (
          <div className="py-32 text-center text-gray-400 text-lg">
            Loading products…
          </div>
        ) : products.length === 0 ? (
          <div className="py-32 text-center text-gray-400 text-lg">
            No {config.label} products right now. Check back soon!
          </div>
        ) : (
          <div className="grid grid-cols-12 gap-6">
            {/* Mobile filter/sort bar */}
            <div className="col-span-12 lg:hidden sticky top-16 z-30 bg-white py-2 -mt-2 mb-2">
              <div className="grid grid-cols-[auto_1fr_auto] gap-2 items-center rounded-lg bg-[#FCECF2] p-2">
                <button
                  onClick={() => setShowMobileFilters(true)}
                  className="h-9 w-9 rounded-md border border-rose-200 bg-white flex items-center justify-center"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                  </svg>
                </button>
                <SortDropdown
                  value={sortOption}
                  onChange={(v) => {
                    setSortOption(v);
                    setShowAll(false);
                  }}
                  className="w-full"
                />
                <div className="h-9 min-w-12 px-2 rounded-md border border-rose-200 bg-white flex items-center justify-center text-sm text-gray-700">
                  {sorted.length}
                </div>
              </div>
            </div>

            {/* Mobile filter drawer */}
            {showMobileFilters && (
              <div className="fixed inset-0 z-50 lg:hidden">
                <button
                  className="absolute inset-0 bg-black/35"
                  onClick={() => setShowMobileFilters(false)}
                  aria-label="Close"
                />
                <div className="absolute left-0 top-0 h-full w-[85%] max-w-85 bg-white shadow-xl overflow-y-auto p-4">
                  <button
                    onClick={() => setShowMobileFilters(false)}
                    className="absolute top-3 right-3 h-8 w-8 bg-rose-500 text-white rounded-sm flex items-center justify-center"
                  >
                    ✕
                  </button>
                  <div className="pt-2">
                    <ProductFilters
                      products={products}
                      subcategories={[]}
                      onChange={(f) => {
                        setActiveFilters(f);
                        setShowAll(false);
                      }}
                      sticky={false}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Desktop filter sidebar */}
            <div className="hidden lg:block col-span-3">
              <ProductFilters
                products={products}
                subcategories={[]}
                onChange={(f) => {
                  setActiveFilters(f);
                  setShowAll(false);
                }}
              />
            </div>

            {/* Products grid */}
            <div className="col-span-12 lg:col-span-9">
              <div className="hidden lg:flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-800">
                  All Products
                </h2>
                <SortDropdown
                  value={sortOption}
                  onChange={(v) => {
                    setSortOption(v);
                    setShowAll(false);
                  }}
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-4">
                {displayed.map((p) => (
                  <ProductCard
                    key={p._id}
                    product={p}
                    showDiscount={true}
                    maxTags={2}
                    imageHeight={isMobileView ? 160 : 200}
                  />
                ))}
              </div>

              {sorted.length > 20 && (
                <div className="mt-8 flex justify-center">
                  <button
                    onClick={() => setShowAll((s) => !s)}
                    className="px-6 py-2.5 bg-white border border-gray-300 rounded-full text-sm font-medium hover:bg-gray-50 transition"
                  >
                    {showAll
                      ? "Show less"
                      : `Show all ${sorted.length} products`}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
