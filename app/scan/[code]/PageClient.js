"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

function DiscountBadge({ price, compareAtPrice }) {
  if (!compareAtPrice || compareAtPrice <= price) return null;
  const pct = Math.round(((compareAtPrice - price) / compareAtPrice) * 100);
  return (
    <span className="inline-block bg-rose-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
      -{pct}%
    </span>
  );
}

export default function ScanPage() {
  const { code } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!code) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    fetch(`${API}/api/products/barcode/${encodeURIComponent(code)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.product) {
          setProduct(data.product);
        } else {
          setNotFound(true);
        }
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [code]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-sm text-gray-500">Loading product…</p>
      </div>
    );
  }

  if (notFound || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-lg font-semibold text-gray-900">
            Product not found
          </p>
          <p className="mt-2 text-sm text-gray-500">
            No product linked to barcode: {code}
          </p>
          <Link
            href="/"
            className="mt-4 inline-block text-sm text-rose-600 underline"
          >
            Browse All Products
          </Link>
        </div>
      </div>
    );
  }

  const thumb = product.images?.[0]?.url || product.images?.[0];
  const isAvailable =
    product.availability !== false && product.status !== "archived";
  const hasDiscount =
    product.compareAtPrice && product.compareAtPrice > product.price;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b px-4 py-3 flex items-center justify-between">
        <Link
          href="/"
          className="text-lg font-bold text-rose-600 tracking-tight"
        >
          SmartBuy BD
        </Link>
        <Link
          href="/"
          className="text-sm text-gray-500 hover:text-rose-600 flex items-center gap-1"
        >
          🛍️ Shop
        </Link>
      </header>

      <main className="flex-1 flex items-start justify-center px-4 py-8">
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="w-full aspect-square bg-gray-100 relative">
            {thumb ? (
              <img
                src={typeof thumb === "string" ? thumb : thumb}
                alt={product.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-5xl text-gray-200">
                📦
              </div>
            )}
            {hasDiscount && (
              <div className="absolute top-3 left-3">
                <DiscountBadge
                  price={product.price}
                  compareAtPrice={product.compareAtPrice}
                />
              </div>
            )}
          </div>

          <div className="p-5 space-y-4">
            <div>
              <div className="flex items-start justify-between gap-2">
                <h1 className="text-lg font-bold text-gray-900 leading-snug">
                  {product.title}
                </h1>
                <span
                  className={`shrink-0 mt-0.5 inline-block text-xs font-semibold px-2 py-0.5 rounded-full ${isAvailable ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}
                >
                  {isAvailable ? "In Stock" : "Unavailable"}
                </span>
              </div>
              {product.sku && (
                <p className="text-xs text-gray-400 mt-1 font-mono">
                  SKU: {product.sku}
                </p>
              )}
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-gray-900">
                ৳{product.price?.toLocaleString("en-BD")}
              </span>
              {hasDiscount && (
                <span className="text-sm text-gray-400 line-through">
                  ৳{product.compareAtPrice?.toLocaleString("en-BD")}
                </span>
              )}
            </div>

            {product.description && (
              <p className="text-sm text-gray-600 line-clamp-3 leading-relaxed">
                {product.description}
              </p>
            )}

            <div className="flex flex-col gap-2 pt-1">
              <Link
                href={`/product/${product._id}`}
                className="w-full text-center bg-rose-600 hover:bg-rose-700 text-white font-semibold text-sm py-3 rounded-xl transition"
              >
                View Full Details →
              </Link>
              <Link
                href="/"
                className="w-full text-center bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium text-sm py-3 rounded-xl transition"
              >
                Browse All Products
              </Link>
            </div>

            <div className="border-t pt-3 flex items-center gap-2">
              <span className="text-gray-300 text-lg">✓</span>
              <div>
                <p className="text-xs font-semibold text-gray-500">
                  Verified Product
                </p>
                <p className="text-[10px] text-gray-400 font-mono">
                  Barcode: {code}
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="text-center py-4 text-xs text-gray-400">
        © SmartBuy BD — Scan to shop
      </footer>
    </div>
  );
}
