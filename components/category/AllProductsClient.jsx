"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ProductCard from "@/components/product/ProductCard";
import ProductFilters from "@/components/product/ProductFilters";
import SortDropdown from "@/components/product/SortDropdown";
import Link from "next/link";
import { getDisplayPrice } from "@/lib/pricing";
import AdSlot from "@/components/ui/AdSlot";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const PRODUCTS_PER_PAGE = 20;

export default function AllProductsClient() {
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [productsLoadedOnce, setProductsLoadedOnce] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);
  const [sortOption, setSortOption] = useState("position");
  const [activeFilters, setActiveFilters] = useState({
    priceRange: [0, 0],
    expandedSubIds: new Set(),
    brands: new Set(),
    minRating: null,
  });

  useEffect(() => {
    const update = () => setIsMobileView(window.innerWidth < 640);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoadingProducts(true);
      try {
        const params = new URLSearchParams();
        params.set("page", String(currentPage));
        params.set("limit", String(PRODUCTS_PER_PAGE));
        params.set("sort", sortOption);

        if (
          activeFilters.expandedSubIds &&
          activeFilters.expandedSubIds.size > 0
        ) {
          params.set(
            "categoryId",
            Array.from(activeFilters.expandedSubIds).join(","),
          );
        }

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

    load();
  }, [currentPage, sortOption, activeFilters]);

  const totalPages = Math.max(1, Math.ceil(totalProducts / PRODUCTS_PER_PAGE));

  return (
    <>
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-8">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-2 transition"
        >
          <span className="text-xs">‹</span> Back
        </button>

        <div className="text-sm text-gray-500 mb-4">
          <Link href="/" className="hover:underline">
            Home
          </Link>{" "}
          &gt; <span className="text-gray-900">All Products</span>
        </div>

        <div className="mb-3 text-center">
          <h1 className="text-2xl md:text-4xl font-bold text-gray-900">
            All Products
          </h1>
          <p className="text-gray-600 mt-2">
            Browse our complete variety of collections
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-2 py-2">
        <AdSlot page="allProductsPage" className="w-full" />
      </div>

      <div className="bg-[#FFF5ED] w-full">
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
                  <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
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
                {totalProducts > 0 ? totalProducts : "—"}
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
                    subcategories={[]}
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

          {/* Filter + Products grid */}
          <div className="grid grid-cols-12 gap-4 pt-0 lg:pt-4">
            <div className="hidden lg:block col-span-12 lg:col-span-3">
              <ProductFilters
                products={products}
                subcategories={[]}
                onChange={(f) => {
                  setActiveFilters(f);
                  setCurrentPage(1);
                }}
              />
            </div>

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
                    <h2 className="text-xl md:text-2xl font-semibold text-gray-800">
                      Products
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
                    <h2 className="text-xl font-semibold text-gray-800">
                      Products
                    </h2>
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

                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(
                      (page) =>
                        page === 1 ||
                        page === totalPages ||
                        Math.abs(page - currentPage) <= 1,
                    )
                    .map((page, index, arr) => (
                      <React.Fragment key={page}>
                        {index > 0 && arr[index - 1] !== page - 1 && (
                          <span className="px-1 text-gray-400">…</span>
                        )}
                        <button
                          type="button"
                          onClick={() => setCurrentPage(page)}
                          className={`px-3 py-1.5 border rounded-md text-sm ${
                            page === currentPage
                              ? "bg-rose-600 text-white border-rose-600"
                              : "bg-white"
                          }`}
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
