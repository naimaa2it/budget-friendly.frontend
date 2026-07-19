"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import Image from "next/image";
import { useCart } from "@/components/context/CartContext";
import { useLanguage } from "@/components/context/LanguageContext";
import { useStoreSettings } from "@/components/context/StoreSettingsContext";

// Social icon components
const Facebook = () => (
  <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);
const Instagram = () => (
  <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
  </svg>
);
const YouTube = () => (
  <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
    <path d="M23.495 6.205a3.007 3.007 0 00-2.088-2.088c-1.87-.501-9.396-.501-9.396-.501s-7.507-.01-9.396.501A3.007 3.007 0 00.527 6.205a31.247 31.247 0 00-.522 5.805 31.247 31.247 0 00.522 5.783 3.007 3.007 0 002.088 2.088c1.868.502 9.396.502 9.396.502s7.506 0 9.396-.502a3.007 3.007 0 002.088-2.088 31.247 31.247 0 00.5-5.783 31.247 31.247 0 00-.5-5.805zM9.609 15.601V8.408l6.264 3.602z" />
  </svg>
);
const Twitter = () => (
  <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);
const TikTok = () => (
  <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.34 6.34 0 0 0-6.33 6.33 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V9.05a8.23 8.23 0 0 0 4.82 1.55V7.16a4.85 4.85 0 0 1-1.05-.47z" />
  </svg>
);

const SOCIAL_ICON_MAP = {
  facebook: { Icon: Facebook, color: "#1877F2" },
  instagram: { Icon: Instagram, color: "#E1306C" },
  twitter: { Icon: Twitter, color: "#000000" },
  tiktok: { Icon: TikTok, color: "#010101" },
  youtube: { Icon: YouTube, color: "#FF0000" },
};

function ProductAddCardSuccess({ product, onAdd }) {
  const { t } = useLanguage();
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [qty, setQty] = useState(1);

  const colors = [
    ...new Set(
      (product.variants || [])
        .map((v) => v.color?.name || v.attributes?.color)
        .filter(Boolean),
    ),
  ];
  const sizes = [
    ...new Set(
      (product.variants || [])
        .map((v) => v.size || v.attributes?.size)
        .filter(Boolean)
        .flatMap((s) => s.split(",").map((x) => x.trim()))
        .filter(Boolean),
    ),
  ];

  const getPrice = () => {
    if (!product.variants?.length || (!selectedColor && !selectedSize))
      return product.price || 0;
    const v = (product.variants || []).find((v) => {
      const vc = (v.color?.name || v.attributes?.color || "").toLowerCase();
      const vs = (v.size || v.attributes?.size || "").toLowerCase();
      return (
        (!selectedColor || vc === selectedColor.toLowerCase()) &&
        (!selectedSize || vs === selectedSize.toLowerCase())
      );
    });
    return v?.price || product.price || 0;
  };

  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50 p-2.5 space-y-2">
      <div className="flex items-center gap-2">
        {product.images?.[0]?.url ? (
          <Image
            src={product.images[0].url}
            alt={product.title}
            width={36}
            height={36}
            className="w-9 h-9 rounded-lg object-cover shrink-0 border border-gray-200"
          />
        ) : (
          <div className="w-9 h-9 rounded-lg bg-gray-200 shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-gray-800 truncate">
            {product.title}
          </p>
          <p className="text-xs text-orange-600 font-bold">৳{getPrice()}</p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            className="w-5 h-5 rounded bg-gray-200 text-xs font-bold flex items-center justify-center"
          >
            −
          </button>
          <span className="w-5 text-center text-xs font-bold">{qty}</span>
          <button
            type="button"
            onClick={() => setQty((q) => q + 1)}
            className="w-5 h-5 rounded bg-gray-200 text-xs font-bold flex items-center justify-center"
          >
            +
          </button>
        </div>
      </div>
      {colors.length > 0 && (
        <div className="flex flex-wrap items-center gap-1">
          <span className="text-xs text-gray-400">Color:</span>
          {colors.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setSelectedColor((p) => (p === c ? "" : c))}
              className={`px-2 py-0.5 rounded-full text-xs border transition ${selectedColor === c ? "bg-orange-500 text-white border-orange-500" : "border-gray-300 text-gray-600 hover:border-orange-400"}`}
            >
              {c}
            </button>
          ))}
        </div>
      )}
      {sizes.length > 0 && (
        <div className="flex flex-wrap items-center gap-1">
          <span className="text-xs text-gray-400">Size:</span>
          {sizes.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSelectedSize((p) => (p === s ? "" : s))}
              className={`px-2 py-0.5 rounded-full text-xs border font-mono transition ${selectedSize === s ? "bg-gray-800 text-white border-gray-800" : "border-gray-300 text-gray-600 hover:border-gray-500"}`}
            >
              {s}
            </button>
          ))}
        </div>
      )}
      <button
        type="button"
        onClick={() => onAdd(selectedColor, selectedSize, qty, getPrice())}
        className="w-full py-1.5 bg-orange-500 text-white rounded-lg text-xs font-semibold hover:bg-orange-600 transition"
      >
        {t("orders.add_to_order")}
      </button>
    </div>
  );
}

function SuccessContent() {
  const { t } = useLanguage();
  const params = useSearchParams();
  const orderId = params.get("orderId");
  const method = params.get("method");
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelled, setCancelled] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelReasonError, setCancelReasonError] = useState("");
  const [timeLeft, setTimeLeft] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [editBilling, setEditBilling] = useState({
    name: "",
    email: "",
    phone: "",
    city: "",
    zone: "",
    area: "",
    address: "",
    note: "",
  });
  const [editItems, setEditItems] = useState([]);
  const [productVariantsMap, setProductVariantsMap] = useState({});
  const [pendingNewItems, setPendingNewItems] = useState([]);
  const [productSearch, setProductSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);

  const API = process.env.NEXT_PUBLIC_API_URL || "https://api.pickob.com";
  const { supportInfo, socialLinks } = useStoreSettings();
  const PHONE =
    supportInfo?.phone ||
    process.env.NEXT_PUBLIC_STORE_PHONE ||
    "+8801643007383";
  const { clearCart } = useCart();

  // Clear the cart on successful payment (covers the online payment same-window flow).
  useEffect(() => {
    clearCart();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!orderId) {
      setLoading(false);
      return;
    }
    fetch(`${API}/api/orders/${orderId}`, { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        const o = data.order || null;
        setOrder(o);
        if (o) {
          setEditBilling({
            name: o.billingDetails?.name || "",
            email: o.billingDetails?.email || "",
            phone: o.billingDetails?.phone || "",
            city: o.billingDetails?.city || "",
            zone: o.billingDetails?.zone || "",
            area: o.billingDetails?.area || "",
            address: o.billingDetails?.address || "",
            note: o.billingDetails?.note || "",
          });
          setEditItems((o.items || []).map((it, index) => ({ ...it, index })));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [orderId, API]);

  // Countdown timer for 3-hour cancel window (COD only)
  useEffect(() => {
    if (!order?.confirmAfter || order.status !== "pending") return;
    const deadline = new Date(order.confirmAfter).getTime();
    const tick = () => {
      const diff = Math.max(0, Math.floor((deadline - Date.now()) / 1000));
      setTimeLeft(diff);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [order]);

  const openCancelModal = () => {
    setCancelReason("");
    setCancelReasonError("");
    setShowCancelModal(true);
  };

  const handleConfirmCancel = async () => {
    const trimmed = cancelReason.trim();
    if (trimmed.length < 5) {
      setCancelReasonError(t("orders.cancel_reason_min"));
      return;
    }
    setCancelLoading(true);
    try {
      const r = await fetch(`${API}/api/orders/${orderId}/cancel`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: trimmed }),
      });
      const data = await r.json();
      if (data.ok) {
        setShowCancelModal(false);
        setCancelled(true);
        setOrder((prev) => ({ ...prev, status: "cancelled" }));
      } else {
        alert(data.error || "Could not cancel order.");
      }
    } catch {
      alert("Failed to cancel. Please try again.");
    } finally {
      setCancelLoading(false);
    }
  };

  const openEdit = async () => {
    setIsEditing(true);
    setPendingNewItems([]);
    setProductSearch("");
    setSearchResults([]);
    if (!order) return;
    const ids = [
      ...new Set((order.items || []).map((i) => i.productId).filter(Boolean)),
    ];
    const map = {};
    await Promise.all(
      ids.map(async (id) => {
        try {
          const r = await fetch(
            `${API}/api/products/${encodeURIComponent(id)}`,
          );
          const d = await r.json();
          const prod = d.product || d;
          if (prod?._id) map[String(id)] = prod;
        } catch {}
      }),
    );
    setProductVariantsMap(map);
  };

  const handleSaveEdit = async () => {
    setEditSaving(true);
    try {
      const r = await fetch(`${API}/api/orders/${orderId}/edit`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          billingDetails: editBilling,
          items: editItems.map((it, index) => ({
            index,
            productId: it.productId,
            quantity: it.quantity,
            color: it.color ?? null,
            size: it.size ?? null,
          })),
          addItems: pendingNewItems.map((ni) => ({
            productId: ni.product._id,
            quantity: ni.qty,
            color: ni.color || null,
            size: ni.size || null,
          })),
        }),
      });
      const data = await r.json();
      if (data.ok) {
        setOrder(data.order);
        setIsEditing(false);
        setPendingNewItems([]);
        setProductSearch("");
        setSearchResults([]);
      } else {
        alert(data.error || "Could not update order.");
      }
    } catch {
      alert("Failed to save. Please try again.");
    } finally {
      setEditSaving(false);
    }
  };

  const updateQty = (index, delta) => {
    setEditItems((prev) =>
      prev.map((it, idx) =>
        idx === index
          ? { ...it, quantity: Math.max(1, Number(it.quantity || 1) + delta) }
          : it,
      ),
    );
  };

  const getItemColors = (productId) => {
    const prod = productVariantsMap[String(productId)];
    if (!prod?.variants?.length) return [];
    return [
      ...new Set(
        prod.variants
          .map((v) => v.color?.name || v.attributes?.color)
          .filter(Boolean),
      ),
    ];
  };

  const getItemSizes = (productId) => {
    const prod = productVariantsMap[String(productId)];
    if (!prod?.variants?.length) return [];
    const raw = prod.variants
      .map((v) => v.size || v.attributes?.size)
      .filter(Boolean);
    return [
      ...new Set(
        raw.flatMap((s) => s.split(",").map((x) => x.trim())).filter(Boolean),
      ),
    ];
  };

  const getVariantPrice = (productId, color, size) => {
    const prod = productVariantsMap[String(productId)];
    if (!prod) return null;
    if (!prod.variants?.length || (!color && !size)) return prod.price ?? null;
    const v = prod.variants.find((v) => {
      const vc = (v.color?.name || v.attributes?.color || "").toLowerCase();
      const vs = (v.size || v.attributes?.size || "").toLowerCase();
      return (
        (!color || vc === color.toLowerCase()) &&
        (!size || vs === size.toLowerCase())
      );
    });
    return v?.price ?? prod.price ?? null;
  };

  const searchProducts = async (q) => {
    const trimmed = q.trim();
    if (!trimmed) {
      setSearchResults([]);
      return;
    }
    setSearchLoading(true);
    try {
      const r = await fetch(
        `${API}/api/products?q=${encodeURIComponent(trimmed)}&limit=6&status=published`,
      );
      const d = await r.json();
      setSearchResults(
        Array.isArray(d.items)
          ? d.items
          : Array.isArray(d.products)
            ? d.products
            : [],
      );
    } catch {
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const shortId = (id) => (id ? "#" + String(id).slice(-8).toUpperCase() : "");
  const billing = order?.billingDetails || {};
  const addr = [billing.address, billing.zone, billing.city]
    .filter(Boolean)
    .join(", ");
  const canCancel =
    order?.status === "pending" &&
    order?.paymentMethod === "cash-on-delivery" &&
    timeLeft > 0;
  const fmtTime = (s) =>
    `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4 py-10">
      <div className="bg-white rounded-2xl shadow-md w-full max-w-sm overflow-hidden">
        {/* Green header */}
        <div className="flex flex-col items-center pt-8 pb-4 px-6">
          {/* Header icon — blue for paid online, green for COD */}
          <div
            className={`w-14 h-14 rounded-full flex items-center justify-center mb-3 ${order?.paymentStatus === "paid" ? "bg-blue-600" : "bg-green-500"}`}
          >
            {order?.paymentStatus === "paid" ? (
              <svg
                className="w-8 h-8 text-white"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <rect
                  x="2"
                  y="5"
                  width="20"
                  height="14"
                  rx="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2 10h20"
                />
              </svg>
            ) : (
              <svg
                className="w-8 h-8 text-white"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            )}
          </div>
          {cancelled ? (
            <>
              <h1 className="text-lg font-bold text-gray-900">
                {t("success.order_cancelled_title")}
              </h1>
              <p className="text-sm text-gray-500">
                {t("success.order_cancelled_desc")}
              </p>
            </>
          ) : order?.paymentStatus === "paid" ? (
            <>
              <h1 className="text-lg font-bold text-gray-900">
                {t("success.payment_confirmed")}
              </h1>
              <p className="text-sm text-gray-500">
                {t("success.payment_desc")}
              </p>
            </>
          ) : (
            <>
              <h1 className="text-lg font-bold text-gray-900">
                {t("success.order_placed")}
              </h1>
              <p className="text-sm text-gray-500">
                {t("success.thanks_order")}
              </p>
            </>
          )}
        </div>

        {/* Order details */}
        <div className="px-6 divide-y divide-gray-100">
          {/* Order ID + Delivery */}
          <div className="flex justify-between py-4 text-sm">
            <div>
              <p className="text-gray-500 text-xs mb-1">
                {t("success.order_id")}
              </p>
              <p className="font-bold text-gray-900">{shortId(orderId)}</p>
            </div>
            <div className="text-right">
              <p className="text-gray-500 text-xs mb-1">
                {t("success.estimated_delivery")}
              </p>
              <p className="font-bold text-gray-900">
                {t("success.within_days")}
              </p>
            </div>
          </div>

          {/* Shipping Address */}
          {!loading && addr && (
            <div className="py-4 text-sm">
              <p className="text-gray-500 text-xs mb-1">
                {t("success.address")}
              </p>
              <p className="text-gray-800">
                {billing.name}
                {addr ? ", " + addr : ""}
              </p>
            </div>
          )}

          {/* Ordered Items */}
          {!loading && order?.items?.length > 0 && (
            <div className="py-4">
              <p className="text-gray-500 text-xs mb-3">
                {t("success.items_ordered")} ({order.items.length})
              </p>
              <div className="space-y-3">
                {order.items.map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    {item.image ? (
                      <Image
                        src={item.image}
                        alt={item.title}
                        width={48}
                        height={48}
                        className="rounded-lg object-contain border border-gray-100 bg-gray-50 shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                        <svg
                          className="w-5 h-5 text-gray-400"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                        >
                          <rect x="3" y="3" width="18" height="18" rx="2" />
                          <path d="M3 9h18M9 21V9" />
                        </svg>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {item.title}
                      </p>
                      {(item.color || item.size) && (
                        <p className="text-xs text-gray-400">
                          {[item.color, item.size].filter(Boolean).join(" / ")}
                        </p>
                      )}
                      <p className="text-xs text-gray-500">
                        {t("success.qty")} {item.quantity}
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-gray-900 shrink-0">
                      ৳{((item.price || 0) * item.quantity).toFixed(0)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Total */}
          {!loading && order && (
            <div className="py-4 text-sm">
              <p className="text-gray-500 text-xs mb-1">
                Total (Inc. delivery
                {order.shipping > 0 ? ` - ${order.shipping}` : ""})
              </p>
              <p className="text-2xl font-extrabold text-gray-900">
                ৳{(order.total || 0).toFixed(0)}
              </p>
            </div>
          )}

          {/* Payment Status */}
          {!loading && order && (
            <div className="py-4 text-sm">
              <p className="text-gray-500 text-xs mb-1">
                {t("success.payment_status")}
              </p>
              <p
                className={`font-semibold capitalize ${
                  order.paymentStatus === "paid"
                    ? "text-green-600"
                    : order.paymentStatus === "cancelled"
                      ? "text-red-500"
                      : "text-orange-500"
                }`}
              >
                {order.paymentStatus === "cod"
                  ? t("success.cash_on_delivery")
                  : order.paymentStatus}
              </p>
            </div>
          )}

          {/* Note */}
          {!loading && billing.note && (
            <div className="py-4 text-sm">
              <p className="text-gray-500 text-xs mb-1">
                {t("success.order_note")}
              </p>
              <p className="text-gray-700">{billing.note}</p>
            </div>
          )}

          {/* 3-hour cancel window — edit + cancel */}
          {canCancel && !cancelled && (
            <div className="py-4">
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-sm">
                <p className="text-orange-700 font-medium mb-1">
                  {t("success.edit_cancel_time")} {fmtTime(timeLeft)}
                </p>

                {isEditing ? (
                  <div className="mt-2 border border-orange-200 rounded-xl overflow-hidden">
                    {/* Sticky header */}
                    <div className="sticky top-0 z-10 bg-orange-100 border-b border-orange-200 px-3 py-2 flex items-center justify-between">
                      <p className="text-xs font-bold text-orange-800">
                        {t("orders.edit_title")}
                      </p>
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => setIsEditing(false)}
                          className="px-2 py-1 border border-gray-300 rounded-lg text-xs hover:bg-white transition"
                        >
                          {t("orders.edit_cancel")}
                        </button>
                        <button
                          onClick={handleSaveEdit}
                          disabled={editSaving}
                          className="px-3 py-1 bg-orange-500 text-white rounded-lg text-xs font-semibold hover:bg-orange-600 disabled:opacity-60 transition"
                        >
                          {editSaving
                            ? t("orders.saving")
                            : t("orders.edit_save")}
                        </button>
                      </div>
                    </div>

                    <div className="max-h-[60vh] overflow-y-auto p-2.5 space-y-2.5">
                      {/* Delivery address */}
                      <div className="bg-white rounded-xl border border-orange-100 p-2.5 space-y-1.5">
                        <p className="text-xs font-semibold text-gray-500">
                          {t("orders.edit_address")}
                        </p>
                        <div className="grid grid-cols-2 gap-1.5">
                          {[
                            { key: "name", ph: t("orders.name_ph") },
                            { key: "phone", ph: t("orders.phone_ph") },
                            { key: "city", ph: t("orders.city_ph") },
                            { key: "zone", ph: t("orders.zone_ph") },
                            { key: "area", ph: t("orders.area_ph") },
                            { key: "email", ph: t("orders.email_ph") },
                          ].map(({ key, ph }) => (
                            <input
                              key={key}
                              value={editBilling[key]}
                              onChange={(e) =>
                                setEditBilling((prev) => ({
                                  ...prev,
                                  [key]: e.target.value,
                                }))
                              }
                              placeholder={ph}
                              className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-400 outline-none"
                            />
                          ))}
                        </div>
                        <input
                          value={editBilling.address}
                          onChange={(e) =>
                            setEditBilling((prev) => ({
                              ...prev,
                              address: e.target.value,
                            }))
                          }
                          placeholder={t("orders.address_ph")}
                          className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-400 outline-none"
                        />
                        <input
                          value={editBilling.note}
                          onChange={(e) =>
                            setEditBilling((prev) => ({
                              ...prev,
                              note: e.target.value,
                            }))
                          }
                          placeholder={t("orders.note_ph")}
                          className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-400 outline-none"
                        />
                      </div>

                      {/* Existing items */}
                      <div className="bg-white rounded-xl border border-orange-100 p-2.5 space-y-2">
                        <p className="text-xs font-semibold text-gray-500">
                          {t("orders.edit_items")}
                        </p>
                        {editItems.map((item, i) => {
                          const colors = getItemColors(item.productId);
                          const sizes = getItemSizes(item.productId);
                          return (
                            <div
                              key={i}
                              className="rounded-xl border border-gray-100 bg-gray-50 p-2 space-y-1.5"
                            >
                              <div className="flex items-center gap-2">
                                {item.image && (
                                  <Image
                                    src={item.image}
                                    alt={item.title}
                                    width={32}
                                    height={32}
                                    className="w-8 h-8 rounded-lg object-cover shrink-0"
                                  />
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-medium truncate">
                                    {item.title}
                                  </p>
                                  <p className="text-xs text-orange-600 font-semibold">
                                    ৳{item.price}
                                  </p>
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                  <button
                                    onClick={() => updateQty(i, -1)}
                                    className="w-5 h-5 rounded bg-gray-200 text-xs font-bold flex items-center justify-center"
                                  >
                                    −
                                  </button>
                                  <span className="w-5 text-center text-xs font-bold">
                                    {item.quantity}
                                  </span>
                                  <button
                                    onClick={() => updateQty(i, 1)}
                                    className="w-5 h-5 rounded bg-gray-200 text-xs font-bold flex items-center justify-center"
                                  >
                                    +
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (editItems.length <= 1) {
                                        alert(t("orders.at_least_one"));
                                        return;
                                      }
                                      setEditItems((prev) =>
                                        prev.filter((_, idx) => idx !== i),
                                      );
                                    }}
                                    className="w-5 h-5 rounded bg-red-100 text-red-500 hover:bg-red-200 text-xs font-bold flex items-center justify-center ml-0.5"
                                  >
                                    ✕
                                  </button>
                                </div>
                              </div>
                              {colors.length > 0 && (
                                <div className="flex flex-wrap items-center gap-1">
                                  <span className="text-xs text-gray-400">
                                    Color:
                                  </span>
                                  {colors.map((c) => (
                                    <button
                                      key={c}
                                      type="button"
                                      onClick={() =>
                                        setEditItems((prev) =>
                                          prev.map((it, idx) => {
                                            if (idx !== i) return it;
                                            const nc =
                                              it.color === c ? null : c;
                                            const np = getVariantPrice(
                                              it.productId,
                                              nc,
                                              it.size,
                                            );
                                            return {
                                              ...it,
                                              color: nc,
                                              ...(np != null
                                                ? { price: np }
                                                : {}),
                                            };
                                          }),
                                        )
                                      }
                                      className={`px-1.5 py-0.5 rounded-full text-xs border transition ${item.color === c ? "bg-orange-500 text-white border-orange-500" : "border-gray-300 text-gray-600 hover:border-orange-400"}`}
                                    >
                                      {c}
                                    </button>
                                  ))}
                                </div>
                              )}
                              {sizes.length > 0 && (
                                <div className="flex flex-wrap items-center gap-1">
                                  <span className="text-xs text-gray-400">
                                    Size:
                                  </span>
                                  {sizes.map((s) => (
                                    <button
                                      key={s}
                                      type="button"
                                      onClick={() =>
                                        setEditItems((prev) =>
                                          prev.map((it, idx) => {
                                            if (idx !== i) return it;
                                            const ns = it.size === s ? null : s;
                                            const np = getVariantPrice(
                                              it.productId,
                                              it.color,
                                              ns,
                                            );
                                            return {
                                              ...it,
                                              size: ns,
                                              ...(np != null
                                                ? { price: np }
                                                : {}),
                                            };
                                          }),
                                        )
                                      }
                                      className={`px-1.5 py-0.5 rounded-full text-xs border font-mono transition ${item.size === s ? "bg-gray-800 text-white border-gray-800" : "border-gray-300 text-gray-600 hover:border-gray-500"}`}
                                    >
                                      {s}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Pending new items */}
                      {pendingNewItems.length > 0 && (
                        <div className="bg-white rounded-xl border border-green-100 p-2.5 space-y-1.5">
                          <p className="text-xs font-semibold text-green-700">
                            {t("orders.pending_adds")} ({pendingNewItems.length}
                            )
                          </p>
                          {pendingNewItems.map((ni, idx) => (
                            <div
                              key={idx}
                              className="flex items-center gap-2 p-1.5 rounded-lg bg-green-50"
                            >
                              {ni.product.images?.[0]?.url && (
                                <Image
                                  src={ni.product.images[0].url}
                                  alt={ni.product.title}
                                  width={28}
                                  height={28}
                                  className="w-7 h-7 rounded object-cover shrink-0"
                                />
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium truncate">
                                  {ni.product.title}
                                </p>
                                {(ni.color || ni.size) && (
                                  <p className="text-xs text-gray-400">
                                    {[ni.color, ni.size]
                                      .filter(Boolean)
                                      .join(" / ")}
                                  </p>
                                )}
                                <p className="text-xs text-gray-500">
                                  Qty: {ni.qty} · ৳
                                  {(ni.price * ni.qty).toFixed(0)}
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() =>
                                  setPendingNewItems((prev) =>
                                    prev.filter((_, j) => j !== idx),
                                  )
                                }
                                className="text-red-400 hover:text-red-600 text-xs font-bold"
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Add products */}
                      <div className="bg-white rounded-xl border border-orange-100 p-2.5 space-y-2">
                        <p className="text-xs font-semibold text-gray-500">
                          Add New Product
                        </p>
                        <input
                          className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-400 outline-none"
                          placeholder={t("orders.search_placeholder")}
                          value={productSearch}
                          onChange={(e) => {
                            setProductSearch(e.target.value);
                            searchProducts(e.target.value);
                          }}
                        />
                        {searchLoading && (
                          <p className="text-xs text-gray-400 text-center">
                            {t("orders.searching")}
                          </p>
                        )}
                        {!searchLoading &&
                          productSearch &&
                          searchResults.length === 0 && (
                            <p className="text-xs text-gray-400 text-center">
                              {t("orders.not_found")}
                            </p>
                          )}
                        {searchResults.length > 0 && (
                          <div className="space-y-1.5 max-h-48 overflow-y-auto">
                            {searchResults.map((product) => (
                              <ProductAddCardSuccess
                                key={product._id}
                                product={product}
                                onAdd={(color, size, qty, price) => {
                                  setPendingNewItems((prev) => [
                                    ...prev,
                                    { product, color, size, qty, price },
                                  ]);
                                  setSearchResults([]);
                                  setProductSearch("");
                                }}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={openEdit}
                      className="flex-1 py-2 border border-orange-400 text-orange-700 rounded-lg text-xs font-semibold hover:bg-orange-100"
                    >
                      {t("orders.edit_order")}
                    </button>
                    <button
                      onClick={openCancelModal}
                      disabled={cancelLoading}
                      className="flex-1 py-2 bg-red-500 text-white rounded-lg text-xs font-semibold hover:bg-red-600 disabled:opacity-60"
                    >
                      {t("orders.cancel_order")}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Help */}
          <div className="py-4 text-sm flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-xs mb-1">
                {t("success.need_help")}
              </p>
              <p className="font-semibold text-gray-800">{PHONE}</p>
            </div>
            <a
              href={`tel:${PHONE}`}
              className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-200 transition"
            >
              <svg
                className="w-5 h-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 11.1 19.79 19.79 0 01.04 2.4 2 2 0 012 .22h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
              </svg>
            </a>
          </div>

          {/* Social icons — sourced from dashboard/policy-pages Footer tab.
              Icons with "Show" checked render in their brand color; the
              rest still render (not hidden), just muted grey. */}
          <div className="py-4 flex justify-center gap-5">
            {Object.entries(SOCIAL_ICON_MAP)
              .filter(([key]) => socialLinks?.[key]?.url)
              .map(([key, { Icon, color }]) => {
                const link = socialLinks[key];
                const highlighted = link.enabled !== false;
                return (
                  <a
                    key={key}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: highlighted ? color : "#d1d5db" }}
                    className="transition-opacity hover:opacity-80"
                  >
                    <Icon />
                  </a>
                );
              })}
            {/* fallback if nothing configured yet */}
            {!Object.values(socialLinks || {}).some((l) => l?.url) && (
              <>
                <span className="text-gray-300">
                  <Facebook />
                </span>
                <span className="text-gray-300">
                  <Instagram />
                </span>
                <span className="text-gray-300">
                  <Twitter />
                </span>
                <span className="text-gray-300">
                  <TikTok />
                </span>
                <span className="text-gray-300">
                  <YouTube />
                </span>
              </>
            )}
          </div>
        </div>

        {/* Cancel reason modal */}
        {showCancelModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
              <h3 className="text-base font-bold text-gray-900">
                {t("orders.cancel_reason_title")}
              </h3>
              <p className="text-xs text-gray-500">
                {t("orders.cancel_confirm")}
              </p>
              <textarea
                autoFocus
                rows={3}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-400 outline-none resize-none"
                placeholder={t("orders.cancel_reason_placeholder")}
                value={cancelReason}
                onChange={(e) => {
                  setCancelReason(e.target.value);
                  setCancelReasonError("");
                }}
              />
              {cancelReasonError && (
                <p className="text-xs text-red-500">{cancelReasonError}</p>
              )}
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => setShowCancelModal(false)}
                  disabled={cancelLoading}
                  className="flex-1 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition disabled:opacity-60"
                >
                  {t("orders.edit_cancel")}
                </button>
                <button
                  onClick={handleConfirmCancel}
                  disabled={cancelLoading}
                  className="flex-1 py-2 bg-red-500 text-white rounded-lg text-sm font-semibold hover:bg-red-600 transition disabled:opacity-60"
                >
                  {cancelLoading
                    ? t("orders.cancelling")
                    : t("orders.cancel_reason_submit")}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Continue shopping button */}
        <div className="px-6 pb-6 pt-2">
          <Link
            href="/"
            className="flex items-center justify-center gap-2 w-full py-3 bg-gray-900 text-white rounded-xl font-semibold hover:bg-gray-800 transition text-sm"
          >
            {t("success.continue_shopping")}
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense>
      <SuccessContent />
    </Suspense>
  );
}
