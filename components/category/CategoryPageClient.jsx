"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import ProductCard from "@/components/product/ProductCard";
import ProductFilters from "@/components/product/ProductFilters";
import SortDropdown from "@/components/product/SortDropdown";
import Link from "next/link";
import { useUser } from "@/components/context/UserContext";
import { useCategories } from "@/components/context/CategoryContext";
import Image from "next/image";
import { getDisplayPrice } from "@/lib/pricing";
import AdSlot from "@/components/ui/AdSlot";

const API = process.env.NEXT_PUBLIC_API_URL || "https://api.pickob.com";
const PRODUCTS_PER_PAGE = 20;

export default function CategoryPageClient({
  slug,
  parentSlug = null,
  initialCategory = null,
  initialParentCategory = null,
  initialImmediateChildren = [],
  initialCategoryIdsParam = "",
  initialProducts = [],
  initialTotalProducts = 0,
  initialBestSelling = [],
}) {
  const router = useRouter();
  const {
    getCategoryBySlug,
    getCategoryBySlugAndParentSlug,
    categoriesMap,
    getSubcategories,
    refreshedOnce: categoriesRefreshedOnce,
  } = useCategories();
  // The build-time page.js only hands us initial* data for the exact slug it
  // pre-rendered — true whenever this is a static page served directly
  // (not the __placeholder__ shell), which is the vast majority of visits.
  const hasInitialData = Boolean(initialCategory && initialCategory.slug === slug);
  // Tracks which category's best-selling strip + product grid are currently
  // loaded. CategoryContext always refetches once in the background (even
  // when seeded, to pick up categories added after the last build), which
  // changes `categoriesMap`'s reference and re-runs the effect below — this
  // lets that re-run recognize "same category, nothing to do" instead of
  // flashing a loading state over data we already have.
  const initializedCategoryIdRef = useRef(
    hasInitialData ? String(initialCategory._id) : null,
  );
  // The product-grid effect always live-fetches on mount too (even when we
  // already have build-time initialProducts) so edits/deletes made after the
  // last build show up without a full static rebuild — see the "Updating
  // products..." indicator below, which covers this fetch without flashing
  // the full skeleton over data we already have.
  // Distinguishes "route actually changed" from "effect re-ran because
  // categoriesMap's reference changed" (see the product-fetch effect).
  const lastRouteKeyRef = useRef(
    hasInitialData ? `${parentSlug || ""}/${slug}` : null,
  );

  const [category, setCategory] = useState(initialCategory);
  // True once a live CategoryContext refresh has confirmed this category no
  // longer exists (e.g. deleted from the dashboard after this static page
  // was built) — distinct from just "not resolved yet".
  const [categoryGone, setCategoryGone] = useState(false);
  const [parentCategory, setParentCategory] = useState(initialParentCategory);
  const [subcategories, setSubcategories] = useState([]);
  const [immediateChildren, setImmediateChildren] = useState(
    initialImmediateChildren,
  );
  const [descendantMap, setDescendantMap] = useState(new Map());
  const [isSubcategoryPage, setIsSubcategoryPage] = useState(
    Boolean(initialCategory?.parent),
  );
  const [products, setProducts] = useState(() =>
    initialProducts.map((p) => ({ ...p, price: getDisplayPrice(p).price })),
  );
  const [totalProducts, setTotalProducts] = useState(initialTotalProducts);
  const [currentPage, setCurrentPage] = useState(1);
  const [categoryIdsParam, setCategoryIdsParam] = useState(
    initialCategoryIdsParam,
  );
  const [bestSelling, setBestSelling] = useState(initialBestSelling);
  const [loadingBestSelling, setLoadingBestSelling] = useState(
    !hasInitialData,
  );
  const [loadingProducts, setLoadingProducts] = useState(!hasInitialData);
  const [productsLoadedOnce, setProductsLoadedOnce] = useState(hasInitialData);
  const [showAllSubcategories, setShowAllSubcategories] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [subcategoryVisibleCount, setSubcategoryVisibleCount] = useState(8);
  const [isMobileView, setIsMobileView] = useState(false);
  const [bestSellingStartIndex, setBestSellingStartIndex] = useState(0);
  const [bestSellingPerView, setBestSellingPerView] = useState(1);
  const [sortOption, setSortOption] = useState("position");
  const [activeFilters, setActiveFilters] = useState({
    priceRange: [0, 0],
    expandedSubIds: new Set(),
    brands: new Set(),
    minRating: null,
  });

  useEffect(() => {
    const updateResponsiveState = () => {
      const width = window.innerWidth;
      setSubcategoryVisibleCount(width >= 768 ? 12 : 8);
      setIsMobileView(width < 640);

      if (width >= 1280) setBestSellingPerView(5);
      else if (width >= 1024) setBestSellingPerView(4);
      else if (width >= 768) setBestSellingPerView(3);
      else setBestSellingPerView(2);
    };

    updateResponsiveState();
    window.addEventListener("resize", updateResponsiveState);
    return () => window.removeEventListener("resize", updateResponsiveState);
  }, []);

  // Silently revalidate the best-selling strip against the live API once on
  // mount when we started from build-time data — badge/price changes made
  // after the last build wouldn't otherwise show up (the effect below skips
  // this same fetch on its first run since initializedCategoryIdRef already
  // matches). Runs in the background; no loading state, so nothing flickers.
  useEffect(() => {
    if (!hasInitialData) return;
    let cancelled = false;
    (async () => {
      try {
        const bestResp = await fetch(
          `${API}/api/products?categoryId=${encodeURIComponent(initialCategoryIdsParam)}&badge=best_seller&page=1&limit=50`,
        );
        const bestJson = await bestResp.json();
        const catBest = bestJson.items || [];
        if (cancelled) return;
        if (catBest.length > 0) {
          setBestSelling(catBest);
        } else {
          const globalResp = await fetch(
            `${API}/api/products?badge=best_seller&page=1&limit=50`,
          ).catch(() => null);
          const globalJson = globalResp
            ? await globalResp.json().catch(() => ({}))
            : {};
          if (!cancelled) setBestSelling(globalJson.items || []);
        }
      } catch {}
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // fetch products using category from context
  useEffect(() => {
    if (!slug) return;
    // This effect also re-runs whenever CategoryContext's background
    // refresh changes `categoriesMap`'s reference, with the *same* route —
    // only reset sort/page/filters on an actual navigation, so that refresh
    // can't silently discard a user's in-progress filter/sort/page choice.
    const routeKey = `${parentSlug || ""}/${slug}`;
    const isNewRoute = lastRouteKeyRef.current !== routeKey;
    lastRouteKeyRef.current = routeKey;

    if (isNewRoute) {
      setSortOption("position");
      setCurrentPage(1);
      setShowAllSubcategories(false);
      setShowMobileFilters(false);
      setBestSellingStartIndex(0);
      setActiveFilters({
        priceRange: [0, 0],
        expandedSubIds: new Set(),
        brands: new Set(),
        minRating: null,
      });
    }
    (async () => {
      let shouldLoadProducts = false;
      try {
        // Get category from context instead of fetching
        let match = parentSlug
          ? getCategoryBySlugAndParentSlug(slug, parentSlug)
          : getCategoryBySlug(slug);

        if (!match) {
          // Don't wipe out data we already have (e.g. from the server-
          // rendered initial props) just because context hasn't resolved
          // this slug yet on some re-run — only show the bare fallback if
          // we truly have nothing.
          if (initializedCategoryIdRef.current === null) {
            setCategory({ name: slug, description: "" });
            setSubcategories([]);
            setImmediateChildren([]);
            setDescendantMap(new Map());
            setProducts([]);
            setBestSelling([]);
            setCategoryIdsParam("");
            setIsSubcategoryPage(false);
            setLoadingBestSelling(false);
            setLoadingProducts(false);
          } else if (categoriesRefreshedOnce) {
            // We had a real category (from build-time data), and a live
            // refresh has now actually confirmed it's no longer in the
            // taxonomy — e.g. deleted from the dashboard after this static
            // page was built. Only trust this once refreshedOnce is true, so
            // a network hiccup can't make a still-live category look gone.
            setCategoryGone(true);
            setLoadingBestSelling(false);
            setLoadingProducts(false);
          }
          return;
        }
        setCategoryGone(false);

        setCategory(match);

        // Get immediate children for round shape display
        const immediateChildrenList = getSubcategories(match._id);
        setImmediateChildren(immediateChildrenList);

        // Build flat descendant list with depth for filter sidebar
        const collectAllDescendants = (catId, depth = 0) => {
          const results = [];
          const children = getSubcategories(catId);
          children.forEach((child) => {
            results.push({ _id: child._id, name: child.name, depth });
            results.push(...collectAllDescendants(child._id, depth + 1));
          });
          return results;
        };
        setSubcategories(collectAllDescendants(match._id));

        // Build descendant map: id → Set<all descendant ids + self>
        const buildDescendantMap = (rootId) => {
          const map = new Map();
          const processNode = (nodeId) => {
            const children = getSubcategories(nodeId);
            const nodeSet = new Set([String(nodeId)]);
            children.forEach((child) => {
              processNode(child._id);
              (
                map.get(String(child._id)) || new Set([String(child._id)])
              ).forEach((id) => nodeSet.add(id));
            });
            map.set(String(nodeId), nodeSet);
          };
          processNode(rootId);
          return map;
        };
        setDescendantMap(buildDescendantMap(match._id));

        // determine if this category has a parent
        setIsSubcategoryPage(Boolean(match.parent));
        if (match.parent && categoriesMap[match.parent]) {
          setParentCategory(categoriesMap[match.parent]);
        } else {
          setParentCategory(null);
        }

        // gather all descendant category ids (include self)
        const collectIds = (catId) => {
          let ids = [String(catId)];
          const children = getSubcategories(catId);
          children.forEach((c) => (ids = ids.concat(collectIds(c._id))));
          return ids;
        };
        const ids = collectIds(match._id);
        const param = ids.join(",");
        setCategoryIdsParam(param);

        // If this is the same category we already have best-selling +
        // product data for (either from the server-rendered initial props,
        // or from a previous run of this effect), there's nothing new to
        // fetch — this branch mainly exists to survive CategoryContext's
        // background refresh re-running this effect with an unchanged match.
        if (initializedCategoryIdRef.current === String(match._id)) {
          return;
        }
        initializedCategoryIdRef.current = String(match._id);
        shouldLoadProducts = true;
        setTotalProducts(0);
        setLoadingProducts(true);
        setProductsLoadedOnce(false);
        setLoadingBestSelling(true);

        // Best-selling strip — try category-specific first, fall back to global
        const bestResp = await fetch(
          `${API}/api/products?categoryId=${encodeURIComponent(param)}&badge=best_seller&page=1&limit=50`,
        );
        const bestJson = await bestResp.json();
        const catBest = bestJson.items || [];
        if (catBest.length > 0) {
          setBestSelling(catBest);
        } else {
          // fallback: show all best-sellers site-wide (badge only, no category filter)
          const globalResp = await fetch(
            `${API}/api/products?badge=best_seller&page=1&limit=50`,
          ).catch(() => null);
          const globalJson = globalResp
            ? await globalResp.json().catch(() => ({}))
            : {};
          setBestSelling(globalJson.items || []);
        }
        setLoadingBestSelling(false);
      } catch (err) {
        console.error(err);
        setProducts([]);
        setBestSelling([]);
        setLoadingBestSelling(false);
        setLoadingProducts(false);
      } finally {
        if (!shouldLoadProducts) {
          setLoadingProducts(false);
        }
      }
    })();
  }, [
    slug,
    parentSlug,
    getCategoryBySlug,
    getCategoryBySlugAndParentSlug,
    categoriesMap,
    getSubcategories,
    categoriesRefreshedOnce,
  ]);

  // Update document title, meta description, canonical link, and inject
  // BreadcrumbList JSON-LD client-side — the static export ships a generic
  // placeholder shell, so we patch in the real category values once loaded.
  useEffect(() => {
    if (!category?.name) return;
    const prevTitle = document.title;
    document.title = `${category.name} | Pickob`;

    const descContent =
      category.description ||
      `Browse ${category.name} at Pickob — gadgets and electronics with best prices and fast delivery across Bangladesh.`;
    let metaDesc = document.querySelector('meta[name="description"]');
    const prevDesc = metaDesc?.getAttribute("content");
    if (!metaDesc) {
      metaDesc = document.createElement("meta");
      metaDesc.setAttribute("name", "description");
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute("content", descContent);

    const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://pickob.com";
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    const categoryPath = parentSlug ? `${parentSlug}/${slug}` : slug;
    canonical.setAttribute("href", `${SITE_URL}/category/${categoryPath}`);

    const breadcrumbSchema = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
        ...(parentCategory
          ? [
              {
                "@type": "ListItem",
                position: 2,
                name: parentCategory.name,
                item: `${SITE_URL}/category/${parentCategory.slug || (parentCategory.name || "").toLowerCase().replace(/\s+/g, "-")}`,
              },
            ]
          : []),
        {
          "@type": "ListItem",
          position: parentCategory ? 3 : 2,
          name: category.name,
          item: `${SITE_URL}/category/${parentSlug ? `${parentSlug}/${slug}` : slug}`,
        },
      ],
    };
    const existing = document.getElementById("category-jsonld");
    if (existing) existing.remove();
    const script = document.createElement("script");
    script.id = "category-jsonld";
    script.type = "application/ld+json";
    script.textContent = JSON.stringify(breadcrumbSchema);
    document.head.appendChild(script);

    return () => {
      document.title = prevTitle;
      if (metaDesc && prevDesc !== undefined)
        metaDesc.setAttribute("content", prevDesc || "");
      script.remove();
    };
  }, [category, parentCategory, slug]);

  useEffect(() => {
    if (!categoryIdsParam) return;

    const loadProducts = async () => {
      setLoadingProducts(true);
      try {
        const params = new URLSearchParams();
        params.set("page", String(currentPage));
        params.set("limit", String(PRODUCTS_PER_PAGE));
        params.set("sort", sortOption);

        const selectedCategoryIds =
          activeFilters.expandedSubIds && activeFilters.expandedSubIds.size > 0
            ? Array.from(activeFilters.expandedSubIds).join(",")
            : categoryIdsParam;
        params.set("categoryId", selectedCategoryIds);

        if (Array.isArray(activeFilters.priceRange)) {
          const [minPrice, maxPrice] = activeFilters.priceRange;
          if (minPrice || maxPrice) {
            params.set("minPrice", String(minPrice));
            params.set("maxPrice", String(maxPrice));
          }
        }

        if (activeFilters.brands && activeFilters.brands.size > 0) {
          params.set("brand", Array.from(activeFilters.brands).join(","));
        }

        if (
          activeFilters.minRating !== null &&
          activeFilters.minRating !== undefined
        ) {
          params.set("minRating", String(activeFilters.minRating));
        }

        const response = await fetch(
          `${API}/api/products?${params.toString()}`,
        );
        const json = await response.json();

        if (!response.ok)
          throw new Error(json.error || "Failed to load products");

        const items = (json.items || []).map((p) => ({
          ...p,
          price: getDisplayPrice(p).price,
        }));

        setProducts(items);
        setTotalProducts(Number(json.total || 0));
        setProductsLoadedOnce(true);
      } catch (err) {
        console.error(err);
        setProducts([]);
        setTotalProducts(0);
        setProductsLoadedOnce(true);
      } finally {
        setLoadingProducts(false);
      }
    };

    loadProducts();
  }, [categoryIdsParam, currentPage, sortOption, activeFilters]);

  const visibleSubcategories = useMemo(() => {
    return showAllSubcategories
      ? immediateChildren
      : immediateChildren.slice(0, subcategoryVisibleCount);
  }, [showAllSubcategories, immediateChildren, subcategoryVisibleCount]);

  const { user } = useUser();
  const totalPages = Math.max(1, Math.ceil(totalProducts / PRODUCTS_PER_PAGE));
  const maxBestSellingStart = Math.max(
    0,
    bestSelling.length - bestSellingPerView,
  );
  const canSlideBestSelling = bestSelling.length > bestSellingPerView;
  const visibleBestSelling = bestSelling.slice(
    bestSellingStartIndex,
    bestSellingStartIndex + bestSellingPerView,
  );

  useEffect(() => {
    setBestSellingStartIndex((prev) => Math.min(prev, maxBestSellingStart));
  }, [maxBestSellingStart]);

  if (categoryGone) {
    return (
      <div className="py-24 text-center">
        <p className="text-red-600 text-lg font-semibold">
          Category not found
        </p>
        <p className="text-gray-500 mt-2 text-sm">
          This category may have been removed or is unavailable.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-7xl mx-auto px-2 sm:px-2 lg:px-8 py-8">
        {/* Back button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-2 transition"
        >
          <span className="text-xs">‹</span> Back
        </button>
        {/* Breadcrumb & header */}
        <div className="text-sm text-gray-500 mb-4">
          <Link href="/" className="hover:underline">
            Home
          </Link>
          {category && category.name ? (
            <>
              {" "}
              &gt;
              {parentCategory ? (
                <>
                  <Link
                    href={`/category/${parentCategory.slug || (parentCategory.name || "").toLowerCase().replace(/\s+/g, "-")}/`}
                    className="hover:underline"
                  >
                    {parentCategory.name}
                  </Link>{" "}
                  &gt; <span className="text-gray-900">{category.name}</span>
                </>
              ) : (
                <span className="text-gray-900">{category.name}</span>
              )}
            </>
          ) : null}
        </div>
        <div className="mb-3 text-center">
          <h1 className="text-2xl md:text-4xl font-bold text-gray-900">
            {category?.name || slug}
          </h1>
          <p className="text-gray-600 mt-2 max-w-4xl mx-auto">
            {category?.description || `Products for ${category?.name || slug}.`}
          </p>
        </div>

        {/* Subcategory circles - show at any level that has children */}
        {immediateChildren.length > 0 && (
          <>
            <div className="grid grid-cols-4 md:grid-cols-6 gap-2 md:gap-4 justify-items-center ">
              {visibleSubcategories.map((sub) => {
                const sslug =
                  sub.slug ||
                  (sub.name || "").toLowerCase().replace(/\s+/g, "-");
                return (
                  <div
                    key={sub._id}
                    className="relative flex flex-col items-center w-full max-w-[92px] md:max-w-[110px]"
                  >
                    <Link
                      href={`/category/${category.slug}/${sslug}/`}
                      className="flex flex-col items-center group cursor-pointer w-full"
                    >
                      <div className="w-18 h-18 md:w-34 md:h-34 lg:w-38 lg:h-38 rounded-full bg-[#FFF5ED] border-4 border-white shadow-md flex items-center justify-center overflow-hidden group-hover:scale-105 transition-transform">
                        <Image
                          src={
                            sub.images && sub.images[0] && sub.images[0].url
                              ? sub.images[0].url
                              : "/assets/placeholder.svg"
                          }
                          alt={sub.name}
                          width={80}
                          height={80}
                          className="w-24 h-24 md:w-38 md:h-38 lg:w-42 lg:h-42 object-contain"
                        />
                      </div>
                      <div className="mt-2 text-xs md:text-sm text-center font-medium text-gray-700 hover:text-rose-600 line-clamp-2">
                        {sub.name}
                      </div>
                    </Link>
                  </div>
                );
              })}
            </div>

            {immediateChildren.length > subcategoryVisibleCount && (
              <div className="flex justify-center mb-8">
                <button
                  className="px-4 py-2  border border-b-red-600  rounded-md text-sm"
                  onClick={() => setShowAllSubcategories((s) => !s)}
                >
                  {showAllSubcategories
                    ? "Show less"
                    : `+ Show all (${immediateChildren.length})`}
                </button>
              </div>
            )}
          </>
        )}

        {/* Best Selling section sits full width above filter/product flex */}
        {(loadingBestSelling || bestSelling.length > 0) && (
          <div className="mb-6 mt-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl md:text-3xl font-semibold">
                Best Selling
              </h2>
              <Link
                href="/tag/best-seller"
                className="px-4 py-2 border border-rose-300 rounded-full text-sm hover:bg-[#FFF5ED]"
              >
                see all →
              </Link>
            </div>

            {loadingBestSelling ? (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 ">
                {Array(5)
                  .fill(0)
                  .map((_, i) => (
                    <ProductCard key={i} loading={true} />
                  ))}
              </div>
            ) : (
              <div className="relative pt-8 pb-3">
                {canSlideBestSelling && (
                  <>
                    <button
                      type="button"
                      onClick={() =>
                        setBestSellingStartIndex((i) => Math.max(0, i - 1))
                      }
                      disabled={bestSellingStartIndex === 0}
                      className="absolute left-2 top-0 z-10 h-6 w-6 md:h-8 md:w-8 rounded-full border  bg-red-600 text-white shadow-sm disabled:opacity-40"
                      aria-label="Previous best selling products"
                    >
                      ‹
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setBestSellingStartIndex((i) =>
                          Math.min(maxBestSellingStart, i + 1),
                        )
                      }
                      disabled={bestSellingStartIndex >= maxBestSellingStart}
                      className="absolute right-2 top-0 z-10 h-6 w-6 md:h-8 md:w-8 rounded-full border  bg-red-600 text-white shadow-sm disabled:opacity-40"
                      aria-label="Next best selling products"
                    >
                      ›
                    </button>
                  </>
                )}

                <div className="min-w-0 grid gap-4 grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                  {visibleBestSelling.map((p) => (
                    <ProductCard
                      key={p._id}
                      product={p}
                      imageWidth={360}
                      imageHeight={160}
                      showDiscount={true}
                      maxTags={2}
                      showActionsOnHover={true}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="max-w-7xl mx-auto px-2 py-2">
        <AdSlot page="categoryPage" className="w-full" />
      </div>

      {/* wide background across viewport */}
      <div className="bg-[#FFF5ED] w-full -mt-6 md:mt-0">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-8">
          {/* Mobile sticky filter/sort bar */}
          <div className="lg:hidden sticky top-16 z-30 bg-[#FFF5ED] py-2 mb-3 shadow-2xl">
            <div className="grid grid-cols-[auto_1fr_auto] gap-2 items-center rounded-lg bg-[#FCECF2] p-2">
              <button
                type="button"
                onClick={() => setShowMobileFilters(true)}
                className="h-9 w-9 rounded-md border border-rose-200 bg-white flex items-center justify-center"
                aria-label="Open filters"
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
                  <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
                </svg>
              </button>

              <SortDropdown
                value={sortOption}
                onChange={(value) => {
                  setSortOption(value);
                  setCurrentPage(1);
                }}
                className="w-full"
              />

              <div className="h-9 min-w-[48px] px-2 rounded-md border border-rose-200 bg-white flex items-center justify-center text-sm text-gray-700">
                20
              </div>
            </div>
          </div>

          {/* Mobile filter drawer */}
          {showMobileFilters && (
            <div className="fixed inset-0 z-50 lg:hidden">
              <button
                type="button"
                className="absolute inset-0 bg-black/35"
                onClick={() => setShowMobileFilters(false)}
                aria-label="Close filters"
              />
              <div className="absolute left-0 top-0 h-full w-[85%] max-w-[340px] bg-white shadow-xl overflow-y-auto p-4">
                <button
                  type="button"
                  onClick={() => setShowMobileFilters(false)}
                  className="absolute top-3 right-3 h-8 w-8 bg-rose-500 text-white rounded-sm flex items-center justify-center"
                  aria-label="Close filters panel"
                >
                  ✕
                </button>

                <div className="pt-2">
                  <ProductFilters
                    products={products}
                    subcategories={subcategories}
                    descendantMap={descendantMap}
                    onChange={(f) => {
                      setActiveFilters(f);
                      setCurrentPage(1);
                    }}
                    sticky={false}
                  />
                </div>
              </div>
            </div>
          )}

          {/* product/filter grid below best-selling */}
          <div className="grid grid-cols-12 gap-4 pt-0 lg:pt-12 ">
            {/* Filters occupy 4/12 columns */}
            <div className="hidden lg:block col-span-12 lg:col-span-3">
              <ProductFilters
                products={products}
                subcategories={subcategories}
                descendantMap={descendantMap}
                onChange={(f) => {
                  setActiveFilters(f);
                  setCurrentPage(1);
                }}
              />
            </div>
            {/* Products occupy 8/12 columns */}
            <div className="col-span-12 lg:col-span-9">
              {!productsLoadedOnce && loadingProducts ? (
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {Array(8)
                    .fill(0)
                    .map((_, i) => (
                      <ProductCard key={i} loading={true} />
                    ))}
                </div>
              ) : products.length > 0 ? (
                <>
                  <div className="hidden lg:flex items-center justify-between mb-3">
                    <h2 className="text-xl md:text-3xl font-semibold mt-0 mb-3">
                      All Products
                    </h2>
                    <SortDropdown
                      value={sortOption}
                      onChange={(value) => {
                        setSortOption(value);
                        setCurrentPage(1);
                      }}
                    />
                  </div>

                  <div className="lg:hidden mb-3">
                    <h2 className="text-xl font-semibold mt-0">All Products</h2>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-4">
                    {products.map((p) => (
                      <ProductCard
                        key={p._id}
                        product={p}
                        showDiscount={true}
                        maxTags={2}
                        imageHeight={isMobileView ? 160 : 200}
                      />
                    ))}
                  </div>

                  {loadingProducts && (
                    <div className="mt-4 text-center text-sm text-gray-500">
                      Updating products...
                    </div>
                  )}
                </>
              ) : (
                <div className="py-16 text-center text-gray-500">
                  No products found.
                </div>
              )}

              {!loadingProducts && totalPages > 1 && (
                <div className="mt-8 flex items-center justify-center gap-2 flex-wrap">
                  <button
                    type="button"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="px-3 py-1.5 bg-white border rounded-md text-sm disabled:opacity-50"
                  >
                    Prev
                  </button>

                  {Array.from({ length: totalPages }, (_, index) => index + 1)
                    .filter(
                      (page) =>
                        page === 1 ||
                        page === totalPages ||
                        Math.abs(page - currentPage) <= 1,
                    )
                    .map((page, index, arr) => (
                      <React.Fragment key={page}>
                        {index > 0 && arr[index - 1] !== page - 1 ? (
                          <span className="px-1 text-gray-400">…</span>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => setCurrentPage(page)}
                          className={`px-3 py-1.5 border rounded-md text-sm ${page === currentPage ? "bg-rose-600 text-white border-rose-600" : "bg-white"}`}
                        >
                          {page}
                        </button>
                      </React.Fragment>
                    ))}

                  <button
                    type="button"
                    disabled={currentPage === totalPages}
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                    className="px-3 py-1.5 bg-white border rounded-md text-sm disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
