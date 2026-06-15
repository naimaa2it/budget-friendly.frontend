"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FaBarcode, FaEdit, FaExternalLinkAlt, FaSearch } from "react-icons/fa";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

function normalizeCode(value) {
  return String(value || "").trim().replace(/\s+/g, "");
}

function formatMoney(value) {
  if (value == null || Number.isNaN(Number(value))) return "—";
  return `৳${Number(value).toLocaleString("en-BD")}`;
}

export default function BarcodeLookup() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inputRef = useRef(null);

  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [product, setProduct] = useState(null);
  const [lastScanned, setLastScanned] = useState("");

  const lookupBarcode = useCallback(async (rawCode) => {
    const normalized = normalizeCode(rawCode);
    if (!normalized) {
      setError("Enter or scan a barcode number.");
      setProduct(null);
      return;
    }

    setLoading(true);
    setError("");
    setProduct(null);
    setLastScanned(normalized);

    try {
      const resp = await fetch(
        `${API}/api/products/barcode/${encodeURIComponent(normalized)}`,
        { cache: "no-store" },
      );
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        throw new Error(data.error || "No product is linked to this barcode.");
      }

      const productId = data?.product?._id || data?.product?.id;
      if (!productId) {
        throw new Error("No product is linked to this barcode.");
      }

      const adminResp = await fetch(`${API}/api/admin/products/${productId}`, {
        credentials: "include",
      });
      const adminData = await adminResp.json().catch(() => ({}));
      if (adminResp.ok && adminData?.product) {
        setProduct(adminData.product);
        return;
      }

      setProduct(data.product);
    } catch (err) {
      setError(err.message || "Lookup failed");
    } finally {
      setLoading(false);
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, []);

  useEffect(() => {
    const fromUrl = normalizeCode(searchParams.get("code"));
    if (fromUrl) {
      setCode(fromUrl);
      lookupBarcode(fromUrl);
    } else {
      inputRef.current?.focus();
    }
  }, [searchParams, lookupBarcode]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const normalized = normalizeCode(code);
    router.replace(
      normalized
        ? `/dashboard/barcodes/lookup?code=${encodeURIComponent(normalized)}`
        : "/dashboard/barcodes/lookup",
    );
    lookupBarcode(normalized);
  };

  const thumb =
    Array.isArray(product?.images) && product.images[0]?.url
      ? product.images[0].url
      : null;

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
              Barcode Lookup
            </p>
            <h1 className="mt-2 text-2xl font-bold text-gray-900">
              Scan or search product by barcode
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Use a USB/Bluetooth scanner (it types the number and sends Enter) or
              type the barcode manually, then press Enter or click Look up.
            </p>
          </div>
          <Link
            href="/dashboard/barcodes"
            className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            Back to barcodes
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-wrap gap-3">
          <div className="flex min-w-[280px] flex-1 items-center gap-2 rounded-xl border-2 border-indigo-200 bg-indigo-50/40 px-3 py-2.5">
            <FaBarcode className="shrink-0 text-indigo-500" />
            <input
              ref={inputRef}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\s+/g, ""))}
              className="w-full bg-transparent text-base font-semibold tracking-wide text-gray-900 outline-none"
              placeholder="Scan or type barcode number"
              inputMode="numeric"
              autoComplete="off"
              autoFocus
            />
          </div>
          <button
            type="submit"
            disabled={loading || !normalizeCode(code)}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <FaSearch />
            {loading ? "Looking up..." : "Look up"}
          </button>
        </form>

        {lastScanned && (
          <p className="mt-3 text-sm text-gray-600">
            Last scanned:{" "}
            <span className="font-mono font-semibold text-gray-900">
              {lastScanned}
            </span>
          </p>
        )}

        {error && (
          <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </p>
        )}
      </section>

      {product && (
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
                Linked product
              </p>
              <h2 className="mt-1 text-xl font-bold text-gray-900">
                {product.title || "Untitled product"}
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Status:{" "}
                <span className="font-semibold capitalize text-gray-800">
                  {product.status || "unknown"}
                </span>
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href={`/dashboard/products/${product._id}`}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                <FaEdit /> Edit in dashboard
              </Link>
              <Link
                href={`/product/${product._id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                <FaExternalLinkAlt /> View storefront
              </Link>
            </div>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
            <div className="relative aspect-square overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
              {thumb ? (
                <Image
                  src={thumb}
                  alt={product.title || "Product"}
                  fill
                  sizes="220px"
                  className="object-contain p-3"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-gray-400">
                  No image
                </div>
              )}
            </div>

            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Barcode
                </dt>
                <dd className="mt-1 font-mono font-semibold text-gray-900">
                  {product.barcode || lastScanned}
                </dd>
              </div>
              <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  SKU
                </dt>
                <dd className="mt-1 font-semibold text-gray-900">
                  {product.sku || "—"}
                </dd>
              </div>
              <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Price
                </dt>
                <dd className="mt-1 font-semibold text-gray-900">
                  {formatMoney(product.price)}
                </dd>
              </div>
              <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Compare at
                </dt>
                <dd className="mt-1 font-semibold text-gray-900">
                  {formatMoney(product.compareAtPrice)}
                </dd>
              </div>
              <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Stock
                </dt>
                <dd className="mt-1 font-semibold text-gray-900">
                  {product.inventory ?? "—"}
                </dd>
              </div>
              <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Availability
                </dt>
                <dd className="mt-1 font-semibold capitalize text-gray-900">
                  {(product.availability || "in_stock").replace(/_/g, " ")}
                </dd>
              </div>
              <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 sm:col-span-2">
                <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Category
                </dt>
                <dd className="mt-1 font-semibold text-gray-900">
                  {product.category || product.department || "—"}
                </dd>
              </div>
              {product.description && (
                <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 sm:col-span-2">
                  <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Description
                  </dt>
                  <dd className="mt-1 line-clamp-4 text-gray-800">
                    {product.description}
                  </dd>
                </div>
              )}
            </dl>
          </div>
        </section>
      )}
    </div>
  );
}
