"use client";

import { useCompare } from "@/components/context/CompareContext";
import Image from "next/image";
import Link from "next/link";
import { FaTimes } from "react-icons/fa";

export default function CompareBar() {
  const { compareList, removeFromCompare, clearCompare } = useCompare();

  if (compareList.length === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 shadow-2xl">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-4">
        <div className="flex-1 flex items-center gap-3 overflow-x-auto">
          {compareList.map((product) => {
            const img = product.images?.[0]?.url || "/assets/placeholder.svg";
            return (
              <div
                key={product._id}
                className="relative shrink-0 flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 bg-gray-50 min-w-[160px]"
              >
                <Image
                  src={encodeURI(img)}
                  alt={product.title}
                  width={36}
                  height={36}
                  className="w-9 h-9 object-contain rounded"
                />
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-gray-800 line-clamp-1">
                    {product.title}
                  </p>
                  <p className="text-xs text-red-600 font-bold">
                    ৳{Number(product.price).toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={() => removeFromCompare(product._id)}
                  className="absolute -top-2 -right-2 w-5 h-5 bg-gray-700 rounded-full flex items-center justify-center hover:bg-red-600 transition"
                >
                  <FaTimes className="w-2.5 h-2.5 text-white" />
                </button>
              </div>
            );
          })}

          {/* empty slots */}
          {Array.from({ length: 4 - compareList.length }).map((_, i) => (
            <div
              key={`empty-${i}`}
              className="shrink-0 w-[160px] h-[60px] border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center text-xs text-gray-400"
            >
              + Add product
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={clearCompare}
            className="text-xs text-gray-500 hover:text-red-600 underline transition"
          >
            Clear all
          </button>
          <Link
            href="/compare"
            className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${
              compareList.length >= 2
                ? "bg-gray-900 text-white hover:bg-gray-700 shadow-md"
                : "bg-gray-200 text-gray-400 cursor-not-allowed pointer-events-none"
            }`}
          >
            Compare ({compareList.length})
          </Link>
        </div>
      </div>
    </div>
  );
}
