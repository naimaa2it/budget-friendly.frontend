"use client";

import { useCompare } from "@/components/context/CompareContext";
import Image from "next/image";
import Link from "next/link";
import { FaTimes, FaCheck, FaStar } from "react-icons/fa";
import { useCart } from "@/components/context/CartContext";

const ROWS = [
  {
    key: "price",
    label: "Price",
    render: (p) => `৳${Number(p.price).toLocaleString()}`,
  },
  {
    key: "compareAtPrice",
    label: "Original Price",
    render: (p) =>
      p.compareAtPrice ? `৳${Number(p.compareAtPrice).toLocaleString()}` : "—",
  },
  {
    key: "availability",
    label: "Availability",
    render: (p) => {
      const map = {
        in_stock: "In Stock",
        out_of_stock: "Out of Stock",
        pre_order: "Pre-Order",
      };
      return map[p.availability] || p.availability || "—";
    },
  },
  {
    key: "averageRating",
    label: "Rating",
    render: (p) =>
      p.averageRating
        ? `${Number(p.averageRating).toFixed(1)} ★ (${p.reviewCount || 0})`
        : "No reviews",
  },
  { key: "sku", label: "SKU", render: (p) => p.sku || "—" },
  {
    key: "freeShipping",
    label: "Free Shipping",
    render: (p) => (p.freeShipping ? "✓ Yes" : "✗ No"),
  },
  {
    key: "rewardPoints",
    label: "Reward Points",
    render: (p) => (p.rewardPoints ? `${p.rewardPoints} pts` : "—"),
  },
  {
    key: "category",
    label: "Category",
    render: (p) =>
      (typeof p.category === "object" ? p.category?.name : p.category) || "—",
  },
  {
    key: "warranty",
    label: "Warranty",
    render: (p) => p.warranty?.period || "—",
  },
];

export default function ComparePageClient() {
  const { compareList, removeFromCompare, clearCompare } = useCompare();
  const { addToCart } = useCart();

  if (compareList.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-24 text-center">
        <p className="text-5xl mb-4">⚖️</p>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          No products to compare
        </h1>
        <p className="text-gray-500 mb-8">
          Browse products and click the compare button to add them here.
        </p>
        <Link
          href="/"
          className="inline-block bg-gray-900 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-700 transition"
        >
          Browse Products
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-2 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Compare Products</h1>
          <p className="text-sm text-gray-500 mt-1">
            Comparing {compareList.length} product
            {compareList.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={clearCompare}
          className="text-sm text-gray-500 hover:text-red-600 underline transition"
        >
          Clear all
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
        <table className="w-full min-w-[640px] text-sm">
          {/* Product headers */}
          <thead>
            <tr className="border-b border-gray-200">
              <th className="w-40 p-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide bg-gray-50">
                Feature
              </th>
              {compareList.map((p) => {
                const img = p.images?.[0]?.url || "/assets/placeholder.svg";
                const isOutOfStock =
                  p.availability === "out_of_stock" || p.inventory === 0;
                return (
                  <th
                    key={p._id}
                    className="p-4 bg-white border-l border-gray-100 align-top min-w-[180px]"
                  >
                    <div className="relative">
                      <button
                        onClick={() => removeFromCompare(p._id)}
                        className="absolute -top-1 -right-1 w-5 h-5 bg-gray-200 hover:bg-red-500 hover:text-white rounded-full flex items-center justify-center transition"
                      >
                        <FaTimes className="w-2.5 h-2.5" />
                      </button>
                      <Link href={`/product/${p._id}`}>
                        <Image
                          src={encodeURI(img)}
                          alt={p.title}
                          width={120}
                          height={120}
                          className="w-28 h-28 object-contain mx-auto mb-2 rounded-lg border border-gray-100 p-1"
                        />
                      </Link>
                      <Link
                        href={`/product/${p._id}`}
                        className="block text-sm font-semibold text-gray-900 hover:text-red-600 transition line-clamp-2 text-center mb-2"
                      >
                        {p.title}
                      </Link>
                      <p className="text-lg font-bold text-red-600 text-center mb-3">
                        ৳{Number(p.price).toLocaleString()}
                      </p>
                      <button
                        onClick={() => addToCart(p, 1)}
                        disabled={isOutOfStock}
                        className={`w-full py-2 rounded-lg text-xs font-bold transition ${
                          isOutOfStock
                            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                            : "bg-gray-900 text-white hover:bg-gray-700"
                        }`}
                      >
                        {isOutOfStock ? "Out of Stock" : "Add to Cart"}
                      </button>
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>

          {/* Comparison rows */}
          <tbody>
            {ROWS.map((row, rowIdx) => {
              const values = compareList.map((p) => row.render(p));
              const isBest = (val) => {
                if (row.key === "price") {
                  const nums = values.map(
                    (v) => parseFloat(v.replace(/[^\d.]/g, "")) || Infinity,
                  );
                  return (
                    parseFloat(val.replace(/[^\d.]/g, "")) === Math.min(...nums)
                  );
                }
                if (row.key === "averageRating") {
                  const nums = values.map((v) => parseFloat(v) || 0);
                  return (
                    parseFloat(val) === Math.max(...nums) && parseFloat(val) > 0
                  );
                }
                return false;
              };

              return (
                <tr
                  key={row.key}
                  className={`border-b border-gray-100 ${rowIdx % 2 === 0 ? "bg-gray-50/50" : "bg-white"}`}
                >
                  <td className="p-4 font-medium text-gray-600 text-xs uppercase tracking-wide bg-gray-50 border-r border-gray-100">
                    {row.label}
                  </td>
                  {compareList.map((p, pIdx) => {
                    const val = values[pIdx];
                    const best = isBest(val);
                    return (
                      <td
                        key={p._id}
                        className={`p-4 text-sm border-l border-gray-100 text-center ${
                          best
                            ? "font-semibold text-green-700 bg-green-50/50"
                            : "text-gray-700"
                        }`}
                      >
                        {val}
                        {best && (
                          <span className="ml-1 text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-bold">
                            Best
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}

            {/* Specification rows — from product.specifications */}
            {(() => {
              const allKeys = new Set();
              compareList.forEach((p) => {
                (p.specifications || []).forEach((s) => {
                  if (s.key && s.type !== "header") allKeys.add(s.key);
                });
              });
              if (allKeys.size === 0) return null;
              return [...allKeys].slice(0, 10).map((key, i) => (
                <tr
                  key={`spec-${key}`}
                  className={`border-b border-gray-100 ${i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}
                >
                  <td className="p-4 font-medium text-gray-600 text-xs uppercase tracking-wide bg-gray-50 border-r border-gray-100">
                    {key}
                  </td>
                  {compareList.map((p) => {
                    const spec = (p.specifications || []).find(
                      (s) => s.key === key && s.type !== "header",
                    );
                    return (
                      <td
                        key={p._id}
                        className="p-4 text-sm border-l border-gray-100 text-center text-gray-700"
                      >
                        {spec?.value || "—"}
                      </td>
                    );
                  })}
                </tr>
              ));
            })()}
          </tbody>
        </table>
      </div>
    </div>
  );
}
