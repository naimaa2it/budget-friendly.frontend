"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";

export default function ProductAsideSections({
  product,
  setProduct,
  badgeOptions,
  setBadgeOptions,
  showBadgeManager,
  setShowBadgeManager,
  badgeSaving,
  saveBadgeOptions,
  newBadgeLabel,
  setNewBadgeLabel,
  newBadgeKey,
  setNewBadgeKey,
  normalizeBadgeKey,
  labelClass,
  inputClass,
  fbtSearch,
  setFbtSearch,
  fbtSearchResults,
  setFbtSearchResults,
  fbtSearching,
  setFbtSearching,
  API,
}) {
  const [barcodeLookup, setBarcodeLookup] = useState({
    status: "idle",
    message: "",
  });

  const generateSku = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    const rand = (n) =>
      Array.from({ length: n }, () =>
        chars[Math.floor(Math.random() * chars.length)],
      ).join("");
    const date = new Date();
    const ymd =
      String(date.getFullYear()).slice(-2) +
      String(date.getMonth() + 1).padStart(2, "0") +
      String(date.getDate()).padStart(2, "0");
    setProduct((p) => ({ ...p, sku: `SB-${ymd}-${rand(5)}` }));
  };
  const promotionFlags = [
    {
      field: "featured",
      key: "flag:featured",
      label: "Featured",
      color: "bg-indigo-100 text-indigo-800",
    },
    {
      field: "coupon",
      key: "flag:coupon",
      label: "Coupon",
      color: "bg-teal-100 text-teal-800",
    },
    {
      field: "flashSale",
      key: "flag:flashSale",
      label: "Flash Sale",
      color: "bg-rose-100 text-rose-800",
    },
    {
      field: "clearance",
      key: "flag:clearance",
      label: "Clearance",
      color: "bg-amber-100 text-amber-800",
    },
    {
      field: "freeShipping",
      key: "flag:freeShipping",
      label: "Free Shipping",
      color: "bg-green-100 text-green-800",
    },
  ];
  const badgeChoices = [
    ...(badgeOptions || []).map((item) => ({
      ...item,
      key: `badge:${item.key}`,
      type: "badge",
      value: item.key,
    })),
    ...promotionFlags.map((item) => ({
      ...item,
      type: "flag",
      value: item.field,
    })),
  ];
  const selectedBadges = (badgeOptions || []).filter((item) =>
    (product.badges || []).includes(item.key),
  );
  const selectedFlags = promotionFlags.filter((item) => product[item.field]);
  const barcodeValue = String(product.barcode || "").trim();

  useEffect(() => {
    const code = barcodeValue.replace(/\s+/g, "");
    if (!code) {
      setBarcodeLookup({ status: "idle", message: "" });
      return;
    }
    let active = true;
    setBarcodeLookup({ status: "checking", message: "Checking barcode..." });
    const timer = setTimeout(async () => {
      try {
        const resp = await fetch(
          `${API}/api/admin/barcodes?code=${encodeURIComponent(code)}&limit=5`,
          {
            credentials: "include",
          },
        );
        const data = await resp.json();
        if (!active) return;
        const item =
          data?.items?.find((row) => String(row.code || "") === code) ||
          data?.items?.[0];
        if (!item) {
          setBarcodeLookup({
            status: "available",
            message: "Not added to any product — you can add this barcode",
          });
          return;
        }
        const linkedId = String(
          item.product?._id || item.product?.id || item.product || "",
        );
        const currentId = String(product._id || "");
        if (!linkedId) {
          setBarcodeLookup({
            status: "available",
            message: "Not added to any product — you can add this barcode",
          });
          return;
        }
        if (currentId && linkedId === currentId) {
          setBarcodeLookup({
            status: "linked",
            message: "Linked to this product",
          });
          return;
        }
        setBarcodeLookup({
          status: "taken",
          message: `Already linked to ${item.product?.title || "another product"}`,
        });
      } catch {
        if (!active) return;
        setBarcodeLookup({
          status: "error",
          message: "Could not verify barcode right now",
        });
      }
    }, 350);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [barcodeValue, API, product._id, product?.title]);

  const barcodeStatusTone = useMemo(() => {
    switch (barcodeLookup.status) {
      case "available":
      case "linked":
        return "text-green-700 bg-green-50 border-green-200";
      case "taken":
        return "text-rose-700 bg-rose-50 border-rose-200";
      case "checking":
        return "text-blue-700 bg-blue-50 border-blue-200";
      case "error":
        return "text-amber-700 bg-amber-50 border-amber-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  }, [barcodeLookup.status]);

  const generateBarcode = () => {
    const code =
      `${Date.now()}${Math.floor(Math.random() * 900000 + 100000)}`.slice(
        0,
        12,
      );
    setProduct((p) => ({ ...p, barcode: code }));
  };

  const handleBadgeSelect = (value) => {
    if (!value) return;
    const choice = badgeChoices.find((item) => item.key === value);
    if (!choice) return;
    if (choice.type === "badge") {
      setProduct((p) => ({
        ...p,
        badges: (p.badges || []).includes(choice.value)
          ? p.badges || []
          : [...(p.badges || []), choice.value],
      }));
      return;
    }
    setProduct((p) => ({ ...p, [choice.value]: true }));
  };

  return (
    <>
      <section
        id="product-badges"
        className="rounded-2xl border border-gray-200 bg-slate-50 p-5 shadow-sm scroll-mt-6"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
          Product Badges & Promotion Flags
        </p>
        <div className="mt-4 space-y-3">
          <select
            value=""
            onChange={(e) => handleBadgeSelect(e.target.value)}
            className={inputClass}
          >
            <option value="">Select badges</option>
            {badgeChoices.map((item) => (
              <option key={item.key} value={item.key}>
                {item.label}
              </option>
            ))}
          </select>

          <div className="flex flex-wrap gap-2">
            {selectedBadges.map((item) => (
              <span
                key={item.key}
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${item.color || "bg-gray-100 text-gray-800"}`}
              >
                {item.label}
                <button
                  type="button"
                  onClick={() =>
                    setProduct((p) => ({
                      ...p,
                      badges: (p.badges || []).filter(
                        (key) => key !== item.key,
                      ),
                    }))
                  }
                  className="text-gray-500 hover:text-red-600"
                >
                  x
                </button>
              </span>
            ))}
            {selectedFlags.map((item) => (
              <span
                key={item.field}
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${item.color}`}
              >
                {item.label}
                <button
                  type="button"
                  onClick={() =>
                    setProduct((p) => ({ ...p, [item.field]: false }))
                  }
                  className="text-gray-500 hover:text-red-600"
                >
                  x
                </button>
              </span>
            ))}
            {!selectedBadges.length && !selectedFlags.length && (
              <p className="text-xs text-gray-500">No badge selected.</p>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowBadgeManager((v) => !v)}
          className="mt-3 rounded-lg border border-indigo-300 px-3 py-1.5 text-sm text-indigo-700 hover:bg-indigo-50"
        >
          {showBadgeManager ? "Hide Badge Manager" : "Manage Badges"}
        </button>

        {showBadgeManager && (
          <div className="mt-3 space-y-3 rounded-xl border border-indigo-200 bg-indigo-50 p-3">
            {(badgeOptions || []).map((item, index) => (
              <div
                key={`${item.key}-${index}`}
                className="space-y-2 rounded-lg bg-white p-2"
              >
                <input
                  type="text"
                  value={item.label || ""}
                  onChange={(e) =>
                    setBadgeOptions((prev) =>
                      prev.map((b, i) =>
                        i === index ? { ...b, label: e.target.value } : b,
                      ),
                    )
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  placeholder="Badge label"
                />
                <input
                  type="text"
                  value={item.key || ""}
                  onChange={(e) => {
                    const oldKey = item.key;
                    const nextKey = normalizeBadgeKey(e.target.value);
                    setBadgeOptions((prev) =>
                      prev.map((b, i) =>
                        i === index ? { ...b, key: nextKey } : b,
                      ),
                    );
                    if (oldKey && nextKey && oldKey !== nextKey) {
                      setProduct((prev) => ({
                        ...prev,
                        badges: (prev.badges || []).map((x) =>
                          x === oldKey ? nextKey : x,
                        ),
                      }));
                    }
                  }}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  placeholder="badge_key"
                />
                <button
                  type="button"
                  className="rounded-lg border border-red-300 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
                  onClick={() => {
                    const removed = badgeOptions[index];
                    setBadgeOptions(badgeOptions.filter((_, i) => i !== index));
                    if (removed?.key) {
                      setProduct((prev) => ({
                        ...prev,
                        badges: (prev.badges || []).filter(
                          (x) => x !== removed.key,
                        ),
                      }));
                    }
                  }}
                >
                  Remove
                </button>
              </div>
            ))}

            <div className="space-y-2 border-t border-indigo-200 pt-3">
              <input
                type="text"
                value={newBadgeLabel}
                onChange={(e) => setNewBadgeLabel(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                placeholder="New badge label"
              />
              <input
                type="text"
                value={newBadgeKey}
                onChange={(e) => setNewBadgeKey(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                placeholder="new_badge_key"
              />
              <button
                type="button"
                className="rounded-lg border border-indigo-300 px-3 py-1.5 text-sm text-indigo-700 hover:bg-indigo-100"
                onClick={() => {
                  const key = normalizeBadgeKey(newBadgeKey || newBadgeLabel);
                  const label = String(newBadgeLabel || "").trim();
                  if (!key || !label) return;
                  if ((badgeOptions || []).some((b) => b.key === key)) return;
                  setBadgeOptions((prev) => [
                    ...prev,
                    { key, label, color: "bg-gray-100 text-gray-800" },
                  ]);
                  setNewBadgeKey("");
                  setNewBadgeLabel("");
                }}
              >
                Add Badge
              </button>
            </div>

            <button
              type="button"
              disabled={badgeSaving}
              onClick={() => saveBadgeOptions(badgeOptions)}
              className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              {badgeSaving ? "Saving..." : "Save Badge Options"}
            </button>
          </div>
        )}
      </section>

      <section
        id="pricing-inventory"
        className="rounded-2xl border border-gray-200 bg-slate-50 p-5 shadow-sm scroll-mt-6"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
          Pricing & Inventory
        </p>
        <div className="mt-4 space-y-4">
          <div>
            <label className={labelClass}>Buying Price</label>
            <input
              type="number"
              value={product.buyingPrice ?? ""}
              onChange={(e) =>
                setProduct((p) => ({
                  ...p,
                  buyingPrice:
                    e.target.value === "" ? undefined : Number(e.target.value),
                }))
              }
              className={inputClass}
              placeholder="0.00"
              step="0.01"
            />
            <p className="mt-1 text-xs text-gray-500">
              This is the buying price of the product.
            </p>
          </div>
          <div>
            <label className={labelClass}>Selling Price <span className="text-red-500">*</span></label>
            <input
              type="number"
              value={product.price ?? ""}
              onChange={(e) =>
                setProduct((p) => ({
                  ...p,
                  price:
                    e.target.value === "" ? undefined : Number(e.target.value),
                }))
              }
              className={inputClass}
              placeholder="0.00"
              step="0.01"
            />
            <p className="mt-1 text-xs text-gray-500">
              Customer pays this price. Always fill this — offer বা no offer সবসময় এটা দিতে হবে।
            </p>
          </div>
          <div>
            <label className={labelClass}>MRP / Original Price</label>
            <input
              type="number"
              value={product.compareAtPrice ?? ""}
              onChange={(e) =>
                setProduct((p) => ({
                  ...p,
                  compareAtPrice:
                    e.target.value === "" ? undefined : Number(e.target.value),
                }))
              }
              className={inputClass}
              placeholder="0.00 (optional)"
              step="0.01"
            />
            <p className="mt-1 text-xs text-gray-500">
              Discount না থাকলে খালি রাখুন। এটা Selling Price-এর চেয়ে বেশি হলে frontend-এ কাটা দাম ও % discount দেখাবে।
            </p>
          </div>
          <div>
            <label className={labelClass}>Stock Quantity</label>
            <input
              type="number"
              value={product.inventory ?? ""}
              onChange={(e) =>
                setProduct((p) => ({
                  ...p,
                  inventory:
                    e.target.value === "" ? undefined : Number(e.target.value),
                }))
              }
              className={inputClass}
              placeholder="0"
            />
          </div>
          <div>
            <label className={labelClass}>SKU</label>
            <input
              type="text"
              value={product.sku || ""}
              onChange={(e) =>
                setProduct((p) => ({ ...p, sku: e.target.value }))
              }
              className={inputClass}
              placeholder="SB-260618-AB12C"
            />
            <div className="mt-2">
              <button
                type="button"
                onClick={generateSku}
                className="rounded-lg border border-indigo-300 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-50"
              >
                Generate SKU
              </button>
            </div>
          </div>
          <div>
            <label className={labelClass}>Barcode</label>
            <input
              type="text"
              value={product.barcode || ""}
              onChange={(e) =>
                setProduct((p) => ({
                  ...p,
                  barcode: e.target.value.replace(/\s+/g, ""),
                }))
              }
              className={inputClass}
              placeholder="Scan or type barcode"
              inputMode="numeric"
            />
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={generateBarcode}
                className="rounded-lg border border-indigo-300 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-50"
              >
                Generate Barcode
              </button>
              <Link
                href="/dashboard/barcodes"
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
              >
                Manage Barcodes
              </Link>
            </div>
            {barcodeValue && (
              <p
                className={`mt-2 inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${barcodeStatusTone}`}
              >
                {barcodeLookup.status === "checking"
                  ? "Checking..."
                  : barcodeLookup.message || "Barcode set"}
              </p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Scanner input usually lands here automatically. Press Enter or
              type the number manually.
            </p>
          </div>
          <div>
            <label className={labelClass}>Availability Status</label>
            <select
              value={product.availability || "in_stock"}
              onChange={(e) =>
                setProduct((p) => ({ ...p, availability: e.target.value }))
              }
              className={inputClass}
            >
              <option value="in_stock">In Stock</option>
              <option value="pre_order">Pre-Order</option>
              <option value="upcoming">Coming Soon</option>
              <option value="out_of_stock">Out of Stock</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Low Stock Threshold</label>
            <input
              type="number"
              min="0"
              value={product.lowStockThreshold ?? 5}
              onChange={(e) =>
                setProduct((p) => ({ ...p, lowStockThreshold: Math.max(0, Number(e.target.value)) }))
              }
              className={inputClass}
              placeholder="5"
            />
            <p className="mt-1 text-xs text-gray-400">Show "Low Stock" warning below this quantity</p>
          </div>
          <div className="flex items-start justify-between gap-3 rounded-lg border border-gray-200 p-3">
            <div>
              <p className="text-xs font-semibold text-gray-700">Allow Overselling</p>
              <p className="text-xs text-gray-400 mt-0.5">Customers can buy even when stock is 0</p>
            </div>
            <button
              type="button"
              onClick={() => setProduct((p) => ({ ...p, allowOverselling: !p.allowOverselling }))}
              className={`relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors focus:outline-none ${product.allowOverselling ? "bg-green-500" : "bg-gray-200"}`}
            >
              <span className={`inline-block h-4 w-4 mt-0.5 rounded-full bg-white shadow transition-transform ${product.allowOverselling ? "translate-x-4" : "translate-x-0.5"}`} />
            </button>
          </div>
          <div>
            <label className={labelClass}>Units Sold (Last 30 Days)</label>
            <input
              type="number"
              value={product.monthlySold ?? ""}
              onChange={(e) =>
                setProduct((p) => ({
                  ...p,
                  monthlySold:
                    e.target.value === "" ? undefined : Number(e.target.value),
                }))
              }
              className={inputClass}
              placeholder="0"
            />
          </div>
          <div>
            <label className={labelClass}>Reward Points</label>
            <input
              type="number"
              value={product.rewardPoints ?? ""}
              onChange={(e) =>
                setProduct((p) => ({
                  ...p,
                  rewardPoints:
                    e.target.value === "" ? undefined : Number(e.target.value),
                }))
              }
              className={inputClass}
              placeholder="0"
            />
          </div>
        </div>
      </section>

      <section
        id="product-warranty"
        className="rounded-2xl border border-gray-200 bg-slate-50 p-5 shadow-sm scroll-mt-6"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
          Product Warranty
        </p>
        <div className="mt-4 space-y-4">
          <div>
            <label className={labelClass}>Warranty Period</label>
            <input
              type="text"
              value={product.warranty?.period || ""}
              onChange={(e) =>
                setProduct((p) => ({
                  ...p,
                  warranty: { ...(p.warranty || {}), period: e.target.value },
                }))
              }
              className={inputClass}
              placeholder="e.g., 12 months"
            />
          </div>
          <div>
            <label className={labelClass}>Warranty Provider</label>
            <input
              type="text"
              value={product.warranty?.provider || ""}
              onChange={(e) =>
                setProduct((p) => ({
                  ...p,
                  warranty: {
                    ...(p.warranty || {}),
                    provider: e.target.value,
                  },
                }))
              }
              className={inputClass}
              placeholder="Manufacturer or store"
            />
          </div>
          <div>
            <label className={labelClass}>Warranty Details</label>
            <textarea
              value={product.warranty?.details || ""}
              onChange={(e) =>
                setProduct((p) => ({
                  ...p,
                  warranty: { ...(p.warranty || {}), details: e.target.value },
                }))
              }
              className={`${inputClass} h-24`}
              placeholder="Coverage details..."
            />
          </div>
        </div>
      </section>

      <section
        id="return-policy"
        className="rounded-2xl border border-gray-200 bg-slate-50 p-5 shadow-sm scroll-mt-6"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
          Return Policy
        </p>
        <div className="mt-4 space-y-4">
          <div>
            <label className={labelClass}>Return Window (Days)</label>
            <input
              type="number"
              value={product.returnPolicy?.days ?? ""}
              onChange={(e) =>
                setProduct((p) => ({
                  ...p,
                  returnPolicy: {
                    ...(p.returnPolicy || {}),
                    days:
                      e.target.value === ""
                        ? undefined
                        : Number(e.target.value),
                  },
                }))
              }
              className={inputClass}
              placeholder="e.g., 30"
            />
          </div>
          <label className="flex items-center gap-3 text-sm font-medium text-gray-700">
            <input
              type="checkbox"
              checked={product.returnPolicy?.refundable ?? true}
              onChange={(e) =>
                setProduct((p) => ({
                  ...p,
                  returnPolicy: {
                    ...(p.returnPolicy || {}),
                    refundable: e.target.checked,
                  },
                }))
              }
              className="h-4 w-4"
            />
            Product is refundable
          </label>
          <div>
            <label className={labelClass}>Return Policy Details</label>
            <textarea
              value={product.returnPolicy?.details || ""}
              onChange={(e) =>
                setProduct((p) => ({
                  ...p,
                  returnPolicy: {
                    ...(p.returnPolicy || {}),
                    details: e.target.value,
                  },
                }))
              }
              className={`${inputClass} h-24`}
              placeholder="Return process and conditions..."
            />
          </div>
        </div>
      </section>

      <section
        id="seo-search"
        className="rounded-2xl border border-gray-200 bg-slate-50 p-5 shadow-sm scroll-mt-6"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
          SEO & Search Optimization
        </p>
        <div className="mt-4 space-y-4">
          <div>
            <label className={labelClass}>SEO Title</label>
            <input
              type="text"
              value={product.seo?.title || ""}
              onChange={(e) =>
                setProduct((p) => ({
                  ...p,
                  seo: { ...(p.seo || {}), title: e.target.value },
                }))
              }
              className={inputClass}
              placeholder="Search title"
            />
            <p className="mt-1 text-xs text-gray-500">
              {(product.seo?.title || "").length}/60 recommended
            </p>
          </div>
          <div>
            <label className={labelClass}>SEO Meta Description</label>
            <textarea
              value={product.seo?.description || ""}
              onChange={(e) =>
                setProduct((p) => ({
                  ...p,
                  seo: { ...(p.seo || {}), description: e.target.value },
                }))
              }
              className={`${inputClass} h-28`}
              placeholder="Search description"
            />
            <p className="mt-1 text-xs text-gray-500">
              {(product.seo?.description || "").length}/155 recommended
            </p>
          </div>
          <div>
            <label className={labelClass}>SEO Keywords</label>
            <input
              type="text"
              value={product.seo?.keywords || ""}
              onChange={(e) =>
                setProduct((p) => ({
                  ...p,
                  seo: { ...(p.seo || {}), keywords: e.target.value },
                }))
              }
              className={inputClass}
              placeholder="comma separated keywords"
            />
          </div>
        </div>
      </section>

      <section
        id="frequently-bought-together"
        className="rounded-2xl border border-orange-200 bg-orange-50 p-5 shadow-sm scroll-mt-6"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-700">
          Frequently Bought Together
        </p>
        <p className="mt-2 text-sm text-gray-600">
          Select up to 6 products shown when a user adds this product to cart.
        </p>

        {(product.frequentlyBoughtTogether || []).length > 0 && (
          <div className="mt-4 space-y-2">
            {(product.frequentlyBoughtTogether || []).map((p, i) => (
              <div
                key={p._id || p.id || i}
                className="flex items-center gap-2 rounded-lg border border-orange-300 bg-white px-3 py-2"
              >
                <span className="min-w-0 flex-1 truncate text-sm font-medium text-gray-800">
                  {p.title || p._id || p}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setProduct((prev) => ({
                      ...prev,
                      frequentlyBoughtTogether:
                        prev.frequentlyBoughtTogether.filter(
                          (_, idx) => idx !== i,
                        ),
                    }))
                  }
                  className="text-red-500 hover:text-red-700"
                >
                  x
                </button>
              </div>
            ))}
          </div>
        )}

        {(product.frequentlyBoughtTogether || []).length < 6 &&
          product.categoryId && (
            <button
              type="button"
              disabled={fbtSearching}
              onClick={async () => {
                setFbtSearching(true);
                try {
                  const r = await fetch(
                    `${API}/api/products?categoryId=${product.categoryId}&limit=12&status=published`,
                  );
                  const json = await r.json();
                  const excluded = new Set([
                    String(product._id || ""),
                    ...(product.frequentlyBoughtTogether || []).map((x) =>
                      String(x._id || x.id || x),
                    ),
                  ]);
                  const slots = 6 - (product.frequentlyBoughtTogether || []).length;
                  const candidates = (json.items || [])
                    .filter((item) => !excluded.has(String(item._id)))
                    .slice(0, slots);
                  if (candidates.length) {
                    setProduct((prev) => ({
                      ...prev,
                      frequentlyBoughtTogether: [
                        ...(prev.frequentlyBoughtTogether || []),
                        ...candidates.map((item) => ({
                          _id: item._id,
                          title: item.title,
                          price: item.price,
                          images: item.images,
                        })),
                      ],
                    }));
                  }
                } catch {
                  // silently fail
                } finally {
                  setFbtSearching(false);
                }
              }}
              className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-orange-300 px-3 py-2 text-xs font-semibold text-orange-700 hover:bg-orange-100 disabled:opacity-50"
            >
              {fbtSearching ? "Searching…" : "✨ Auto-suggest from same category"}
            </button>
          )}

        {(product.frequentlyBoughtTogether || []).length < 6 && (
          <div className="relative mt-4">
            <input
              type="text"
              value={fbtSearch}
              onChange={async (e) => {
                const q = e.target.value;
                setFbtSearch(q);
                if (!q.trim()) {
                  setFbtSearchResults([]);
                  return;
                }
                setFbtSearching(true);
                try {
                  const r = await fetch(
                    `${API}/api/products?q=${encodeURIComponent(q)}&limit=10&status=published`,
                  );
                  const json = await r.json();
                  const selected = (product.frequentlyBoughtTogether || []).map(
                    (x) => String(x._id || x.id || x),
                  );
                  setFbtSearchResults(
                    (json.items || []).filter(
                      (item) => !selected.includes(String(item._id)),
                    ),
                  );
                } catch {
                  setFbtSearchResults([]);
                } finally {
                  setFbtSearching(false);
                }
              }}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-400"
              placeholder="Search products..."
            />
            {fbtSearching && (
              <span className="absolute right-3 top-2.5 text-xs text-gray-400">
                Searching...
              </span>
            )}
            {fbtSearchResults.length > 0 && (
              <div className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
                {fbtSearchResults.map((item) => {
                  const thumb =
                    Array.isArray(item.images) && item.images[0]?.url;
                  return (
                    <button
                      key={item._id}
                      type="button"
                      onClick={() => {
                        setProduct((prev) => ({
                          ...prev,
                          frequentlyBoughtTogether: [
                            ...(prev.frequentlyBoughtTogether || []),
                            {
                              _id: item._id,
                              title: item.title,
                              price: item.price,
                              images: item.images,
                            },
                          ],
                        }));
                        setFbtSearch("");
                        setFbtSearchResults([]);
                      }}
                      className="flex w-full items-center gap-3 border-b border-gray-100 px-3 py-2 text-left hover:bg-orange-50 last:border-0"
                    >
                      <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                        {thumb && (
                          <Image
                            src={thumb}
                            alt={item.title}
                            fill
                            sizes="36px"
                            className="object-cover"
                          />
                        )}
                      </div>
                      <span className="min-w-0 flex-1 truncate text-sm font-medium text-gray-800">
                        {item.title}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </section>
    </>
  );
}
