"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useUser } from "@/components/context/UserContext";
import { useParams, useRouter } from "next/navigation";
import AuthModal from "@/components/auth/AuthModal";
import { useLanguage } from "@/components/context/LanguageContext";
import WishlistPage from "@/components/cart/WishlistPage";
import AddressManager from "@/components/user/AddressManager";
import UserRewardsSection from "@/components/user/UserRewardsSection";
import UserLoyaltySection from "@/components/user/UserLoyaltySection";
import OrderTrackingTimeline from "@/components/order/OrderTrackingTimeline";
import { COUPONS, isNewUser } from "@/lib/coupons";
import { uploadUserImage } from "@/lib/uploadImage";

// ─── Orders Section ───────────────────────────────────────────────────────────
const STATUS_COLORS = {
  pending: "bg-yellow-100 text-yellow-800",
  accepted: "bg-blue-100 text-blue-800",
  approved: "bg-blue-100 text-blue-800",
  confirmed: "bg-blue-100 text-blue-800",
  picked: "bg-blue-100 text-blue-800",
  processing: "bg-indigo-100 text-indigo-800",
  shipped: "bg-purple-100 text-purple-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
  failed: "bg-gray-100 text-gray-600",
};

function OrderCountdown({ confirmAfter, onExpire }) {
  const { t } = useLanguage();
  const [left, setLeft] = React.useState(() =>
    Math.max(
      0,
      Math.floor((new Date(confirmAfter).getTime() - Date.now()) / 1000),
    ),
  );
  useEffect(() => {
    if (left <= 0) {
      onExpire?.();
      return;
    }
    const id = setInterval(() => {
      setLeft((prev) => {
        if (prev <= 1) {
          clearInterval(id);
          onExpire?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [confirmAfter]);
  const m = Math.floor(left / 60),
    s = left % 60;
  return (
    <span className="text-orange-600 font-mono text-xs">
      {m}:{String(s).padStart(2, "0")} {t("orders.left_to_cancel")}
    </span>
  );
}

function ProductAddCard({ product, onAdd }) {
  const { t } = useLanguage();
  const [selectedColor, setSelectedColor] = React.useState("");
  const [selectedSize, setSelectedSize] = React.useState("");
  const [qty, setQty] = React.useState(1);

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
    <div className="rounded-xl border border-gray-100 bg-gray-50 p-3 space-y-2">
      <div className="flex items-center gap-2">
        {product.images?.[0]?.url ? (
          <Image
            src={product.images[0].url}
            alt={product.title}
            width={40}
            height={40}
            className="w-10 h-10 rounded-lg object-cover shrink-0 border border-gray-200"
          />
        ) : (
          <div className="w-10 h-10 rounded-lg bg-gray-200 shrink-0" />
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
            className="w-6 h-6 rounded bg-gray-200 text-gray-700 text-sm font-bold hover:bg-gray-300 flex items-center justify-center"
          >
            −
          </button>
          <span className="w-6 text-center text-xs font-bold">{qty}</span>
          <button
            type="button"
            onClick={() => setQty((q) => q + 1)}
            className="w-6 h-6 rounded bg-gray-200 text-gray-700 text-sm font-bold hover:bg-gray-300 flex items-center justify-center"
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
              onClick={() => setSelectedColor((prev) => (prev === c ? "" : c))}
              className={`px-2 py-0.5 rounded-full text-xs border transition ${
                selectedColor === c
                  ? "bg-orange-500 text-white border-orange-500"
                  : "border-gray-300 text-gray-600 hover:border-orange-400"
              }`}
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
              onClick={() => setSelectedSize((prev) => (prev === s ? "" : s))}
              className={`px-2 py-0.5 rounded-full text-xs border font-mono transition ${
                selectedSize === s
                  ? "bg-gray-800 text-white border-gray-800"
                  : "border-gray-300 text-gray-600 hover:border-gray-500"
              }`}
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

function OrdersSection({ API }) {
  const { t } = useLanguage();
  const [orders, setOrders] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [expanded, setExpanded] = React.useState(null);
  const [editOrderId, setEditOrderId] = React.useState(null);
  const [editBilling, setEditBilling] = React.useState({
    name: "",
    email: "",
    phone: "",
    city: "",
    zone: "",
    area: "",
    address: "",
    note: "",
  });
  const [editItems, setEditItems] = React.useState([]);
  const [saving, setSaving] = React.useState(false);
  const [retrying, setRetrying] = React.useState(null);
  const [cancelModalOrderId, setCancelModalOrderId] = React.useState(null);
  const [cancelReason, setCancelReason] = React.useState("");
  const [cancelReasonError, setCancelReasonError] = React.useState("");
  const [cancelling, setCancelling] = React.useState(false);
  const [productVariantsMap, setProductVariantsMap] = React.useState({});
  const [pendingNewItems, setPendingNewItems] = React.useState([]);
  const [productSearch, setProductSearch] = React.useState("");
  const [searchResults, setSearchResults] = React.useState([]);
  const [searchLoading, setSearchLoading] = React.useState(false);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API}/api/orders/my`, { credentials: "include" });
      const d = await r.json();
      setOrders(d.orders || []);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    const handleFocus = () => fetchOrders();
    const handleVisibility = () => {
      if (document.visibilityState === "visible") fetchOrders();
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  const handleRetryPayment = async (orderId) => {
    setRetrying(orderId);
    try {
      const r = await fetch(`${API}/api/orders/${orderId}/pay`, {
        method: "POST",
        credentials: "include",
      });
      const d = await r.json();
      if (d.ok && d.url) {
        window.location.href = d.url;
      } else {
        alert(d.error || "Could not initiate payment. Please try again.");
      }
    } catch {
      alert("Failed to reach payment gateway. Please try again.");
    } finally {
      setRetrying(null);
    }
  };

  const openCancelModal = (orderId) => {
    setCancelModalOrderId(orderId);
    setCancelReason("");
    setCancelReasonError("");
  };

  const handleConfirmCancel = async () => {
    const trimmed = cancelReason.trim();
    if (trimmed.length < 5) {
      setCancelReasonError(t("orders.cancel_reason_min"));
      return;
    }
    setCancelling(true);
    try {
      const r = await fetch(`${API}/api/orders/${cancelModalOrderId}/cancel`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: trimmed }),
      });
      const d = await r.json();
      if (d.ok) {
        setOrders((prev) =>
          prev.map((o) =>
            o._id === cancelModalOrderId
              ? { ...o, status: "cancelled", paymentStatus: "cancelled" }
              : o,
          ),
        );
        setCancelModalOrderId(null);
      } else {
        alert(d.error || "Could not cancel order.");
      }
    } catch {
      alert("Failed. Please try again.");
    } finally {
      setCancelling(false);
    }
  };

  const openEdit = async (order) => {
    setEditOrderId(order._id);
    setEditBilling({
      name: order.billingDetails?.name || "",
      email: order.billingDetails?.email || "",
      phone: order.billingDetails?.phone || "",
      city: order.billingDetails?.city || "",
      zone: order.billingDetails?.zone || "",
      area: order.billingDetails?.area || "",
      address: order.billingDetails?.address || "",
      note: order.billingDetails?.note || "",
    });
    setEditItems(
      (order.items || []).map((item, index) => ({ ...item, index })),
    );
    setPendingNewItems([]);
    setProductSearch("");
    setSearchResults([]);
    // Fetch variants for existing products
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
    setSaving(true);
    try {
      const r = await fetch(`${API}/api/orders/${editOrderId}/edit`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          billingDetails: editBilling,
          items: editItems.map((item, index) => ({
            index,
            productId: item.productId,
            quantity: item.quantity,
            color: item.color ?? null,
            size: item.size ?? null,
          })),
          addItems: pendingNewItems.map((ni) => ({
            productId: ni.product._id,
            quantity: ni.qty,
            color: ni.color || null,
            size: ni.size || null,
          })),
        }),
      });
      const d = await r.json();
      if (d.ok) {
        setOrders((prev) =>
          prev.map((o) => (o._id === editOrderId ? d.order : o)),
        );
        setEditOrderId(null);
        setPendingNewItems([]);
        setProductSearch("");
        setSearchResults([]);
      } else {
        alert(d.error || "Could not update order.");
      }
    } catch {
      alert("Failed. Please try again.");
    } finally {
      setSaving(false);
    }
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
        `${API}/api/products?q=${encodeURIComponent(trimmed)}&limit=8&status=published`,
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
      const sc = (color || "").toLowerCase();
      const ss = (size || "").toLowerCase();
      return (!sc || vc === sc) && (!ss || vs === ss);
    });
    return v?.price ?? prod.price ?? null;
  };

  const shortId = (id) => {
    const suffix = String(id).slice(-8).toUpperCase();
    return `#${suffix}`;
  };
  const fmtDate = (d) =>
    new Date(d).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  if (loading)
    return (
      <div className="bg-white rounded-lg shadow p-10 flex justify-center">
        <svg
          className="animate-spin w-8 h-8 text-red-500"
          viewBox="0 0 24 24"
          fill="none"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v8H4z"
          />
        </svg>
      </div>
    );

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-semibold">{t("orders.title")}</h2>
        <p className="text-sm text-gray-500 mt-1">
          {orders.length} {t("orders.items_count")}
        </p>
      </div>

      {orders.length === 0 && (
        <div className="bg-white rounded-lg shadow p-10 text-center text-gray-500">
          <svg
            className="w-16 h-16 mx-auto mb-4 text-gray-300"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path d="M9 2H4a2 2 0 00-2 2v16a2 2 0 002 2h16a2 2 0 002-2V9l-7-7z" />
            <path d="M14 2v6h6" />
          </svg>
          <p className="font-medium">{t("orders.empty")}</p>
        </div>
      )}

      {/* Cancel reason modal */}
      {cancelModalOrderId && (
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
                onClick={() => setCancelModalOrderId(null)}
                disabled={cancelling}
                className="flex-1 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition disabled:opacity-60"
              >
                {t("orders.edit_cancel")}
              </button>
              <button
                onClick={handleConfirmCancel}
                disabled={cancelling}
                className="flex-1 py-2 bg-red-500 text-white rounded-lg text-sm font-semibold hover:bg-red-600 transition disabled:opacity-60"
              >
                {cancelling
                  ? t("orders.cancelling")
                  : t("orders.cancel_reason_submit")}
              </button>
            </div>
          </div>
        </div>
      )}

      {orders.map((order) => {
        const billing = order.billingDetails || {};
        const now = Date.now();
        const canAct =
          order.status === "pending" &&
          order.paymentMethod === "cash-on-delivery" &&
          order.confirmAfter &&
          new Date(order.confirmAfter).getTime() > now;
        const canPayOnline =
          order.status === "pending" &&
          order.paymentStatus === "unpaid" &&
          order.paymentMethod !== "cash-on-delivery";
        const isOpen = expanded === order._id;
        const isEditing = editOrderId === order._id;

        return (
          <div
            key={order._id}
            className="bg-white rounded-lg shadow overflow-hidden"
          >
            {/* Order header row */}
            <button
              className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 text-left"
              onClick={() => setExpanded(isOpen ? null : order._id)}
            >
              {/* Item image strip (up to 3) */}
              <div className="flex -space-x-2 shrink-0">
                {(order.items || []).slice(0, 3).map((item, i) =>
                  item.image ? (
                    <Image
                      key={i}
                      src={item.image}
                      alt={item.title}
                      width={36}
                      height={36}
                      className="rounded-lg object-contain border-2 border-white bg-gray-50 w-9 h-9"
                    />
                  ) : (
                    <div
                      key={i}
                      className="w-9 h-9 rounded-lg bg-gray-100 border-2 border-white flex items-center justify-center"
                    >
                      <svg
                        className="w-4 h-4 text-gray-400"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      >
                        <rect x="3" y="3" width="18" height="18" rx="2" />
                        <path d="M3 9h18M9 21V9" />
                      </svg>
                    </div>
                  ),
                )}
                {(order.items?.length || 0) > 3 && (
                  <div className="w-9 h-9 rounded-lg bg-gray-200 border-2 border-white flex items-center justify-center text-xs font-semibold text-gray-600">
                    +{order.items.length - 3}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-gray-900">
                    {shortId(order._id)}
                  </span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-semibold capitalize ${STATUS_COLORS[order.status] || "bg-gray-100 text-gray-600"}`}
                  >
                    {t(`status.${order.status}`) || order.status}
                  </span>
                  {order.paymentMethod === "cash-on-delivery" && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                      {t("pay.cod")}
                    </span>
                  )}
                  {canPayOnline && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-rose-100 text-rose-600 font-semibold">
                      {t("pay.unpaid")}
                    </span>
                  )}
                  {canAct && (
                    <OrderCountdown
                      confirmAfter={order.confirmAfter}
                      onExpire={fetchOrders}
                    />
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  {fmtDate(order.createdAt)} · {order.items?.length || 0} item
                  {order.items?.length !== 1 ? "s" : ""}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="font-bold text-gray-900">
                  ৳{(order.total || 0).toFixed(2)}
                </p>
                <svg
                  className={`w-4 h-4 ml-auto mt-1 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </div>
            </button>

            {/* Expanded details */}
            {isOpen && (
              <div className="border-t border-gray-100 px-4 pb-4 pt-3 space-y-4">
                {/* Items */}
                <div className="space-y-3">
                  {(order.items || []).map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Link
                        href={`/product/${item.productId}`}
                        className="shrink-0 block"
                      >
                        {item.image ? (
                          <Image
                            src={item.image}
                            alt={item.title}
                            width={52}
                            height={52}
                            className="rounded-lg object-contain border border-gray-100 bg-gray-50 w-13 h-13 hover:opacity-80 transition"
                          />
                        ) : (
                          <div className="w-13 h-13 w-[52px] h-[52px] rounded-lg bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition">
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
                      </Link>
                      <div className="flex-1 min-w-0">
                        <Link
                          href={`/product/${item.productId}`}
                          className="text-sm font-medium text-gray-900 hover:text-red-600 transition truncate block"
                        >
                          {item.title}
                        </Link>
                        {(item.color || item.size) && (
                          <p className="text-xs text-gray-400">
                            {[item.color, item.size]
                              .filter(Boolean)
                              .join(" / ")}
                          </p>
                        )}
                        <p className="text-xs text-gray-500">
                          ৳{item.price} × {item.quantity}
                        </p>
                      </div>
                      <p className="text-sm font-semibold shrink-0">
                        ৳{((item.price || 0) * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Totals */}
                <div className="bg-gray-50 rounded-lg p-3 text-sm space-y-1">
                  <div className="flex justify-between text-gray-600">
                    <span>{t("orders.subtotal")}</span>
                    <span>৳{(order.subtotal || 0).toFixed(2)}</span>
                  </div>
                  {order.discount > 0 && (
                    <div className="flex justify-between text-green-700">
                      <span>{t("orders.discount")}</span>
                      <span>-৳{order.discount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-gray-600">
                    <span>{t("orders.shipping")}</span>
                    <span>৳{(order.shipping || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold border-t border-gray-200 pt-1 mt-1">
                    <span>{t("orders.total")}</span>
                    <span>৳{(order.total || 0).toFixed(2)}</span>
                  </div>
                </div>

                {/* Delivery address */}
                <div className="text-sm text-gray-700">
                  <p className="font-medium text-gray-900 mb-0.5">
                    {t("orders.edit_address")}
                  </p>
                  <p>
                    {billing.name}
                    {billing.phone ? " · " + billing.phone : ""}
                  </p>
                  <p>
                    {[billing.address, billing.zone, billing.city]
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                  {billing.note && (
                    <p className="text-gray-500 mt-1">Note: {billing.note}</p>
                  )}
                </div>

                {/* Status change reasons — admin updates and the customer's own
                    cancellation reason both come from statusHistory */}
                {(order.statusHistory || []).some((ev) => ev.reason) && (
                  <div className="text-sm">
                    <p className="font-medium text-gray-900 mb-1.5">
                      {t("orders.status_updates")}
                    </p>
                    <div className="space-y-1.5">
                      {[...(order.statusHistory || [])]
                        .reverse()
                        .filter((ev) => ev.reason)
                        .map((ev, i) => (
                          <div
                            key={i}
                            className="bg-gray-50 border border-gray-100 rounded-lg px-3 py-2"
                          >
                            <div className="flex flex-wrap items-center gap-2">
                              <span
                                className={`text-xs px-2 py-0.5 rounded-full font-semibold capitalize ${STATUS_COLORS[ev.newStatus] || "bg-gray-100 text-gray-600"}`}
                              >
                                {ev.newStatus}
                              </span>
                              <span className="text-xs text-gray-400">
                                {ev.changedBy === "customer"
                                  ? t("orders.by_you")
                                  : t("orders.by_store")}
                              </span>
                              {ev.at && (
                                <span className="text-xs text-gray-400 ml-auto">
                                  {new Date(ev.at).toLocaleDateString("en-GB", {
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric",
                                  })}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-600 mt-1">
                              <span className="text-gray-400">
                                {t("orders.status_reason")}:{" "}
                              </span>
                              {ev.reason}
                            </p>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {(order.shipment?.trackingId ||
                  ["confirmed", "processing", "shipped", "delivered"].includes(
                    order.status,
                  )) && <OrderTrackingTimeline order={order} />}

                {/* Edit form */}
                {isEditing ? (
                  <div className="border border-orange-200 rounded-xl bg-orange-50 overflow-hidden">
                    {/* Sticky header */}
                    <div className="sticky top-0 z-10 bg-orange-100 border-b border-orange-200 px-4 py-2.5 flex items-center justify-between">
                      <p className="text-sm font-bold text-orange-800">
                        {t("orders.edit_title")}
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setEditOrderId(null)}
                          className="px-3 py-1 border border-gray-300 rounded-lg text-xs hover:bg-white transition"
                        >
                          {t("orders.edit_cancel")}
                        </button>
                        <button
                          onClick={handleSaveEdit}
                          disabled={saving}
                          className="px-4 py-1 bg-orange-500 text-white rounded-lg text-xs font-semibold hover:bg-orange-600 disabled:opacity-60 transition"
                        >
                          {saving ? t("orders.saving") : t("orders.edit_save")}
                        </button>
                      </div>
                    </div>

                    {/* Scrollable body */}
                    <div className="max-h-[70vh] overflow-y-auto p-3 space-y-3">
                      {/* Delivery address */}
                      <div className="bg-white rounded-xl border border-orange-100 p-3 space-y-2">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                          {t("orders.edit_address")}
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {[
                            { key: "name", placeholder: t("orders.name_ph") },
                            { key: "phone", placeholder: t("orders.phone_ph") },
                            { key: "email", placeholder: t("orders.email_ph") },
                            { key: "city", placeholder: t("orders.city_ph") },
                            { key: "zone", placeholder: t("orders.zone_ph") },
                            { key: "area", placeholder: t("orders.area_ph") },
                          ].map(({ key, placeholder }) => (
                            <input
                              key={key}
                              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-400 outline-none"
                              placeholder={placeholder}
                              value={editBilling[key]}
                              onChange={(e) =>
                                setEditBilling((prev) => ({
                                  ...prev,
                                  [key]: e.target.value,
                                }))
                              }
                            />
                          ))}
                        </div>
                        <textarea
                          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-400 outline-none resize-none"
                          rows={2}
                          placeholder={t("orders.address_ph")}
                          value={editBilling.address}
                          onChange={(e) =>
                            setEditBilling((prev) => ({
                              ...prev,
                              address: e.target.value,
                            }))
                          }
                        />
                        <textarea
                          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-400 outline-none resize-none"
                          rows={2}
                          placeholder={t("orders.note_ph")}
                          value={editBilling.note}
                          onChange={(e) =>
                            setEditBilling((prev) => ({
                              ...prev,
                              note: e.target.value,
                            }))
                          }
                        />
                      </div>

                      {/* Existing items */}
                      <div className="bg-white rounded-xl border border-orange-100 p-3 space-y-2">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                          {t("orders.edit_items")}
                        </p>
                        {editItems.map((item, itemIndex) => {
                          const colors = getItemColors(item.productId);
                          const sizes = getItemSizes(item.productId);
                          return (
                            <div
                              key={itemIndex}
                              className="rounded-xl border border-gray-100 bg-gray-50 p-3 space-y-2"
                            >
                              <div className="flex items-center gap-2">
                                {item.image && (
                                  <Image
                                    src={item.image}
                                    alt={item.title}
                                    width={40}
                                    height={40}
                                    className="w-10 h-10 rounded-lg object-cover shrink-0 border border-gray-200"
                                  />
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-medium text-gray-800 truncate">
                                    {item.title}
                                  </p>
                                  <p className="text-xs text-orange-600 font-semibold">
                                    ৳{item.price}
                                  </p>
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                  <button
                                    onClick={() =>
                                      setEditItems((prev) =>
                                        prev.map((c, i) =>
                                          i === itemIndex
                                            ? {
                                                ...c,
                                                quantity: Math.max(
                                                  1,
                                                  Number(c.quantity || 1) - 1,
                                                ),
                                              }
                                            : c,
                                        ),
                                      )
                                    }
                                    className="w-6 h-6 rounded bg-gray-200 text-gray-700 font-bold text-sm hover:bg-gray-300 flex items-center justify-center"
                                  >
                                    −
                                  </button>
                                  <span className="w-7 text-center text-sm font-bold">
                                    {item.quantity}
                                  </span>
                                  <button
                                    onClick={() =>
                                      setEditItems((prev) =>
                                        prev.map((c, i) =>
                                          i === itemIndex
                                            ? {
                                                ...c,
                                                quantity:
                                                  Number(c.quantity || 1) + 1,
                                              }
                                            : c,
                                        ),
                                      )
                                    }
                                    className="w-6 h-6 rounded bg-gray-200 text-gray-700 font-bold text-sm hover:bg-gray-300 flex items-center justify-center"
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
                                        prev.filter((_, i) => i !== itemIndex),
                                      );
                                    }}
                                    className="w-6 h-6 rounded bg-red-100 text-red-500 hover:bg-red-200 text-xs font-bold flex items-center justify-center ml-1"
                                    title="সরিয়ে দিন"
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
                                          prev.map((it, i) => {
                                            if (i !== itemIndex) return it;
                                            const newColor =
                                              it.color === c ? null : c;
                                            const newPrice = getVariantPrice(
                                              it.productId,
                                              newColor,
                                              it.size,
                                            );
                                            return {
                                              ...it,
                                              color: newColor,
                                              ...(newPrice != null
                                                ? { price: newPrice }
                                                : {}),
                                            };
                                          }),
                                        )
                                      }
                                      className={`px-2 py-0.5 rounded-full text-xs border transition ${item.color === c ? "bg-orange-500 text-white border-orange-500" : "border-gray-300 text-gray-600 hover:border-orange-400"}`}
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
                                          prev.map((it, i) => {
                                            if (i !== itemIndex) return it;
                                            const newSize =
                                              it.size === s ? null : s;
                                            const newPrice = getVariantPrice(
                                              it.productId,
                                              it.color,
                                              newSize,
                                            );
                                            return {
                                              ...it,
                                              size: newSize,
                                              ...(newPrice != null
                                                ? { price: newPrice }
                                                : {}),
                                            };
                                          }),
                                        )
                                      }
                                      className={`px-2 py-0.5 rounded-full text-xs border font-mono transition ${item.size === s ? "bg-gray-800 text-white border-gray-800" : "border-gray-300 text-gray-600 hover:border-gray-500"}`}
                                    >
                                      {s}
                                    </button>
                                  ))}
                                </div>
                              )}
                              {colors.length === 0 &&
                                sizes.length === 0 &&
                                (item.color || item.size) && (
                                  <p className="text-xs text-gray-400">
                                    {[item.color, item.size]
                                      .filter(Boolean)
                                      .join(" / ")}
                                  </p>
                                )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Pending new items preview */}
                      {pendingNewItems.length > 0 && (
                        <div className="bg-white rounded-xl border border-green-100 p-3 space-y-2">
                          <p className="text-xs font-semibold text-green-700 uppercase tracking-wide">
                            {t("orders.pending_adds")} ({pendingNewItems.length}
                            )
                          </p>
                          {pendingNewItems.map((ni, i) => (
                            <div
                              key={i}
                              className="flex items-center gap-2 p-2 rounded-lg bg-green-50 border border-green-100"
                            >
                              {ni.product.images?.[0]?.url && (
                                <Image
                                  src={ni.product.images[0].url}
                                  alt={ni.product.title}
                                  width={32}
                                  height={32}
                                  className="w-8 h-8 rounded-lg object-cover shrink-0"
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
                                    prev.filter((_, idx) => idx !== i),
                                  )
                                }
                                className="text-red-400 hover:text-red-600 text-sm font-bold shrink-0"
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Add more products */}
                      <div className="bg-white rounded-xl border border-orange-100 p-3 space-y-2">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                          {t("orders.add_product_title")}
                        </p>
                        <input
                          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-400 outline-none"
                          placeholder={t("orders.search_placeholder")}
                          value={productSearch}
                          onChange={(e) => {
                            setProductSearch(e.target.value);
                            searchProducts(e.target.value);
                          }}
                        />
                        {searchLoading && (
                          <p className="text-xs text-gray-400 text-center py-2">
                            {t("orders.searching")}
                          </p>
                        )}
                        {!searchLoading &&
                          productSearch &&
                          searchResults.length === 0 && (
                            <p className="text-xs text-gray-400 text-center py-2">
                              {t("orders.not_found")}
                            </p>
                          )}
                        {searchResults.length > 0 && (
                          <div className="space-y-2 max-h-56 overflow-y-auto pr-0.5">
                            {searchResults.map((product) => (
                              <ProductAddCard
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
                  <>
                    {canPayOnline && (
                      <button
                        onClick={() => handleRetryPayment(order._id)}
                        disabled={retrying === order._id}
                        className="w-full py-2.5 bg-rose-500 text-white rounded-lg text-sm font-semibold hover:bg-rose-600 disabled:opacity-60 transition"
                      >
                        {retrying === order._id
                          ? t("orders.retrying")
                          : "💳 " + t("orders.pay_now")}
                      </button>
                    )}
                    {canAct && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => openEdit(order)}
                          className="flex-1 py-2 border border-orange-400 text-orange-600 rounded-lg text-sm font-medium hover:bg-orange-50 transition"
                        >
                          {t("orders.edit_order")}
                        </button>
                        <button
                          onClick={() => openCancelModal(order._id)}
                          className="flex-1 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition"
                        >
                          {t("orders.cancel_order")}
                        </button>
                      </div>
                    )}
                    {[
                      "accepted",
                      "approved",
                      "confirmed",
                      "picked",
                      "processing",
                      "shipped",
                      "delivered",
                    ].includes(order.status) && (
                      <Link
                        href={`/user/orders/${order._id}/invoice`}
                        target="_blank"
                        className="w-full flex items-center justify-center gap-2 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition"
                      >
                        <svg
                          className="w-4 h-4"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M12 15V3m0 12l-4-4m4 4l4-4M2 17v2a2 2 0 002 2h16a2 2 0 002-2v-2" />
                        </svg>
                        Download Invoice
                      </Link>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function MyReviewsSection({ API }) {
  const [reviews, setReviews] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const r = await fetch(`${API}/api/products/my-reviews`, {
          credentials: "include",
        });
        const d = await r.json();
        setReviews(d.reviews || []);
      } catch {
        /* ignore */
      } finally {
        setLoading(false);
      }
    };
    fetchReviews();
  }, []);

  const fmtDate = (d) =>
    new Date(d).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  if (loading)
    return (
      <div className="bg-white rounded-lg shadow p-10 flex justify-center">
        <svg
          className="animate-spin w-8 h-8 text-red-500"
          viewBox="0 0 24 24"
          fill="none"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v8H4z"
          />
        </svg>
      </div>
    );

  return (
    <div className="bg-white rounded-lg shadow p-4 md:p-6">
      <h2 className="text-xl md:text-2xl font-semibold mb-4">My Reviews</h2>
      {reviews.length === 0 ? (
        <p className="text-gray-600">No reviews yet.</p>
      ) : (
        <div className="space-y-4">
          {reviews.map((rev) => (
            <Link
              key={`${rev.productId}-${rev.reviewIndex}`}
              href={`/product/${rev.productSlug || rev.productId}`}
              className="flex gap-3 p-3 border border-gray-100 rounded-lg hover:bg-gray-50 transition"
            >
              {rev.productImage ? (
                <Image
                  src={rev.productImage}
                  alt={rev.productTitle}
                  width={56}
                  height={56}
                  className="w-14 h-14 rounded-lg object-cover shrink-0 border border-gray-100"
                />
              ) : (
                <div className="w-14 h-14 rounded-lg bg-gray-100 shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {rev.productTitle}
                </p>
                <div className="flex items-center gap-1 mt-0.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg
                      key={star}
                      className={`w-4 h-4 ${star <= rev.rating ? "text-yellow-400" : "text-gray-200"}`}
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                  <span className="text-xs text-gray-400 ml-1">
                    {fmtDate(rev.createdAt)}
                  </span>
                </div>
                {rev.title && (
                  <p className="text-sm font-semibold text-gray-800 mt-1">
                    {rev.title}
                  </p>
                )}
                {rev.body && (
                  <p className="text-sm text-gray-600 mt-0.5 line-clamp-2">
                    {rev.body}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default function UserSectionPage() {
  const { user, setUser, refreshUser } = useUser();
  const { t } = useLanguage();
  const params = useParams();
  const router = useRouter();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    mobile: "",
    dob: "",
  });
  const [selectedImageFile, setSelectedImageFile] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [gravatarUrl, setGravatarUrl] = useState(null);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const section = params.section || "profile";

  useEffect(() => {
    if (!user) {
      setTimeout(() => setShowAuthModal(true), 0);
    }
  }, [user]);

  // compute gravatar when user email changes
  useEffect(() => {
    if (user && user.email) {
      const computeHash = async (email) => {
        const encoder = new TextEncoder();
        const data = encoder.encode(email.trim().toLowerCase());
        const hashBuffer = await crypto.subtle.digest("SHA-256", data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
      };
      computeHash(user.email).then((h) => {
        setGravatarUrl(`https://www.gravatar.com/avatar/${h}?d=identicon`);
      });
    }
  }, [user && user.email]);

  useEffect(() => {
    if (user && !isEditing) {
      setTimeout(() => {
        setEditForm({
          name: user.name || "",
          email: user.email || "",
          mobile: user.mobile || "",
          dob: user.dob || "",
        });
        setPreviewImage(user.image || gravatarUrl || null);
        setSelectedImageFile(null);
        setRemoveImage(false);
      }, 0);
    }
  }, [user, isEditing, gravatarUrl]);

  const handleSectionClick = (sec) => {
    setShowMobileMenu(false);
    router.push(`/user/${sec}`);
  };

  const handleLogout = async () => {
    try {
      const API = process.env.NEXT_PUBLIC_API_URL || "https://api.pickob.com";
      await fetch(`${API}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch (err) {
      // ignore
    }
    sessionStorage.removeItem("ya_access");
    setUser(null);
    router.push("/");
  };

  const handleSaveProfile = async () => {
    const API = process.env.NEXT_PUBLIC_API_URL || "https://api.pickob.com";
    try {
      const formData = new FormData();
      formData.append("name", editForm.name);
      formData.append("email", editForm.email);
      formData.append("mobile", editForm.mobile);
      formData.append("dob", editForm.dob);
      if (selectedImageFile) {
        // Upload the avatar straight to Cloudinary (bypasses Vercel's 4.5MB body
        // cap; anything up to 10MB works) and send just the resulting URL.
        const asset = await uploadUserImage(selectedImageFile, "Pickob/profiles");
        formData.append("imageUrl", asset.url);
        if (asset.public_id) formData.append("imagePublicId", asset.public_id);
      }
      if (removeImage && !selectedImageFile) {
        formData.append("removeImage", "1");
      }

      const res = await fetch(`${API}/api/user/profile`, {
        method: "PUT",
        credentials: "include",
        body: formData,
      });
      const data = await res.json();
      if (data.ok) {
        setIsEditing(false);
        refreshUser();
      } else {
        console.error("Profile save error", data);
        alert(data.error || "Failed to save profile");
      }
    } catch (err) {
      console.error(err);
      alert(err.message || "Failed to save profile");
    }
  };

  if (!user) {
    return (
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-2 -mb-2 md:-mb-5">
        {/* always-visible back button */}
        <button
          onClick={() => router.back()}
          className="mt-2 text-gray-500 rounded hover:text-gray-900"
        >
          {t("common.back")}
        </button>
      </div>
      <div className="max-w-7xl mx-auto py-6 md:py-8 px-3 md:px-4">
        <div className="lg:hidden mb-3">
          <button
            type="button"
            onClick={() => setShowMobileMenu(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-red-200 bg-white text-gray-800"
          >
            <span className="text-sm">☰</span>
            <span className="text-sm font-medium">{t("user.profile")}</span>
          </button>
        </div>

        {showMobileMenu && (
          <button
            type="button"
            className="fixed inset-0 z-40 bg-black/35 lg:hidden"
            onClick={() => setShowMobileMenu(false)}
            aria-label="Close account menu"
          />
        )}

        <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
          {/* Left Sidebar */}
          <div
            className={`${showMobileMenu ? "fixed inset-y-0 left-0 z-50 w-[85%] max-w-[340px] overflow-y-auto" : "hidden lg:block lg:w-80 lg:max-w-none lg:overflow-visible lg:sticky lg:top-24"} bg-white rounded-lg shadow h-fit`}
          >
            <div className="lg:hidden p-3 border-b border-gray-200 flex justify-end">
              <button
                type="button"
                onClick={() => setShowMobileMenu(false)}
                className="h-8 w-8 rounded bg-rose-500 text-white flex items-center justify-center"
                aria-label="Close menu"
              >
                ✕
              </button>
            </div>
            {/* User Profile Section */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center gap-3 mb-2">
                {previewImage ? (
                  <Image
                    src={previewImage}
                    alt={user.name || "User"}
                    width={56}
                    height={56}
                    className="w-14 h-14 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-orange-400 flex items-center justify-center text-white text-xl font-semibold">
                    {(user.name || user.email || "U").charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-lg truncate">
                    {user.name || "User"}
                  </h3>
                  <p className="text-sm text-gray-600 truncate">{user.email}</p>
                </div>
              </div>
            </div>

            {/* Navigation Menu */}
            <div className="py-4">
              {/* PROFILE Section */}
              <div className="mb-6">
                <h4 className="px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  {t("profile.section_profile")}
                </h4>
                <button
                  onClick={() => handleSectionClick("profile")}
                  className={`w-full text-left px-6 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors ${
                    section === "profile"
                      ? "bg-gray-100 border-l-4 border-red-600"
                      : ""
                  }`}
                >
                  <svg
                    className="w-5 h-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  <span>{t("profile.general_info")}</span>
                </button>
                <button
                  onClick={() => handleSectionClick("wishlist")}
                  className={`w-full text-left px-6 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors ${
                    section === "wishlist"
                      ? "bg-gray-100 border-l-4 border-red-600"
                      : ""
                  }`}
                >
                  <svg
                    className="w-5 h-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M20.8 4.6a5 5 0 0 0-7.1 0L12 6.3l-1.7-1.7a5 5 0 0 0-7.1 7.1L12 21l8.8-9.3a5 5 0 0 0 0-7.1z" />
                  </svg>
                  <span>{t("profile.favourites")}</span>
                </button>
                <button
                  onClick={() => {
                    setShowMobileMenu(false);
                    router.push("/cart");
                  }}
                  className={`w-full text-left px-6 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors`}
                >
                  <svg
                    className="w-5 h-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <circle cx="9" cy="20" r="1" />
                    <circle cx="20" cy="20" r="1" />
                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                  </svg>
                  <span>{t("profile.cart")}</span>
                </button>
              </div>

              {/* ORDERS Section */}
              <div className="mb-6">
                <h4 className="px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  {t("profile.section_orders")}
                </h4>
                <button
                  onClick={() => handleSectionClick("orders")}
                  className={`w-full text-left px-6 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors ${
                    section === "orders"
                      ? "bg-gray-100 border-l-4 border-red-600"
                      : ""
                  }`}
                >
                  <svg
                    className="w-5 h-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M9 2H4a2 2 0 0 0-2 2v5m0 9v3a2 2 0 0 0 2 2h5M15 2h5a2 2 0 0 1 2 2v5m0 9v3a2 2 0 0 1-2 2h-5" />
                  </svg>
                  <span>{t("user.orders")}</span>
                </button>
                <button
                  onClick={() => handleSectionClick("address")}
                  className={`w-full text-left px-6 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors ${
                    section === "address"
                      ? "bg-gray-100 border-l-4 border-red-600"
                      : ""
                  }`}
                >
                  <svg
                    className="w-5 h-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  <span>{t("profile.my_address")}</span>
                </button>
              </div>

              {/* OTHER Section */}
              <div className="mb-6">
                <h4 className="px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  {t("profile.section_other")}
                </h4>
                <button
                  onClick={() => handleSectionClick("reviews")}
                  className={`w-full text-left px-6 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors ${
                    section === "reviews"
                      ? "bg-gray-100 border-l-4 border-red-600"
                      : ""
                  }`}
                >
                  <svg
                    className="w-5 h-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
                  </svg>
                  <span>{t("profile.my_reviews")}</span>
                </button>
                <button
                  onClick={() => handleSectionClick("rewards")}
                  className={`w-full text-left px-6 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors ${
                    section === "rewards"
                      ? "bg-gray-100 border-l-4 border-red-600"
                      : ""
                  }`}
                >
                  <svg
                    className="w-5 h-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                  <span>{t("profile.my_rewards")}</span>
                </button>
                <button
                  onClick={() => handleSectionClick("loyalty")}
                  className={`w-full text-left px-6 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors ${
                    section === "loyalty"
                      ? "bg-gray-100 border-l-4 border-red-600"
                      : ""
                  }`}
                >
                  <svg
                    className="w-5 h-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M8 21h8M12 17v4M6.5 3h11l-1 6.5a5 5 0 0 1-9 0L6.5 3z" />
                    <path d="M6.5 5H3.5a1 1 0 0 0-1 1.2l.6 2.4A3 3 0 0 0 6 11" />
                    <path d="M17.5 5h3a1 1 0 0 1 1 1.2l-.6 2.4A3 3 0 0 1 18 11" />
                  </svg>
                  <span>Loyalty Tier</span>
                </button>
                <button
                  onClick={() => handleSectionClick("coupons")}
                  className={`w-full text-left px-6 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors ${
                    section === "coupons"
                      ? "bg-gray-100 border-l-4 border-red-600"
                      : ""
                  }`}
                >
                  <svg
                    className="w-5 h-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M21 8.5a2.5 2.5 0 0 1 0 5M3 8.5a2.5 2.5 0 0 0 0 5" />
                    <path d="M3 3h18v18H3z" />
                    <line x1="9" y1="9" x2="15" y2="15" />
                    <line x1="15" y1="9" x2="9" y2="15" />
                  </svg>
                  <span>{t("profile.my_coupons")}</span>
                </button>
              </div>
            </div>

            {/* Logout Button */}
            <div className="p-4 border-t border-gray-200">
              <button
                onClick={handleLogout}
                className="w-full px-4 py-3 border border-red-600 text-red-600 rounded-lg hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
              >
                <svg
                  className="w-5 h-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                <span>{t("user.logout")}</span>
              </button>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 min-w-0">
            {section === "profile" && (
              <div className="bg-white rounded-lg shadow">
                <div className="p-4 md:p-6 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <h2 className="text-xl md:text-2xl font-semibold">
                    {t("profile_page.title")}
                  </h2>
                  {!isEditing ? (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="w-full sm:w-auto px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                    >
                      {t("profile_page.edit")}
                    </button>
                  ) : (
                    <div className="flex w-full sm:w-auto gap-2">
                      <button
                        onClick={() => setIsEditing(false)}
                        className="flex-1 sm:flex-none px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
                      >
                        {t("common.cancel")}
                      </button>
                      <button
                        onClick={handleSaveProfile}
                        className="flex-1 sm:flex-none px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                      >
                        Save
                      </button>
                    </div>
                  )}
                </div>
                <div className="p-4 md:p-6 space-y-6">
                  {/* avatar + upload row shown only while editing */}
                  {isEditing && (
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                      <div className="w-20 h-20">
                        {previewImage ? (
                          <Image
                            src={previewImage}
                            alt={user.name || "User"}
                            width={80}
                            height={80}
                            className="w-20 h-20 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-20 h-20 rounded-full bg-orange-400 flex items-center justify-center text-white text-2xl font-semibold">
                            {(user.name || user.email || "U")
                              .charAt(0)
                              .toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="cursor-pointer text-sm text-blue-600 hover:underline">
                          Select image
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const f = e.target.files && e.target.files[0];
                              if (f) {
                                setSelectedImageFile(f);
                                setPreviewImage(URL.createObjectURL(f));
                                setRemoveImage(false);
                              }
                            }}
                          />
                        </label>
                        {previewImage && !selectedImageFile && (
                          <button
                            type="button"
                            className="text-sm text-red-500 hover:underline"
                            onClick={() => {
                              setRemoveImage(true);
                              setPreviewImage(gravatarUrl);
                              setSelectedImageFile(null);
                            }}
                          >
                            Remove image
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                  <div>
                    <label className="block text-sm text-gray-600 mb-2">
                      Name
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editForm.name}
                        onChange={(e) =>
                          setEditForm({ ...editForm, name: e.target.value })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                      />
                    ) : (
                      <p className="text-lg">{user.name || "Project Toktik"}</p>
                    )}
                  </div>

                  <div className="border-t border-gray-100 pt-6">
                    <label className="block text-sm text-gray-600 mb-2">
                      Mail Address
                    </label>
                    {isEditing ? (
                      <input
                        type="email"
                        value={editForm.email}
                        onChange={(e) =>
                          setEditForm({ ...editForm, email: e.target.value })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                      />
                    ) : (
                      <p className="text-lg">{user.email}</p>
                    )}
                  </div>

                  {Array.isArray(user.tags) && user.tags.length > 0 && (
                    <div className="border-t border-gray-100 pt-6">
                      <label className="block text-sm text-gray-600 mb-2">
                        Tags
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {user.tags.map((tag) => (
                          <span
                            key={tag._id || tag.name || tag}
                            className="rounded-full px-3 py-1 text-xs font-semibold text-white"
                            style={{ backgroundColor: tag.color || "#3B82F6" }}
                          >
                            {tag.name || tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="border-t border-gray-100 pt-6">
                    <label className="block text-sm text-gray-600 mb-2">
                      Mobile Number
                    </label>
                    {isEditing ? (
                      <input
                        type="tel"
                        value={editForm.mobile}
                        onChange={(e) =>
                          setEditForm({ ...editForm, mobile: e.target.value })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                        placeholder="Not Provided"
                      />
                    ) : (
                      <p className="text-lg">{user.mobile || "Not Provided"}</p>
                    )}
                  </div>

                  <div className="border-t border-gray-100 pt-6">
                    <label className="block text-sm text-gray-600 mb-2">
                      Date Of Birth
                    </label>
                    {isEditing ? (
                      <input
                        type="date"
                        value={editForm.dob}
                        onChange={(e) =>
                          setEditForm({ ...editForm, dob: e.target.value })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                      />
                    ) : (
                      <p className="text-lg">{user.dob || "Not Provided"}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {section === "orders" && (
              <OrdersSection
                API={
                  process.env.NEXT_PUBLIC_API_URL || "https://api.pickob.com"
                }
              />
            )}

            {section === "wishlist" && (
              <div className="bg-white rounded-lg shadow">
                <div className="p-4 md:p-6 border-b border-gray-200">
                  <h2 className="text-xl md:text-2xl font-semibold">
                    My Wishlist
                  </h2>
                </div>
                <div className="p-3 md:p-6">
                  <WishlistPage embedded={true} />
                </div>
              </div>
            )}

            {section === "address" && (
              <div className="bg-white rounded-lg shadow p-3 md:p-6">
                <AddressManager />
              </div>
            )}

            {section === "reviews" && (
              <MyReviewsSection
                API={
                  process.env.NEXT_PUBLIC_API_URL || "https://api.pickob.com"
                }
              />
            )}

            {section === "rewards" && <UserRewardsSection />}

            {section === "loyalty" && <UserLoyaltySection />}

            {section === "coupons" && (
              <div className="bg-white rounded-lg shadow p-4 md:p-6">
                <h2 className="text-xl md:text-2xl font-semibold mb-2">
                  My Coupons
                </h2>
                <p className="text-sm text-gray-500 mb-6">
                  Apply these codes at checkout to unlock discounts and perks.
                </p>

                {/* New-user banner */}
                {isNewUser(user) && (
                  <div className="mb-6 p-4 bg-blue-50 border border-blue-300 rounded-lg flex items-start gap-3">
                    <span className="text-2xl">🎉</span>
                    <div>
                      <p className="font-semibold text-blue-800">
                        You&apos;re a new user!
                      </p>
                      <p className="text-sm text-blue-700 mt-0.5">
                        You are eligible for <strong>Free Delivery</strong> on
                        your first order. Use coupon code{" "}
                        <strong>newUser26</strong> at checkout (min. order
                        ৳800).
                      </p>
                    </div>
                  </div>
                )}

                {/* Auto-discount tiers info */}
                <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <h3 className="font-semibold text-gray-800 mb-3">
                    🛒 Automatic Discounts (No Code Needed)
                  </h3>
                  <div className="space-y-2 text-sm text-gray-700">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-pink-500 shrink-0"></span>
                      Spend <strong>৳999+</strong> →{" "}
                      <span className="text-green-700 font-medium">
                        Free Delivery
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-orange-500 shrink-0"></span>
                      Spend <strong>৳2,000+</strong> →{" "}
                      <span className="text-green-700 font-medium">
                        ৳150 Off
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-green-500 shrink-0"></span>
                      Spend <strong>৳3,000+</strong> →{" "}
                      <span className="text-green-700 font-medium">
                        ৳250 Off total (৳150 + ৳100)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Coupon cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {COUPONS.map((coupon) => {
                    const eligible = !coupon.isNewUserOnly || isNewUser(user);
                    return (
                      <div
                        key={coupon.code}
                        className={`relative border-2 ${coupon.color.border} rounded-lg overflow-hidden bg-linear-to-br ${coupon.color.bg}`}
                      >
                        {/* Eligibility badge */}
                        <div
                          className={`absolute top-3 right-3 text-xs px-2 py-0.5 rounded-full font-medium ${
                            eligible
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          {eligible ? "✓ Eligible" : "Not Eligible"}
                        </div>

                        {/* Ticket notches */}
                        <div
                          className={`absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-white border-2 ${coupon.color.border} rounded-full`}
                        ></div>
                        <div
                          className={`absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-white border-2 ${coupon.color.border} rounded-full`}
                        ></div>
                        {/* Divider */}
                        <div className="absolute left-0 right-0 top-1/2 border-t-2 border-dashed border-gray-300 mx-4"></div>

                        {/* Top section */}
                        <div className="px-6 pt-5 pb-3">
                          <p
                            className={`text-4xl font-extrabold ${coupon.color.text}`}
                          >
                            {coupon.headline}
                          </p>
                          <p className="text-sm text-gray-700 mt-1 font-medium">
                            {coupon.title}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            Min. order: ৳{coupon.minOrder || 0}
                          </p>
                        </div>

                        {/* Bottom section */}
                        <div className="px-6 pt-4 pb-5">
                          <p className="text-xs text-gray-600 mb-3 leading-relaxed">
                            {coupon.description}
                          </p>
                          <div className="flex items-center gap-2">
                            <span
                              className={`font-mono font-bold text-sm px-3 py-1 rounded border-2 border-dashed ${coupon.color.border} ${coupon.color.text} ${coupon.color.light} tracking-widest`}
                            >
                              {coupon.code}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard?.writeText(coupon.code);
                              }}
                              className="text-xs text-gray-500 hover:text-gray-700 underline"
                            >
                              Copy
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
