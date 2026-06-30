"use client";

import React, {
  useEffect,
  useState,
  useCallback,
  useRef,
  useLayoutEffect,
} from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useUser } from "@/components/context/UserContext";
import { useRouter, useSearchParams } from "next/navigation";
import { formatOrderId } from "@/lib/orderId";
import CourierScorePanel from "@/components/dashboard/Customer/CourierScorePanel";

const API = process.env.NEXT_PUBLIC_API_URL || "https://api.pickob.com";

function useCourierLifetime(phone) {
  const [lifetime, setLifetime] = useState(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(
    async (refresh = false) => {
      if (!phone) return;
      setLoading(true);
      try {
        const params = refresh ? "?refresh=1" : "";
        const r = await fetch(
          `${API}/api/admin/phones/${encodeURIComponent(phone)}/lifetime-stats${params}`,
          { credentials: "include" },
        );
        const body = await r.json();
        setLifetime(r.ok ? body : { error: body.error || "Failed to load" });
      } catch {
        setLifetime({ error: "Failed to load" });
      } finally {
        setLoading(false);
      }
    },
    [phone],
  );

  useEffect(() => {
    load();
  }, [load]);

  return { lifetime, loading, refresh: () => load(true) };
}

// ─── Shared helpers ──────────────────────────────────────────────────────────

const STATUS_STYLE = {
  pending: "bg-yellow-100 text-yellow-700",
  accepted: "bg-emerald-100 text-emerald-700",
  picked: "bg-orange-100 text-orange-700",
  approved: "bg-emerald-100 text-emerald-700",
  rejected: "bg-red-100 text-red-700",
  confirmed: "bg-blue-100 text-blue-700",
  processing: "bg-indigo-100 text-indigo-700",
  shipped: "bg-purple-100 text-purple-700",
  delivered: "bg-green-100 text-green-700",
  returned: "bg-teal-100 text-teal-700",
  cancelled: "bg-gray-100 text-gray-600",
  failed: "bg-red-100 text-red-600",
  "return-pending": "bg-amber-100 text-amber-700",
  "return-approved": "bg-teal-100 text-teal-700",
  "return-rejected": "bg-red-100 text-red-600",
};

const PAYMENT_STATUS_STYLE = {
  unpaid: "bg-yellow-50 text-yellow-600",
  cod: "bg-orange-50 text-orange-600",
  paid: "bg-green-50 text-green-700",
  failed: "bg-red-50 text-red-600",
  cancelled: "bg-gray-50 text-gray-500",
};

const METHOD_LABEL = {
  "cash-on-delivery": "COD",
  online: "Online",
  bkash: "bKash",
};

function fmt(date) {
  return new Date(date).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function fmtDate(date) {
  return new Date(date).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function itemSummary(items) {
  if (!items?.length) return "—";
  const first = items[0].title || "Item";
  return items.length === 1 ? first : `${first} +${items.length - 1} more`;
}

// Returns ISO dateFrom string for a quick-filter preset
function dateFromPreset(preset) {
  if (!preset || preset === "all") return null;
  const d = new Date();
  if (preset === "today") {
    d.setHours(0, 0, 0, 0);
    return d.toISOString();
  }
  if (preset === "7d") {
    d.setDate(d.getDate() - 7);
    return d.toISOString();
  }
  if (preset === "30d") {
    d.setDate(d.getDate() - 30);
    return d.toISOString();
  }
  return null;
}

// Returns { label, color } describing how old an order is
function orderAge(createdAt) {
  const ms = Date.now() - new Date(createdAt).getTime();
  const hours = ms / 3_600_000;
  if (hours < 24) return null;
  if (hours < 48)
    return { label: "24h+", color: "bg-amber-100 text-amber-700" };
  if (hours < 72)
    return { label: "2d+", color: "bg-orange-100 text-orange-700" };
  return {
    label: `${Math.floor(hours / 24)}d`,
    color: "bg-red-100 text-red-600",
  };
}

const DATE_PRESETS = [
  { key: "all", label: "All time" },
  { key: "today", label: "Today" },
  { key: "7d", label: "Last 7 days" },
  { key: "30d", label: "Last 30 days" },
];

function DateFilter({ value, onChange }) {
  return (
    <div className="flex items-center gap-1">
      {DATE_PRESETS.map((p) => (
        <button
          key={p.key}
          type="button"
          onClick={() => onChange(p.key)}
          className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-medium transition ${value === p.key ? "bg-indigo-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}

// ─── Actions dropdown ─────────────────────────────────────────────────────────

function OrderActionsMenu({ order, onDelete }) {
  const { user } = useUser();
  const canDelete = user?.role === "admin";
  const [open, setOpen] = useState(false);
  const [menuPos, setMenuPos] = useState(null);
  const btnRef = useRef(null);
  const menuRef = useRef(null);
  const detailsHref = `/dashboard/orders/${order._id}`;
  const scoreHref = order.customerUserId
    ? `/dashboard/customers/${order.customerUserId}/profile`
    : null;

  const updatePosition = useCallback(() => {
    const btn = btnRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const menuHeight = menuRef.current?.offsetHeight || 200;
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUp = spaceBelow < menuHeight + 8 && rect.top > menuHeight + 8;
    const top = openUp ? rect.top - menuHeight - 4 : rect.bottom + 4;
    const left = Math.min(
      Math.max(8, rect.right - 160),
      window.innerWidth - 168,
    );
    setMenuPos({ top, left });
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    updatePosition();
    const raf = requestAnimationFrame(updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [open, updatePosition]);

  return (
    <div onClick={(e) => e.stopPropagation()}>
      <button
        ref={btnRef}
        type="button"
        onClick={() => {
          if (open) {
            setOpen(false);
            return;
          }
          const btn = btnRef.current;
          if (btn) {
            const rect = btn.getBoundingClientRect();
            setMenuPos({
              top: rect.bottom + 4,
              left: Math.min(
                Math.max(8, rect.right - 160),
                window.innerWidth - 168,
              ),
            });
          }
          setOpen(true);
        }}
        className="px-2.5 py-1.5 text-xs font-medium rounded-lg border border-gray-200 hover:bg-gray-50"
      >
        Actions ▾
      </button>
      {open &&
        typeof document !== "undefined" &&
        createPortal(
          <>
            <div
              className="fixed inset-0 z-[100]"
              onClick={() => setOpen(false)}
              aria-hidden="true"
            />
            <div
              ref={menuRef}
              style={
                menuPos
                  ? { position: "fixed", top: menuPos.top, left: menuPos.left }
                  : undefined
              }
              className="z-[101] min-w-40 bg-white border border-gray-200 rounded-lg shadow-xl py-1 text-xs"
            >
              <Link
                href={`${detailsHref}/invoice`}
                className="block px-3 py-2 hover:bg-gray-50 text-gray-700"
                onClick={() => setOpen(false)}
              >
                Print invoice
              </Link>
              <Link
                href={`${detailsHref}/slip`}
                className="block px-3 py-2 hover:bg-gray-50 text-gray-700"
                onClick={() => setOpen(false)}
              >
                Print slip
              </Link>
              {scoreHref ? (
                <Link
                  href={scoreHref}
                  className="block px-3 py-2 hover:bg-gray-50 text-gray-700"
                  onClick={() => setOpen(false)}
                >
                  Courier score
                </Link>
              ) : (
                <span className="block px-3 py-2 text-gray-300 cursor-not-allowed">
                  Courier score
                </span>
              )}
              <Link
                href={detailsHref}
                className="block px-3 py-2 hover:bg-gray-50 text-gray-700"
                onClick={() => setOpen(false)}
              >
                Edit
              </Link>
              {canDelete && (
                <button
                  type="button"
                  onClick={(e) => {
                    setOpen(false);
                    onDelete(e, order._id);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-red-50 text-red-600"
                >
                  Delete
                </button>
              )}
            </div>
          </>,
          document.body,
        )}
    </div>
  );
}

// ─── Reusable orders table ────────────────────────────────────────────────────

function OrdersTable({ orders, onDelete, onRowClick, onCustomerClick }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left">
        <thead>
          <tr className="text-xs text-gray-500 uppercase border-b bg-gray-50">
            <th className="px-4 py-3 font-medium">Order ID</th>
            <th className="px-4 py-3 font-medium">Customer</th>
            <th className="px-4 py-3 font-medium">Item</th>
            <th className="px-4 py-3 font-medium">Total</th>
            <th className="px-4 py-3 font-medium">Payment</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Date</th>
            <th className="px-4 py-3 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {orders.map((order) => (
            <tr
              key={order._id}
              onClick={() => onRowClick(order._id)}
              className="hover:bg-rose-50 transition cursor-pointer"
            >
              <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                <Link
                  href={`/dashboard/orders/${order._id}`}
                  className="font-mono text-xs bg-gray-100 rounded px-1.5 py-0.5 text-rose-600 hover:bg-rose-50 hover:underline"
                >
                  {formatOrderId(order._id)}
                </Link>
              </td>
              <td
                className="px-4 py-3"
                onClick={(e) => onCustomerClick && e.stopPropagation()}
              >
                {onCustomerClick ? (
                  <button
                    type="button"
                    className="text-left"
                    onClick={() => onCustomerClick(order)}
                  >
                    <p className="font-medium text-gray-800 hover:text-indigo-600 hover:underline">
                      {order.billingDetails?.name || "—"}
                    </p>
                    <p className="text-xs text-gray-400">
                      {order.billingDetails?.phone}
                    </p>
                  </button>
                ) : (
                  <>
                    <p className="font-medium text-gray-800">
                      {order.billingDetails?.name || "—"}
                    </p>
                    <p className="text-xs text-gray-400">
                      {order.billingDetails?.phone}
                    </p>
                  </>
                )}
              </td>
              <td className="px-4 py-3 text-gray-600 max-w-[12rem] truncate">
                {itemSummary(order.items)}
              </td>
              <td className="px-4 py-3 font-semibold text-gray-800">
                ৳{order.total?.toLocaleString()}
              </td>
              <td className="px-4 py-3">
                <div className="space-y-0.5">
                  <span className="block text-xs font-medium text-gray-700">
                    {METHOD_LABEL[order.paymentMethod] || order.paymentMethod}
                  </span>
                  <span
                    className={`inline-block text-xs px-1.5 py-0.5 rounded-full ${PAYMENT_STATUS_STYLE[order.paymentStatus] || ""}`}
                  >
                    {order.paymentStatus?.toUpperCase()}
                  </span>
                </div>
              </td>
              <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                <Link
                  href={`/dashboard/orders/${order._id}`}
                  className={`inline-block text-xs font-medium px-2 py-1 rounded-full capitalize hover:underline ${STATUS_STYLE[order.status] || ""}`}
                >
                  {order.status}
                </Link>
              </td>
              <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                {fmt(order.createdAt)}
              </td>
              <td className="px-4 py-3">
                <OrderActionsMenu order={order} onDelete={onDelete} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Cancelled Orders Table ───────────────────────────────────────────────────

function CancelledOrdersTable({
  orders,
  onDelete,
  onRowClick,
  onCustomerClick,
}) {
  const { user } = useUser();
  const canDelete = user?.role === "admin";
  const getCancelReason = (order) => {
    const history = order.statusHistory || [];
    const entry = [...history]
      .reverse()
      .find((h) => h.newStatus === "cancelled");
    return entry?.reason?.trim() || null;
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left">
        <thead>
          <tr className="text-xs text-gray-500 uppercase border-b bg-gray-50">
            <th className="px-4 py-3 font-medium">Order ID</th>
            <th className="px-4 py-3 font-medium">Customer</th>
            <th className="px-4 py-3 font-medium">Item</th>
            <th className="px-4 py-3 font-medium">Total</th>
            <th className="px-4 py-3 font-medium">Cancel Reason</th>
            <th className="px-4 py-3 font-medium">Date</th>
            <th className="px-4 py-3 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {orders.map((order) => {
            const reason = getCancelReason(order);
            return (
              <tr
                key={order._id}
                onClick={() => onRowClick(order._id)}
                className="hover:bg-red-50/40 transition cursor-pointer"
              >
                {/* Order ID */}
                <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                  <Link
                    href={`/dashboard/orders/${order._id}`}
                    className="font-mono text-xs bg-gray-100 rounded px-1.5 py-0.5 text-rose-600 hover:underline"
                  >
                    {formatOrderId(order._id)}
                  </Link>
                </td>

                {/* Customer */}
                <td
                  className="px-4 py-3"
                  onClick={(e) => onCustomerClick && e.stopPropagation()}
                >
                  {onCustomerClick ? (
                    <button
                      type="button"
                      className="text-left"
                      onClick={() => onCustomerClick(order)}
                    >
                      <p className="font-medium text-gray-800 hover:text-indigo-600 hover:underline">
                        {order.billingDetails?.name || "—"}
                      </p>
                      <p className="text-xs text-gray-400">
                        {order.billingDetails?.phone}
                      </p>
                    </button>
                  ) : (
                    <>
                      <p className="font-medium text-gray-800">
                        {order.billingDetails?.name || "—"}
                      </p>
                      <p className="text-xs text-gray-400">
                        {order.billingDetails?.phone}
                      </p>
                    </>
                  )}
                </td>

                {/* Items */}
                <td className="px-4 py-3 text-gray-600 max-w-[12rem] truncate">
                  {itemSummary(order.items)}
                </td>

                {/* Total */}
                <td className="px-4 py-3 font-semibold text-gray-800">
                  ৳{order.total?.toLocaleString()}
                </td>

                {/* Cancel reason */}
                <td className="px-4 py-3 max-w-[200px]">
                  {reason ? (
                    <span className="inline-flex items-start gap-1.5 text-xs text-red-700 bg-red-50 border border-red-100 rounded-lg px-2.5 py-1.5 leading-snug">
                      <svg
                        className="w-3 h-3 mt-0.5 shrink-0 text-red-400"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M18 10A8 8 0 11 2 10a8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 002 0V6a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                      {reason}
                    </span>
                  ) : (
                    <span className="text-xs text-gray-300 italic">
                      কারণ দেওয়া হয়নি
                    </span>
                  )}
                </td>

                {/* Date */}
                <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                  {fmt(order.createdAt)}
                </td>

                {/* Actions */}
                <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/dashboard/orders/${order._id}`}
                      className="text-xs text-indigo-500 hover:underline"
                    >
                      View
                    </Link>
                    {canDelete && (
                      <>
                        <span className="text-gray-200">|</span>
                        <button
                          onClick={(e) => onDelete(e, order._id)}
                          className="text-xs text-red-500 hover:text-red-700 hover:underline font-medium"
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── Pagination ───────────────────────────────────────────────────────────────

function Pagination({ page, totalPages, onPage }) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-2 px-5 py-4 border-t">
      <button
        onClick={() => onPage(Math.max(1, page - 1))}
        disabled={page === 1}
        className="px-3 py-1.5 text-sm rounded-lg border hover:bg-gray-50 disabled:opacity-40"
      >
        ← Prev
      </button>
      <span className="text-sm text-gray-600">
        Page {page} of {totalPages}
      </span>
      <button
        onClick={() => onPage(Math.min(totalPages, page + 1))}
        disabled={page === totalPages}
        className="px-3 py-1.5 text-sm rounded-lg border hover:bg-gray-50 disabled:opacity-40"
      >
        Next →
      </button>
    </div>
  );
}

// ─── Feature gate (not yet activated) ────────────────────────────────────────

function FeatureGate({ icon, title, description, whatItDoes, mockRows }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
      {/* Blurred data preview */}
      {mockRows && (
        <div className="relative overflow-hidden max-h-52">
          <table className="w-full text-sm text-left pointer-events-none select-none">
            <thead>
              <tr className="text-xs text-gray-400 uppercase border-b bg-gray-50/60">
                {mockRows.headers.map((h) => (
                  <th key={h} className="px-4 py-3 font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {mockRows.rows.map((row, i) => (
                <tr key={i} className="opacity-30">
                  {row.map((cell, j) => (
                    <td key={j} className="px-4 py-3 text-gray-700">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <div className="absolute inset-0 bg-linear-to-b from-white/10 to-white" />
        </div>
      )}

      {/* Main message */}
      <div className="px-8 py-10 flex flex-col items-center text-center">
        <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center text-3xl mb-4 shadow-sm">
          {icon}
        </div>
        <h2 className="text-lg font-semibold text-gray-800 mb-1">{title}</h2>
        <p className="text-sm text-gray-500 max-w-sm">{description}</p>

        <div className="mt-6 flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 max-w-md text-left">
          <svg
            className="w-5 h-5 text-amber-500 shrink-0 mt-0.5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v4m0 4h.01" />
          </svg>
          <div>
            <p className="text-sm font-semibold text-amber-800 mb-0.5">
              এই ফিচারটি এখনো চালু হয়নি
            </p>
            <p className="text-xs text-amber-700">
              এই পেজে ডেটা দেখতে হলে আপনার store admin-কে এই ফিচারটি চালু করতে
              বলুন। চালু হলে এখানে সব তথ্য দেখা যাবে।
            </p>
          </div>
        </div>

        {whatItDoes && (
          <div className="mt-4 max-w-md text-left">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              এই পেজে কী দেখা যাবে
            </p>
            <ul className="space-y-1.5">
              {whatItDoes.map((item, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-sm text-gray-600"
                >
                  <span className="text-green-500 mt-0.5 shrink-0">✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Returns & Refunds section ───────────────────────────────────────────────

const RETURN_STATUS_STYLE = {
  pending: "bg-amber-100 text-amber-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-600",
};

function ReturnActionModal({ modal, onClose, onSave }) {
  const [refundAmount, setRefundAmount] = useState(
    modal.order?.returnRequest?.refundAmount ?? modal.order?.total ?? 0,
  );
  const [adminNote, setAdminNote] = useState(
    modal.order?.returnRequest?.adminNote || "",
  );
  const [saving, setSaving] = useState(false);

  const isApprove = modal.action === "approve";

  const handleSave = async () => {
    setSaving(true);
    await onSave({
      status: isApprove ? "approved" : "rejected",
      refundAmount: isApprove ? refundAmount : 0,
      adminNote,
    });
    setSaving(false);
  };

  return createPortal(
    <>
      <div
        className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="fixed inset-0 z-[201] flex items-center justify-center p-4 pointer-events-none">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md pointer-events-auto">
          <div className="px-6 py-4 border-b flex items-center justify-between">
            <h3 className="font-semibold text-gray-800">
              {isApprove ? "✅ Approve Return" : "❌ Reject Return"}
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-xl leading-none"
            >
              ×
            </button>
          </div>
          <div className="px-6 py-4 space-y-4">
            <div className="bg-gray-50 rounded-xl px-4 py-3 text-sm">
              <span className="text-gray-500">Order:</span>{" "}
              <span className="font-mono font-semibold text-rose-600">
                {formatOrderId(modal.order._id)}
              </span>
              <span className="ml-3 text-gray-500">
                {modal.order.billingDetails?.name}
              </span>
            </div>
            {modal.order.returnRequest?.reason && (
              <div className="bg-amber-50 rounded-xl px-4 py-3 text-sm border border-amber-100">
                <p className="text-xs text-amber-600 font-medium mb-0.5">
                  Return reason
                </p>
                <p className="text-gray-700">
                  "{modal.order.returnRequest.reason}"
                </p>
              </div>
            )}
            {isApprove && (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Refund Amount (৳)
                </label>
                <input
                  type="number"
                  value={refundAmount}
                  onChange={(e) =>
                    setRefundAmount(Math.max(0, Number(e.target.value)))
                  }
                  className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Order total: ৳{modal.order.total?.toLocaleString()}
                </p>
              </div>
            )}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Admin Note {isApprove ? "(optional)" : "(reason for rejection)"}
              </label>
              <textarea
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                rows={3}
                placeholder={
                  isApprove
                    ? "Internal note…"
                    : "Explain why the return is rejected…"
                }
                className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 resize-none"
              />
            </div>
          </div>
          <div className="px-6 py-4 border-t flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 border rounded-xl hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className={`px-4 py-2 text-sm font-semibold text-white rounded-xl transition disabled:opacity-60 ${isApprove ? "bg-green-500 hover:bg-green-600" : "bg-red-500 hover:bg-red-600"}`}
            >
              {saving
                ? "Saving…"
                : isApprove
                  ? "Approve & Refund"
                  : "Reject Return"}
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body,
  );
}

function AddReturnModal({ onClose, onSave }) {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState(null);
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const debounceRef = useRef(null);

  const doSearch = useCallback(async (q) => {
    if (!q.trim()) {
      setResults([]);
      return;
    }
    setSearching(true);
    try {
      const r = await fetch(
        `${API}/api/admin/orders?q=${encodeURIComponent(q)}&limit=8&status=delivered`,
        { credentials: "include" },
      );
      const body = await r.json();
      setResults(body.orders || []);
    } catch {
    } finally {
      setSearching(false);
    }
  }, []);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(search), 300);
    return () => clearTimeout(debounceRef.current);
  }, [search, doSearch]);

  const handleSave = async () => {
    if (!selected) return setErr("Select an order from the search results.");
    if (!reason.trim()) return setErr("Enter a return reason.");
    setSaving(true);
    setErr("");
    const ok = await onSave(selected._id, reason.trim());
    setSaving(false);
    if (!ok)
      setErr(
        "This order already has a return request, or it could not be found.",
      );
  };

  return createPortal(
    <>
      <div
        className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="fixed inset-0 z-[201] flex items-center justify-center p-4 pointer-events-none">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg pointer-events-auto">
          <div className="px-6 py-4 border-b flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-800">
                New Return Request
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Search a delivered order, then add a return reason
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-xl leading-none"
            >
              ×
            </button>
          </div>
          <div className="px-6 py-4 space-y-4">
            {/* Order search */}
            {!selected ? (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Search Order (customer name, phone, or order ID)
                </label>
                <div className="relative">
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="e.g. Rina Khatun or 017…"
                    autoFocus
                    className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 pr-8"
                  />
                  {searching && (
                    <svg
                      className="absolute right-2.5 top-2.5 w-4 h-4 animate-spin text-gray-400"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                    </svg>
                  )}
                </div>
                {results.length > 0 && (
                  <div className="mt-2 border rounded-xl overflow-hidden shadow-sm">
                    {results.map((o) => (
                      <button
                        key={o._id}
                        type="button"
                        onClick={() => {
                          setSelected(o);
                          setSearch("");
                          setResults([]);
                        }}
                        className="w-full text-left px-4 py-3 hover:bg-rose-50 border-b last:border-0 transition"
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-xs text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">
                            {formatOrderId(o._id)}
                          </span>
                          <span className="text-sm font-medium text-gray-800 flex-1">
                            {o.billingDetails?.name}
                          </span>
                          <span className="text-xs text-gray-400">
                            {o.billingDetails?.phone}
                          </span>
                          <span className="text-xs font-semibold text-gray-700">
                            ৳{o.total?.toLocaleString()}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                {search.trim() && !searching && results.length === 0 && (
                  <p className="text-xs text-gray-400 mt-2">
                    No delivered orders match "{search}"
                  </p>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-3 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-mono text-xs text-rose-600 bg-white border border-rose-200 px-1.5 py-0.5 rounded">
                      {formatOrderId(selected._id)}
                    </span>
                    <span className="text-sm font-medium text-gray-800">
                      {selected.billingDetails?.name}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">
                    {selected.billingDetails?.phone} · ৳
                    {selected.total?.toLocaleString()}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  className="text-xs text-rose-600 hover:underline shrink-0"
                >
                  Change
                </button>
              </div>
            )}

            {/* Reason */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Return Reason
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                placeholder="Describe why the item is being returned…"
                className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 resize-none"
              />
            </div>
            {err && (
              <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">
                {err}
              </p>
            )}
          </div>
          <div className="px-6 py-4 border-t flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 border rounded-xl hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !selected}
              className="px-4 py-2 text-sm font-semibold text-white bg-rose-500 hover:bg-rose-600 rounded-xl transition disabled:opacity-60"
            >
              {saving ? "Creating…" : "Create Request"}
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body,
  );
}

function ReturnsActionsMenu({ order, onAction, onDelete }) {
  const { user } = useUser();
  const canDelete = user?.role === "admin";
  const [open, setOpen] = useState(false);
  const [menuPos, setMenuPos] = useState(null);
  const btnRef = useRef(null);
  const menuRef = useRef(null);

  const updatePos = useCallback(() => {
    const btn = btnRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const menuH = menuRef.current?.offsetHeight || 180;
    const openUp =
      window.innerHeight - rect.bottom < menuH + 8 && rect.top > menuH + 8;
    const top = openUp ? rect.top - menuH - 4 : rect.bottom + 4;
    const left = Math.min(
      Math.max(8, rect.right - 168),
      window.innerWidth - 176,
    );
    setMenuPos({ top, left });
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    updatePos();
    const raf = requestAnimationFrame(updatePos);
    window.addEventListener("scroll", updatePos, true);
    window.addEventListener("resize", updatePos);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", updatePos, true);
      window.removeEventListener("resize", updatePos);
    };
  }, [open, updatePos]);

  const status = order.returnRequest?.status ?? "pending";

  return (
    <div onClick={(e) => e.stopPropagation()}>
      <button
        ref={btnRef}
        type="button"
        onClick={() => {
          if (open) {
            setOpen(false);
            return;
          }
          const r = btnRef.current?.getBoundingClientRect();
          if (r)
            setMenuPos({
              top: r.bottom + 4,
              left: Math.min(
                Math.max(8, r.right - 168),
                window.innerWidth - 176,
              ),
            });
          setOpen(true);
        }}
        className="px-2.5 py-1.5 text-xs font-medium rounded-lg border border-gray-200 hover:bg-gray-50"
      >
        Actions ▾
      </button>
      {open &&
        typeof document !== "undefined" &&
        createPortal(
          <>
            <div
              className="fixed inset-0 z-[100]"
              onClick={() => setOpen(false)}
            />
            <div
              ref={menuRef}
              style={
                menuPos
                  ? { position: "fixed", top: menuPos.top, left: menuPos.left }
                  : undefined
              }
              className="z-[101] min-w-44 bg-white border border-gray-200 rounded-xl shadow-xl py-1 text-xs"
            >
              <Link
                href={`/dashboard/orders/${order._id}`}
                className="block px-3 py-2 hover:bg-gray-50 text-gray-700"
                onClick={() => setOpen(false)}
              >
                View Order
              </Link>
              {status === "pending" && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      onAction("approve", order);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-green-50 text-green-700"
                  >
                    Approve Return
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      onAction("reject", order);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-red-50 text-red-600"
                  >
                    Reject Return
                  </button>
                </>
              )}
              {status !== "pending" && (
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    onAction("pending", order);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-amber-50 text-amber-700"
                >
                  Reset to Pending
                </button>
              )}
              {canDelete && (
                <>
                  <div className="my-1 border-t border-gray-100" />
                  <button
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      onDelete(order._id);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-red-50 text-red-500"
                  >
                    Remove
                  </button>
                </>
              )}
            </div>
          </>,
          document.body,
        )}
    </div>
  );
}

const RETURN_TABS = ["all", "pending", "approved", "rejected"];

function ReturnsRefundsSection() {
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
    totalRefund: 0,
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [actionModal, setActionModal] = useState(null);
  const [addModal, setAddModal] = useState(false);

  const load = useCallback(async (tab, pg, q) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: pg, limit: 20 });
      if (tab !== "all") params.set("status", tab);
      if (q) params.set("q", q);
      const r = await fetch(`${API}/api/admin/orders/returns?${params}`, {
        credentials: "include",
      });
      const body = await r.json();
      if (r.ok) {
        setOrders(body.orders || []);
        setStats(body.stats || {});
        setTotalPages(body.pages || 1);
        setTotal(body.total || 0);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(activeTab, page, query);
  }, [activeTab, page, query, load]);

  const handleAction = async ({ status, refundAmount, adminNote }) => {
    const order = actionModal.order;
    try {
      const r = await fetch(`${API}/api/admin/orders/${order._id}/return`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, refundAmount, adminNote }),
      });
      if (r.ok) {
        setActionModal(null);
        load(activeTab, page, query);
      }
    } catch {}
  };

  const handleResetToPending = async (order) => {
    try {
      await fetch(`${API}/api/admin/orders/${order._id}/return`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "pending" }),
      });
      load(activeTab, page, query);
    } catch {}
  };

  const handleMenuAction = (action, order) => {
    if (action === "pending") {
      handleResetToPending(order);
      return;
    }
    setActionModal({ action, order });
  };

  const handleDelete = async (orderId) => {
    if (!confirm("Remove this return request?")) return;
    try {
      const r = await fetch(`${API}/api/admin/orders/${orderId}/return`, {
        method: "DELETE",
        credentials: "include",
      });
      if (r.ok) load(activeTab, page, query);
    } catch {}
  };

  const handleAddReturn = async (orderId, reason) => {
    try {
      const r = await fetch(`${API}/api/admin/orders/${orderId}/return`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      if (r.ok) {
        setAddModal(false);
        load(activeTab, page);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            label: "Pending",
            val: stats.pending,
            color: "text-amber-600",
            bg: "bg-amber-50 border-amber-100",
          },
          {
            label: "Approved",
            val: stats.approved,
            color: "text-green-600",
            bg: "bg-green-50 border-green-100",
          },
          {
            label: "Rejected",
            val: stats.rejected,
            color: "text-red-500",
            bg: "bg-red-50 border-red-100",
          },
          {
            label: "Total Refunded",
            val: `৳${(stats.totalRefund || 0).toLocaleString()}`,
            color: "text-indigo-600",
            bg: "bg-indigo-50 border-indigo-100",
          },
        ].map(({ label, val, color, bg }) => (
          <div key={label} className={`rounded-xl p-4 shadow-sm border ${bg}`}>
            <p
              className={`text-xs uppercase tracking-wide ${color} opacity-70`}
            >
              {label}
            </p>
            <p className={`text-2xl font-bold mt-1 ${color}`}>{val ?? 0}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border">
        {/* Header */}
        <div className="px-5 py-4 border-b flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="min-w-0">
              <h2 className="text-base font-semibold text-gray-800">
                Returned Orders
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Orders marked as returned — approve or reject each return
              </p>
            </div>
            <div className="sm:ml-auto flex items-center gap-2 shrink-0">
              <span className="text-xs text-gray-400">
                {total} request{total !== 1 ? "s" : ""}
              </span>
              <button
                type="button"
                onClick={() => setAddModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500 hover:bg-rose-600 text-white text-xs font-semibold rounded-lg transition"
              >
                <svg
                  className="w-3.5 h-3.5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path d="M12 5v14M5 12h14" />
                </svg>
                New Request
              </button>
            </div>
          </div>
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Search by customer name, phone, or order ID…"
            className="border rounded-lg px-3 py-1.5 text-sm w-full sm:w-72 focus:outline-none focus:ring-2 focus:ring-rose-300"
          />
        </div>

        {/* Filter tabs */}
        <div className="flex overflow-x-auto gap-1 px-5 py-2 border-b scrollbar-hide">
          {RETURN_TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                setPage(1);
              }}
              className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium capitalize transition ${activeTab === tab ? "bg-rose-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
            >
              {tab === "all"
                ? "All"
                : tab.charAt(0).toUpperCase() + tab.slice(1)}
              {tab !== "all" && stats[tab] != null && (
                <span className="ml-1 opacity-70">({stats[tab]})</span>
              )}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="py-16 text-center text-gray-400 text-sm">
            Loading…
          </div>
        ) : orders.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-gray-100 flex items-center justify-center text-3xl mb-3">
              ↩
            </div>
            <p className="text-sm font-medium text-gray-600">
              No returned orders
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Orders with status "returned" will appear here for processing.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="text-xs text-gray-500 uppercase border-b bg-gray-50">
                  <th className="px-4 py-3 font-medium">Order</th>
                  <th className="px-4 py-3 font-medium">Customer</th>
                  <th className="px-4 py-3 font-medium">Return Reason</th>
                  <th className="px-4 py-3 font-medium">Order Total</th>
                  <th className="px-4 py-3 font-medium">Refund</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Requested</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders.map((order) => (
                  <tr
                    key={order._id}
                    onClick={() =>
                      router.push(`/dashboard/orders/${order._id}`)
                    }
                    className="hover:bg-rose-50 transition cursor-pointer"
                  >
                    <td
                      className="px-4 py-3"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Link
                        href={`/dashboard/orders/${order._id}`}
                        className="font-mono text-xs bg-gray-100 rounded px-1.5 py-0.5 text-rose-600 hover:underline"
                      >
                        {formatOrderId(order._id)}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-800">
                        {order.billingDetails?.name || "—"}
                      </p>
                      <p className="text-xs text-gray-400">
                        {order.billingDetails?.phone}
                      </p>
                    </td>
                    <td className="px-4 py-3 max-w-[14rem]">
                      <p className="text-sm text-gray-700 line-clamp-2">
                        {order.returnRequest?.reason || "—"}
                      </p>
                      {order.returnRequest?.adminNote && (
                        <p className="text-xs text-gray-400 mt-0.5 italic">
                          Note: {order.returnRequest.adminNote}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-800">
                      ৳{order.total?.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 font-semibold text-green-700">
                      {order.returnRequest?.status === "approved"
                        ? `৳${(order.returnRequest.refundAmount || 0).toLocaleString()}`
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block text-xs font-medium px-2 py-1 rounded-full capitalize ${RETURN_STATUS_STYLE[order.returnRequest?.status ?? "pending"] || ""}`}
                      >
                        {order.returnRequest?.status ?? "pending"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                      {order.returnRequest?.requestedAt
                        ? fmtDate(order.returnRequest.requestedAt)
                        : fmtDate(order.updatedAt || order.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <ReturnsActionsMenu
                        order={order}
                        onAction={handleMenuAction}
                        onDelete={handleDelete}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination page={page} totalPages={totalPages} onPage={setPage} />
      </div>

      {actionModal && (
        <ReturnActionModal
          modal={actionModal}
          onClose={() => setActionModal(null)}
          onSave={handleAction}
        />
      )}
      {addModal && (
        <AddReturnModal
          onClose={() => setAddModal(false)}
          onSave={handleAddReturn}
        />
      )}
    </div>
  );
}

// ─── All Orders section ───────────────────────────────────────────────────────

const ALL_ORDERS_TABS = [
  "all",
  "pending",
  "accepted",
  "confirmed",
  "delivered",
  "rejected",
  "returned",
  "cancelled",
  "failed",
];
const ALL_ORDERS_LABELS = {
  all: "All",
  pending: "Pending",
  accepted: "Accepted",
  confirmed: "Confirmed",
  delivered: "Delivered",
  rejected: "Rejected",
  returned: "Returned",
  cancelled: "Cancelled",
  failed: "Failed",
};

function AllOrdersSection() {
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [query, setQuery] = useState("");
  const [datePreset, setDatePreset] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const fetchOrders = useCallback(async (tab, q, pg, preset) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: pg, limit: 20 });
      if (tab && tab !== "all") params.set("status", tab);
      if (q) params.set("q", q);
      const from = dateFromPreset(preset);
      if (from) params.set("dateFrom", from);
      const r = await fetch(`${API}/api/admin/orders?${params}`, {
        credentials: "include",
      });
      const body = await r.json();
      if (r.ok) {
        setOrders(body.orders || []);
        setStats(body.stats || {});
        setTotalPages(body.pages || 1);
        setTotal(body.total || 0);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders(activeTab, query, page, datePreset);
  }, [activeTab, query, page, datePreset, fetchOrders]);

  const handleDelete = async (e, orderId) => {
    e.stopPropagation();
    if (!confirm("Permanently delete this order?")) return;
    try {
      const r = await fetch(`${API}/api/admin/orders/${orderId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (r.ok) {
        setOrders((p) => p.filter((o) => o._id !== orderId));
        setTotal((p) => p - 1);
      }
    } catch {}
  };

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Orders", val: stats.all, color: "text-gray-800" },
          { label: "Pending", val: stats.pending, color: "text-yellow-600" },
          { label: "Delivered", val: stats.delivered, color: "text-green-600" },
          {
            label: "Revenue",
            val:
              stats.revenue != null
                ? `৳${stats.revenue.toLocaleString()}`
                : "—",
            color: "text-indigo-600",
          },
        ].map(({ label, val, color }) => (
          <div key={label} className="bg-white rounded-xl p-4 shadow-sm border">
            <p
              className={`text-xs uppercase tracking-wide ${color} opacity-70`}
            >
              {label}
            </p>
            <p className={`text-2xl font-bold mt-1 ${color}`}>{val ?? "—"}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border">
        {/* Header */}
        <div className="px-5 py-4 border-b flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <h2 className="text-base font-semibold text-gray-800 shrink-0">
              Orders
            </h2>
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Search by name, phone, order ID…"
              className="border rounded-lg px-3 py-1.5 text-sm w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-rose-300"
            />
            <span className="text-xs text-gray-400 sm:ml-auto shrink-0">
              {total} result{total !== 1 ? "s" : ""}
            </span>
          </div>
          <DateFilter
            value={datePreset}
            onChange={(v) => {
              setDatePreset(v);
              setPage(1);
            }}
          />
        </div>

        {/* Sub-tabs */}
        <div className="flex overflow-x-auto gap-1 px-5 py-2 border-b scrollbar-hide">
          {ALL_ORDERS_TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                setPage(1);
              }}
              className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium capitalize transition ${activeTab === tab ? "bg-rose-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
            >
              {ALL_ORDERS_LABELS[tab]}
              {stats[tab] != null && (
                <span className="ml-1 opacity-70">({stats[tab]})</span>
              )}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="py-16 text-center text-gray-400 text-sm">
            Loading orders…
          </div>
        ) : orders.length === 0 ? (
          <div className="py-16 text-center text-gray-400 text-sm">
            No orders found.
          </div>
        ) : (
          <OrdersTable
            orders={orders}
            onDelete={handleDelete}
            onRowClick={(id) => router.push(`/dashboard/orders/${id}`)}
            onCustomerClick={(order) =>
              setSelectedCustomer({
                name: order.billingDetails?.name,
                phone: order.billingDetails?.phone,
                email: order.billingDetails?.email,
                userId: order.userId,
              })
            }
          />
        )}
        <Pagination page={page} totalPages={totalPages} onPage={setPage} />
      </div>
      {selectedCustomer && (
        <OrderCustomerModal
          {...selectedCustomer}
          onClose={() => setSelectedCustomer(null)}
        />
      )}
    </div>
  );
}

// ─── Filtered orders section (Incomplete / Cancelled) ────────────────────────

function FilteredOrdersSection({
  statusFilter,
  title,
  emptyMsg,
  showAging = false,
  showCancelReason = false,
}) {
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [datePreset, setDatePreset] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const openCustomer = (order) =>
    setSelectedCustomer({
      name: order.billingDetails?.name,
      phone: order.billingDetails?.phone,
      email: order.billingDetails?.email,
      userId: order.userId,
    });

  const fetch_ = useCallback(
    async (q, pg, preset) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: pg,
          limit: 20,
          status: statusFilter,
        });
        if (q) params.set("q", q);
        const from = dateFromPreset(preset);
        if (from) params.set("dateFrom", from);
        const r = await fetch(`${API}/api/admin/orders?${params}`, {
          credentials: "include",
        });
        const body = await r.json();
        if (r.ok) {
          setOrders(body.orders || []);
          setTotalPages(body.pages || 1);
          setTotal(body.total || 0);
        }
      } catch {
      } finally {
        setLoading(false);
      }
    },
    [statusFilter],
  );

  useEffect(() => {
    fetch_(query, page, datePreset);
  }, [query, page, datePreset, fetch_]);

  const handleDelete = async (e, orderId) => {
    e.stopPropagation();
    if (!confirm("Permanently delete this order?")) return;
    try {
      const r = await fetch(`${API}/api/admin/orders/${orderId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (r.ok) setOrders((p) => p.filter((o) => o._id !== orderId));
    } catch {}
  };

  // Aging summary counts (for Incomplete)
  const agingCounts = showAging
    ? orders.reduce((acc, o) => {
        const age = orderAge(o.createdAt);
        if (age) acc[age.label] = (acc[age.label] || 0) + 1;
        return acc;
      }, {})
    : {};

  return (
    <div className="space-y-4">
      {/* Aging warning banner for Incomplete */}
      {showAging && Object.keys(agingCounts).length > 0 && (
        <div className="flex flex-wrap gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 items-center">
          <svg
            className="w-4 h-4 text-amber-600 shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
          <span className="text-xs font-semibold text-amber-700">
            Orders waiting attention:
          </span>
          {Object.entries(agingCounts).map(([label, count]) => (
            <span
              key={label}
              className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full border border-amber-200"
            >
              {count} order{count > 1 ? "s" : ""} {label} old
            </span>
          ))}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border">
        <div className="px-5 py-4 border-b flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <h2 className="text-base font-semibold text-gray-800 shrink-0">
              {title}
            </h2>
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Search by name, phone, order ID…"
              className="border rounded-lg px-3 py-1.5 text-sm w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-rose-300"
            />
            <span className="text-xs text-gray-400 sm:ml-auto shrink-0">
              {total} result{total !== 1 ? "s" : ""}
            </span>
          </div>
          <DateFilter
            value={datePreset}
            onChange={(v) => {
              setDatePreset(v);
              setPage(1);
            }}
          />
        </div>

        {loading ? (
          <div className="py-16 text-center text-gray-400 text-sm">
            Loading…
          </div>
        ) : orders.length === 0 ? (
          <div className="py-16 text-center text-gray-400 text-sm">
            {emptyMsg}
          </div>
        ) : showAging ? (
          /* Incomplete orders table with aging column */
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="text-xs text-gray-500 uppercase border-b bg-gray-50">
                  <th className="px-4 py-3 font-medium">Order ID</th>
                  <th className="px-4 py-3 font-medium">Customer</th>
                  <th className="px-4 py-3 font-medium">Item</th>
                  <th className="px-4 py-3 font-medium">Total</th>
                  <th className="px-4 py-3 font-medium">Payment</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Age</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders.map((order) => {
                  const age = orderAge(order.createdAt);
                  return (
                    <tr
                      key={order._id}
                      onClick={() =>
                        router.push(`/dashboard/orders/${order._id}`)
                      }
                      className={`hover:bg-rose-50 transition cursor-pointer ${age?.color?.includes("red") ? "bg-red-50/30" : ""}`}
                    >
                      <td
                        className="px-4 py-3"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Link
                          href={`/dashboard/orders/${order._id}`}
                          className="font-mono text-xs bg-gray-100 rounded px-1.5 py-0.5 text-rose-600 hover:underline"
                        >
                          {formatOrderId(order._id)}
                        </Link>
                      </td>
                      <td
                        className="px-4 py-3"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          className="text-left"
                          onClick={() => openCustomer(order)}
                        >
                          <p className="font-medium text-gray-800 hover:text-indigo-600 hover:underline">
                            {order.billingDetails?.name || "—"}
                          </p>
                          <p className="text-xs text-gray-400">
                            {order.billingDetails?.phone}
                          </p>
                        </button>
                      </td>
                      <td className="px-4 py-3 text-gray-600 max-w-[12rem] truncate">
                        {itemSummary(order.items)}
                      </td>
                      <td className="px-4 py-3 font-semibold text-gray-800">
                        ৳{order.total?.toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <span className="block text-xs font-medium text-gray-700">
                          {METHOD_LABEL[order.paymentMethod] ||
                            order.paymentMethod}
                        </span>
                        <span
                          className={`inline-block text-xs px-1.5 py-0.5 rounded-full ${PAYMENT_STATUS_STYLE[order.paymentStatus] || ""}`}
                        >
                          {order.paymentStatus?.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/dashboard/orders/${order._id}`}
                          onClick={(e) => e.stopPropagation()}
                          className={`inline-block text-xs font-medium px-2 py-1 rounded-full capitalize hover:underline ${STATUS_STYLE[order.status] || ""}`}
                        >
                          {order.status}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        {age ? (
                          <span
                            className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full ${age.color}`}
                          >
                            {age.label}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-300">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                        {fmt(order.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <OrderActionsMenu
                          order={order}
                          onDelete={handleDelete}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : showCancelReason ? (
          <CancelledOrdersTable
            orders={orders}
            onDelete={handleDelete}
            onRowClick={(id) => router.push(`/dashboard/orders/${id}`)}
            onCustomerClick={openCustomer}
          />
        ) : (
          <OrdersTable
            orders={orders}
            onDelete={handleDelete}
            onRowClick={(id) => router.push(`/dashboard/orders/${id}`)}
            onCustomerClick={openCustomer}
          />
        )}
        <Pagination page={page} totalPages={totalPages} onPage={setPage} />
      </div>
      {selectedCustomer && (
        <OrderCustomerModal
          {...selectedCustomer}
          onClose={() => setSelectedCustomer(null)}
        />
      )}
    </div>
  );
}

// ─── Customer Notes section ───────────────────────────────────────────────────

function CustomerNoteModal({ order, onClose }) {
  const [prevOrders, setPrevOrders] = useState([]);
  const [prevLoading, setPrevLoading] = useState(false);
  const phone = order.billingDetails?.phone;
  const {
    lifetime,
    loading: lifetimeLoading,
    refresh: refreshLifetime,
  } = useCourierLifetime(phone);

  useEffect(() => {
    const uid = order.userId;
    if (!uid && !phone) return;
    setPrevLoading(true);
    const params = uid
      ? new URLSearchParams({ userId: uid, limit: 10, page: 1 })
      : new URLSearchParams({ q: phone, limit: 10, page: 1 });
    fetch(`${API}/api/admin/orders?${params}`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : { orders: [] }))
      .then((data) =>
        setPrevOrders((data.orders || []).filter((o) => o._id !== order._id)),
      )
      .catch(() => {})
      .finally(() => setPrevLoading(false));
  }, [order._id]); // eslint-disable-line react-hooks/exhaustive-deps

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.45)" }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            <h3 className="text-lg font-bold text-gray-900">
              {order.billingDetails?.name || "—"}
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              {fmtDate(order.createdAt)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 text-xl leading-none"
          >
            ×
          </button>
        </div>

        <div className="overflow-y-auto flex-1">
          {/* Contact */}
          <div className="px-6 py-4 border-b">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
              Contact Info
            </p>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-gray-400 mb-0.5">নাম</p>
                <p className="font-medium text-gray-800">
                  {order.billingDetails?.name || "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-0.5">ফোন</p>
                <p className="font-medium text-gray-800">
                  {order.billingDetails?.phone || "—"}
                </p>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-gray-400 mb-0.5">ইমেইল</p>
                <p className="font-medium text-gray-800">
                  {order.billingDetails?.email || "—"}
                </p>
              </div>
              {order.billingDetails?.address && (
                <div className="col-span-2">
                  <p className="text-xs text-gray-400 mb-0.5">ঠিকানা</p>
                  <p className="font-medium text-gray-800">
                    {order.billingDetails.address}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Note */}
          <div className="px-6 py-4 border-b">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
              Customer Note
            </p>
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
              <p className="text-sm text-gray-800 leading-relaxed">
                "{order.billingDetails?.note}"
              </p>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <a
                href={`/dashboard/orders/${order._id}`}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-indigo-600 hover:underline font-mono"
              >
                #{String(order._id).slice(-8).toUpperCase()} →
              </a>
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-medium ${ORDER_STATUS_COLOR[order.status] || "bg-gray-100 text-gray-500"}`}
              >
                {ORDER_STATUS_LABEL[order.status] || order.status}
              </span>
              <span className="text-sm font-semibold text-gray-800 ml-auto">
                ৳{Number(order.total || 0).toLocaleString("en-BD")}
              </span>
            </div>
          </div>

          {/* Courier Score */}
          <div className="px-6 py-4 border-b">
            <CourierScorePanel
              lifetime={lifetime}
              phone={phone}
              loading={lifetimeLoading}
              onRefresh={refreshLifetime}
            />
          </div>

          {/* Previous orders */}
          <div className="px-6 py-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
              Previous Orders
              {!prevLoading && (
                <span className="ml-2 text-gray-300 font-normal normal-case">
                  ({prevOrders.length} টি পাওয়া গেছে)
                </span>
              )}
            </p>
            {prevLoading ? (
              <p className="text-xs text-gray-400 py-3 text-center">
                লোড হচ্ছে…
              </p>
            ) : prevOrders.length === 0 ? (
              <p className="text-xs text-gray-400 py-3 text-center italic">
                অন্য কোনো order নেই
              </p>
            ) : (
              <div className="space-y-2">
                {prevOrders.map((o) => (
                  <a
                    key={o._id}
                    href={`/dashboard/orders/${o._id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between gap-3 p-3 rounded-xl border hover:border-gray-300 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xs font-mono text-gray-500 shrink-0">
                        #{String(o._id).slice(-8).toUpperCase()}
                      </span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${ORDER_STATUS_COLOR[o.status] || "bg-gray-100 text-gray-500"}`}
                      >
                        {ORDER_STATUS_LABEL[o.status] || o.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-sm font-semibold text-gray-800">
                        ৳{Number(o.total || 0).toLocaleString("en-BD")}
                      </span>
                      <span className="text-xs text-gray-400">
                        {o.createdAt
                          ? new Date(o.createdAt).toLocaleDateString("en-BD", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })
                          : ""}
                      </span>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function CustomerNotesSection() {
  const { user } = useUser();
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const PAGE_SIZE = 20;

  const load = useCallback(async (pg) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pg,
        limit: PAGE_SIZE,
        hasNote: "1",
      });
      const r = await fetch(`${API}/api/admin/orders?${params}`, {
        credentials: "include",
      });
      const body = r.ok ? await r.json() : {};
      setOrders(body.orders || []);
      setTotalPages(body.pages || 1);
      setTotal(body.total || 0);
    } catch {
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(page);
  }, [page, load]); // eslint-disable-line react-hooks/exhaustive-deps

  const deleteOrder = async (id) => {
    if (!window.confirm("এই order টি মুছে ফেলবেন?")) return;
    setDeletingId(id);
    try {
      await fetch(`${API}/api/admin/orders/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      setOrders((prev) => prev.filter((o) => o._id !== id));
      setTotal((t) => Math.max(0, t - 1));
    } finally {
      setDeletingId(null);
    }
  };

  const goPage = (p) => setPage(p);

  const pageNumbers = () => {
    if (totalPages <= 7)
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages = new Set([1, totalPages, page]);
    for (
      let i = Math.max(2, page - 1);
      i <= Math.min(totalPages - 1, page + 1);
      i++
    )
      pages.add(i);
    return [...pages]
      .sort((a, b) => a - b)
      .reduce((acc, n, i, arr) => {
        if (i > 0 && n - arr[i - 1] > 1) acc.push("…");
        acc.push(n);
        return acc;
      }, []);
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Customer Notes</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          {total} টি order যেখানে customer checkout-এ note দিয়েছেন
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-gray-400 text-sm">
            লোড হচ্ছে…
          </div>
        ) : orders.length === 0 ? (
          <div className="py-16 text-center text-gray-400 text-sm">
            কোনো customer note নেই।
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {orders.map((order, idx) => (
              <div
                key={order._id}
                className="px-5 py-4 hover:bg-amber-50/40 transition"
              >
                <div className="flex items-start gap-4">
                  {/* Row number */}
                  <span className="text-xs text-gray-300 pt-0.5 shrink-0 w-5 text-right">
                    {(page - 1) * PAGE_SIZE + idx + 1}
                  </span>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1.5">
                      <Link
                        href={`/dashboard/orders/${order._id}`}
                        className="font-mono text-xs bg-gray-100 rounded px-1.5 py-0.5 text-rose-600 hover:underline"
                      >
                        {formatOrderId(order._id)}
                      </Link>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${STATUS_STYLE[order.status] || ""}`}
                      >
                        {order.status}
                      </span>
                      {/* Customer name — clickable */}
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="text-xs font-medium text-indigo-600 hover:underline"
                      >
                        {order.billingDetails?.name || "—"}
                      </button>
                      <span className="text-xs text-gray-400">
                        {order.billingDetails?.phone}
                      </span>
                    </div>

                    {/* Note box */}
                    <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                      <p className="text-xs text-gray-500 mb-0.5 font-medium">
                        Note from customer
                      </p>
                      <p className="text-sm text-gray-800">
                        "{order.billingDetails?.note}"
                      </p>
                    </div>
                  </div>

                  {/* Right side */}
                  <div className="text-right shrink-0 flex flex-col items-end gap-1.5">
                    <p className="font-semibold text-gray-800">
                      ৳{order.total?.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-400">
                      {fmtDate(order.createdAt)}
                    </p>
                    {user?.role === "admin" && (
                      <button
                        onClick={() => deleteOrder(order._id)}
                        disabled={deletingId === order._id}
                        className="text-xs text-red-500 hover:text-red-700 hover:underline disabled:opacity-40"
                      >
                        {deletingId === order._id ? "…" : "Delete"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1.5 flex-wrap">
          <button
            onClick={() => goPage(1)}
            disabled={page === 1}
            className="px-2.5 py-1.5 text-sm rounded-lg border hover:bg-gray-50 disabled:opacity-40"
          >
            «
          </button>
          <button
            onClick={() => goPage(page - 1)}
            disabled={page === 1}
            className="px-3 py-1.5 text-sm rounded-lg border hover:bg-gray-50 disabled:opacity-40"
          >
            ‹ Prev
          </button>
          {pageNumbers().map((n, i) =>
            n === "…" ? (
              <span
                key={`ellipsis-${i}`}
                className="px-2 text-gray-400 text-sm"
              >
                …
              </span>
            ) : (
              <button
                key={n}
                onClick={() => goPage(n)}
                className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${page === n ? "bg-indigo-600 text-white border-indigo-600 font-semibold" : "hover:bg-gray-50"}`}
              >
                {n}
              </button>
            ),
          )}
          <button
            onClick={() => goPage(page + 1)}
            disabled={page === totalPages}
            className="px-3 py-1.5 text-sm rounded-lg border hover:bg-gray-50 disabled:opacity-40"
          >
            Next ›
          </button>
          <button
            onClick={() => goPage(totalPages)}
            disabled={page === totalPages}
            className="px-2.5 py-1.5 text-sm rounded-lg border hover:bg-gray-50 disabled:opacity-40"
          >
            »
          </button>
        </div>
      )}

      {selectedOrder && (
        <CustomerNoteModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
        />
      )}
    </div>
  );
}

// ─── Order Timeline section ───────────────────────────────────────────────────

const TIMELINE_STATUS_STYLE = {
  pending: "bg-yellow-400",
  accepted: "bg-emerald-400",
  picked: "bg-orange-400",
  approved: "bg-emerald-400",
  rejected: "bg-red-400",
  confirmed: "bg-blue-500",
  processing: "bg-indigo-500",
  shipped: "bg-purple-500",
  delivered: "bg-green-500",
  returned: "bg-teal-500",
  cancelled: "bg-gray-400",
  failed: "bg-red-500",
  "return-pending": "bg-amber-400",
  "return-approved": "bg-teal-400",
  "return-rejected": "bg-red-400",
};

const RETURN_STATUS_LABEL = {
  "return-pending": "Return Pending",
  "return-approved": "Return Approved",
  "return-rejected": "Return Rejected",
};

function timelineStatusLabel(s) {
  return RETURN_STATUS_LABEL[s] || s;
}

function OrderTimelineSection() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedOrders, setExpandedOrders] = useState(new Set());
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  useEffect(() => {
    setLoading(true);
    fetch(`${API}/api/admin/orders/timeline?limit=60`, {
      credentials: "include",
    })
      .then((r) => r.json())
      .then((d) => setEvents(d.events || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const toggle = (orderId) => {
    setExpandedOrders((prev) => {
      const next = new Set(prev);
      if (next.has(orderId)) next.delete(orderId);
      else next.add(orderId);
      return next;
    });
  };

  if (loading)
    return (
      <div className="bg-white rounded-xl shadow-sm border py-20 text-center text-gray-400 text-sm">
        Loading timeline…
      </div>
    );

  if (!events.length)
    return (
      <div className="bg-white rounded-xl shadow-sm border py-20 text-center text-gray-400 text-sm">
        No timeline events yet. Status changes will appear here.
      </div>
    );

  // Group events by orderId, preserving order of first occurrence
  const orderMap = {};
  const orderKeys = [];
  for (const ev of events) {
    if (!orderMap[ev.orderId]) {
      orderMap[ev.orderId] = {
        orderId: ev.orderId,
        orderIdShort: ev.orderIdShort,
        customerName: ev.customerName,
        customerPhone: ev.customerPhone,
        latestStatus: ev.newStatus,
        latestAt: ev.at,
        events: [],
      };
      orderKeys.push(ev.orderId);
    }
    orderMap[ev.orderId].events.push(ev);
  }
  const orders = orderKeys.map((k) => orderMap[k]);

  return (
    <div className="bg-white rounded-xl shadow-sm border">
      <div className="px-5 py-4 border-b">
        <h2 className="text-base font-semibold text-gray-800">
          Order Timeline
        </h2>
        <p className="text-xs text-gray-400 mt-0.5">
          Recent status changes across all orders — click an order to expand
        </p>
      </div>
      <div className="divide-y divide-gray-100">
        {orders.map((order) => {
          const isOpen = expandedOrders.has(order.orderId);
          return (
            <div key={order.orderId}>
              <button
                type="button"
                onClick={() => toggle(order.orderId)}
                className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 transition text-left"
              >
                <svg
                  className={`w-3.5 h-3.5 text-gray-400 shrink-0 transition-transform duration-150 ${isOpen ? "rotate-90" : ""}`}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path d="M9 18l6-6-6-6" />
                </svg>
                <span onClick={(e) => e.stopPropagation()}>
                  <Link
                    href={`/dashboard/orders/${order.orderId}`}
                    className="font-mono text-xs text-rose-600 hover:underline bg-rose-50 px-1.5 py-0.5 rounded"
                  >
                    #{order.orderIdShort}
                  </Link>
                </span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${STATUS_STYLE[order.latestStatus] || ""}`}
                >
                  {timelineStatusLabel(order.latestStatus)}
                </span>
                <span className="text-xs text-gray-600 flex-1 min-w-0 truncate">
                  {order.customerName}
                  {order.customerPhone ? ` · ${order.customerPhone}` : ""}
                </span>
                <span className="text-xs text-gray-300 shrink-0">
                  {order.events.length} event
                  {order.events.length !== 1 ? "s" : ""}
                </span>
                <span className="text-xs text-gray-400 shrink-0">
                  {fmtDate(order.latestAt)}
                </span>
              </button>

              {isOpen && (
                <div className="px-5 pb-4 pt-1 bg-gray-50/60">
                  <div className="relative pl-6 space-y-3">
                    <div className="absolute left-1.5 top-0 bottom-0 w-px bg-gray-200" />
                    {order.events.map((ev, i) => (
                      <div key={i} className="relative flex items-start gap-3">
                        <div
                          className={`absolute -left-4.5 w-3 h-3 rounded-full mt-0.5 shrink-0 ${TIMELINE_STATUS_STYLE[ev.newStatus] || "bg-gray-300"}`}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLE[ev.newStatus] || ""}`}
                            >
                              {timelineStatusLabel(ev.newStatus)}
                            </span>
                            {ev.previousStatus && (
                              <span className="text-xs text-gray-400">
                                ← {timelineStatusLabel(ev.previousStatus)}
                              </span>
                            )}
                            <span className="text-xs text-gray-400 ml-auto">
                              {new Date(ev.at).toLocaleTimeString("en-GB", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                          {ev.customerName && (
                            <button
                              type="button"
                              className="text-xs text-gray-500 hover:text-indigo-600 hover:underline mt-0.5"
                              onClick={() =>
                                setSelectedCustomer({
                                  name: ev.customerName,
                                  phone: ev.customerPhone,
                                })
                              }
                            >
                              {ev.customerName}
                              {ev.customerPhone ? ` · ${ev.customerPhone}` : ""}
                            </button>
                          )}
                          {ev.reason && (
                            <p className="text-xs text-gray-400 italic mt-0.5">
                              "{ev.reason}"
                            </p>
                          )}
                          {ev.changedBy && ev.changedBy !== "system" && (
                            <p className="text-xs text-gray-400">
                              by {ev.changedBy}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      {selectedCustomer && (
        <OrderCustomerModal
          {...selectedCustomer}
          onClose={() => setSelectedCustomer(null)}
        />
      )}
    </div>
  );
}

// ─── Abandoned Carts ─────────────────────────────────────────────────────────

function AbandonedCartModal({ user, onClose }) {
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const {
    lifetime,
    loading: lifetimeLoading,
    refresh: refreshLifetime,
  } = useCourierLifetime(user.mobile);

  const cartValue = (user.savedCart?.items || []).reduce(
    (s, i) => s + (i.price || 0) * (i.quantity || 1),
    0,
  );

  const timeAgo = (date) => {
    const mins = Math.floor((Date.now() - new Date(date)) / 60000);
    if (mins < 60) return `${mins} মিনিট আগে`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} ঘন্টা আগে`;
    const days = Math.floor(hrs / 24);
    if (days < 30) return `${days} দিন আগে`;
    return new Date(date).toLocaleDateString("en-BD");
  };

  useEffect(() => {
    if (!user._id) return;
    setOrdersLoading(true);
    fetch(
      `${API}/api/admin/orders?${new URLSearchParams({ userId: user._id, limit: 10, page: 1 })}`,
      {
        credentials: "include",
      },
    )
      .then((r) => (r.ok ? r.json() : { orders: [] }))
      .then((data) => setOrders(data.orders || []))
      .catch(() => {})
      .finally(() => setOrdersLoading(false));
  }, [user._id]); // eslint-disable-line react-hooks/exhaustive-deps

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.45)" }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            <h3 className="text-lg font-bold text-gray-900">
              {user.name || "—"}
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Cart last updated{" "}
              {user.savedCart?.updatedAt
                ? timeAgo(user.savedCart.updatedAt)
                : ""}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 text-xl leading-none"
          >
            ×
          </button>
        </div>

        <div className="overflow-y-auto flex-1">
          {/* Contact */}
          <div className="px-6 py-4 border-b">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
              Contact Info
            </p>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-gray-400 mb-0.5">নাম</p>
                <p className="font-medium text-gray-800">{user.name || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-0.5">ফোন</p>
                <p className="font-medium text-gray-800">
                  {user.mobile || "—"}
                </p>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-gray-400 mb-0.5">ইমেইল</p>
                <p className="font-medium text-gray-800">{user.email || "—"}</p>
              </div>
            </div>
          </div>

          {/* Cart items */}
          <div className="px-6 py-4 border-b">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
              Abandoned Cart ({user.savedCart?.items?.length || 0} টি পণ্য)
            </p>
            <div className="space-y-2">
              {(user.savedCart?.items || []).map((item, idx) => (
                <a
                  key={idx}
                  href={`/product/${item.productId}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3 p-2.5 rounded-xl border hover:border-indigo-300 hover:bg-indigo-50/40 transition-colors group"
                >
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-11 h-11 rounded-lg object-cover border shrink-0"
                    />
                  ) : (
                    <div className="w-11 h-11 rounded-lg bg-gray-100 shrink-0 flex items-center justify-center text-gray-300 text-lg">
                      📦
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate group-hover:text-indigo-700">
                      {item.title || "—"}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      ৳{Number(item.price || 0).toLocaleString("en-BD")}
                      {item.color && (
                        <span className="ml-1">· {item.color}</span>
                      )}
                      {item.size && <span className="ml-1">· {item.size}</span>}
                      {" × "}
                      {item.quantity}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-gray-700 shrink-0">
                    ৳
                    {((item.price || 0) * (item.quantity || 1)).toLocaleString(
                      "en-BD",
                    )}
                  </p>
                </a>
              ))}
            </div>
            <div className="flex justify-between items-center mt-3 pt-3 border-t">
              <span className="text-sm text-gray-500">মোট Cart Value</span>
              <span className="font-bold text-gray-900">
                ৳{cartValue.toLocaleString("en-BD")}
              </span>
            </div>
          </div>

          {/* Courier Score */}
          <div className="px-6 py-4 border-b">
            <CourierScorePanel
              lifetime={lifetime}
              phone={user.mobile}
              loading={lifetimeLoading}
              onRefresh={refreshLifetime}
            />
          </div>

          {/* Previous orders */}
          <div className="px-6 py-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
              Previous Orders
              {!ordersLoading && (
                <span className="ml-2 text-gray-300 font-normal normal-case">
                  ({orders.length} টি পাওয়া গেছে)
                </span>
              )}
            </p>
            {ordersLoading ? (
              <p className="text-xs text-gray-400 py-3 text-center">
                লোড হচ্ছে…
              </p>
            ) : orders.length === 0 ? (
              <p className="text-xs text-gray-400 py-3 text-center italic">
                এই customer-এর কোনো আগের order নেই
              </p>
            ) : (
              <div className="space-y-2">
                {orders.map((o) => (
                  <a
                    key={o._id}
                    href={`/dashboard/orders/${o._id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between gap-3 p-3 rounded-xl border hover:border-gray-300 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xs font-mono text-gray-500 shrink-0">
                        #{String(o._id).slice(-8).toUpperCase()}
                      </span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${ORDER_STATUS_COLOR[o.status] || "bg-gray-100 text-gray-500"}`}
                      >
                        {ORDER_STATUS_LABEL[o.status] || o.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-sm font-semibold text-gray-800">
                        ৳{Number(o.total || 0).toLocaleString("en-BD")}
                      </span>
                      <span className="text-xs text-gray-400">
                        {o.createdAt
                          ? new Date(o.createdAt).toLocaleDateString("en-BD", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })
                          : ""}
                      </span>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function AbandonedCartSection() {
  const { user } = useUser();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const searchRef = useRef(null);
  const PAGE_SIZE = 20;

  const load = useCallback(async (pg, query) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: pg, limit: PAGE_SIZE });
      if (query) params.set("q", query);
      const r = await fetch(`${API}/api/admin/abandoned-carts?${params}`, {
        credentials: "include",
      });
      const data = r.ok ? await r.json() : {};
      setRows(data.users || []);
      setTotal(data.total || 0);
      setTotalPages(data.pages || 1);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(1, "");
  }, [load]);

  useEffect(() => {
    clearTimeout(searchRef.current);
    searchRef.current = setTimeout(() => {
      setPage(1);
      load(1, q);
    }, 300);
    return () => clearTimeout(searchRef.current);
  }, [q, load]);

  const timeAgo = (date) => {
    const mins = Math.floor((Date.now() - new Date(date)) / 60000);
    if (mins < 60) return `${mins} মিনিট আগে`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} ঘন্টা আগে`;
    return `${Math.floor(hrs / 24)} দিন আগে`;
  };

  const deleteCart = async (userId) => {
    if (!confirm("এই customer-এর abandoned cart delete করবেন?")) return;
    setDeletingId(userId);
    try {
      await fetch(`${API}/api/admin/abandoned-carts/${userId}/clear`, {
        method: "DELETE",
        credentials: "include",
      });
      setRows((prev) => prev.filter((u) => u._id !== userId));
      setTotal((prev) => Math.max(0, prev - 1));
    } finally {
      setDeletingId(null);
    }
  };

  const goPage = (p) => {
    setPage(p);
    load(p, q);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Abandoned Carts</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {total} জন logged-in customer পণ্য cart-এ রেখে চলে গেছেন
          </p>
        </div>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="নাম, ইমেইল বা ফোন দিয়ে খুঁজুন…"
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 w-64"
        />
      </div>

      {/* Info note */}
      <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-800">
        <span className="text-base mt-0.5">ℹ️</span>
        <span>
          শুধুমাত্র <strong>account-এ login করা</strong> customer-দের abandoned
          cart দেখা যাবে। Customer-এর নামে click করলে full details ও order
          history দেখা যাবে, item-এ click করলে product page।
        </span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-gray-400">লোড হচ্ছে…</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b text-xs text-gray-500 uppercase tracking-wide">
              <tr>
                <th className="px-4 py-3 text-left">#</th>
                <th className="px-4 py-3 text-left">Customer</th>
                <th className="px-4 py-3 text-left">Contact</th>
                <th className="px-4 py-3 text-left">Cart Items</th>
                <th className="px-4 py-3 text-right">Cart Value</th>
                <th className="px-4 py-3 text-left">কতক্ষণ আগে</th>
                <th className="px-4 py-3 text-left"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {rows.map((u, idx) => {
                const cartValue = (u.savedCart?.items || []).reduce(
                  (s, i) => s + (i.price || 0) * (i.quantity || 1),
                  0,
                );
                return (
                  <tr key={u._id} className="hover:bg-gray-50/50">
                    {/* Row number */}
                    <td className="px-4 py-3 text-gray-400 text-xs">
                      {(page - 1) * PAGE_SIZE + idx + 1}
                    </td>

                    {/* Customer name → opens modal */}
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setSelectedUser(u)}
                        className="font-medium text-indigo-600 hover:text-indigo-800 hover:underline text-left"
                      >
                        {u.name || (
                          <span className="text-gray-400 italic font-normal">
                            —
                          </span>
                        )}
                      </button>
                    </td>

                    {/* Contact */}
                    <td className="px-4 py-3 text-gray-500 text-xs space-y-0.5">
                      {u.mobile && <div>{u.mobile}</div>}
                      {u.email && (
                        <div className="text-gray-400 truncate max-w-[140px]">
                          {u.email}
                        </div>
                      )}
                    </td>

                    {/* Items → pill chips linking to product */}
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1.5">
                        {(u.savedCart?.items || []).map((item, i) => (
                          <a
                            key={i}
                            href={`/product/${item.productId}`}
                            target="_blank"
                            rel="noreferrer"
                            title={item.title}
                            className="inline-flex items-center gap-1 text-xs bg-gray-100 hover:bg-indigo-100 hover:text-indigo-700 text-gray-700 rounded-full px-2.5 py-1 transition-colors max-w-[140px]"
                          >
                            {item.image && (
                              <img
                                src={item.image}
                                alt=""
                                className="w-4 h-4 rounded-full object-cover shrink-0"
                              />
                            )}
                            <span className="truncate">
                              {item.title || "পণ্য"}
                            </span>
                            {item.quantity > 1 && (
                              <span className="text-gray-400 shrink-0">
                                ×{item.quantity}
                              </span>
                            )}
                          </a>
                        ))}
                      </div>
                    </td>

                    {/* Cart value */}
                    <td className="px-4 py-3 text-right font-semibold text-gray-800 whitespace-nowrap">
                      ৳{cartValue.toLocaleString("en-BD")}
                    </td>

                    {/* Time ago */}
                    <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                      {u.savedCart?.updatedAt
                        ? timeAgo(u.savedCart.updatedAt)
                        : "—"}
                    </td>

                    {/* Delete */}
                    <td className="px-4 py-3">
                      {user?.role === "admin" && (
                        <button
                          onClick={() => deleteCart(u._id)}
                          disabled={deletingId === u._id}
                          className="text-xs text-red-500 hover:text-red-700 hover:underline disabled:opacity-40 font-medium"
                        >
                          {deletingId === u._id ? "…" : "Delete"}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {!rows.length && !loading && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-12 text-center text-gray-400"
                  >
                    কোনো abandoned cart নেই
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1.5">
          <button
            onClick={() => goPage(1)}
            disabled={page === 1}
            className="px-2.5 py-1.5 text-xs rounded-lg border hover:bg-gray-50 disabled:opacity-40"
          >
            «
          </button>
          <button
            onClick={() => goPage(page - 1)}
            disabled={page === 1}
            className="px-3 py-1.5 text-sm rounded-lg border hover:bg-gray-50 disabled:opacity-40"
          >
            ← Prev
          </button>
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            const start = Math.max(1, Math.min(page - 2, totalPages - 4));
            const p = start + i;
            return (
              <button
                key={p}
                onClick={() => goPage(p)}
                className={`w-9 h-9 text-sm rounded-lg border transition-colors ${p === page ? "bg-indigo-600 text-white border-indigo-600 font-semibold" : "hover:bg-gray-50"}`}
              >
                {p}
              </button>
            );
          })}
          <button
            onClick={() => goPage(page + 1)}
            disabled={page === totalPages}
            className="px-3 py-1.5 text-sm rounded-lg border hover:bg-gray-50 disabled:opacity-40"
          >
            Next →
          </button>
          <button
            onClick={() => goPage(totalPages)}
            disabled={page === totalPages}
            className="px-2.5 py-1.5 text-xs rounded-lg border hover:bg-gray-50 disabled:opacity-40"
          >
            »
          </button>
          <span className="text-xs text-gray-400 ml-2">
            Page {page} of {totalPages} · {total} users
          </span>
        </div>
      )}

      {/* Customer detail modal */}
      {selectedUser && (
        <AbandonedCartModal
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
        />
      )}
    </div>
  );
}

// ─── Abandoned Checkouts ──────────────────────────────────────────────────────

const ORDER_STATUS_LABEL = {
  pending: "Pending",
  accepted: "Accepted",
  confirmed: "Confirmed",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
  failed: "Failed",
};
const ORDER_STATUS_COLOR = {
  pending: "bg-yellow-100 text-yellow-700",
  accepted: "bg-blue-100 text-blue-700",
  confirmed: "bg-indigo-100 text-indigo-700",
  processing: "bg-purple-100 text-purple-700",
  shipped: "bg-cyan-100 text-cyan-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-600",
  failed: "bg-gray-100 text-gray-500",
};

// ─── Generic Order Customer Modal (used by AllOrders / Filtered / Timeline) ───

function OrderCustomerModal({ name, phone, email, userId, onClose }) {
  const [prevOrders, setPrevOrders] = useState([]);
  const [prevLoading, setPrevLoading] = useState(false);
  const {
    lifetime,
    loading: lifetimeLoading,
    refresh: refreshLifetime,
  } = useCourierLifetime(phone);

  useEffect(() => {
    if (!userId && !phone) return;
    setPrevLoading(true);
    const params = userId
      ? new URLSearchParams({ userId, limit: 10, page: 1 })
      : new URLSearchParams({ q: phone, limit: 10, page: 1 });
    fetch(`${API}/api/admin/orders?${params}`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : { orders: [] }))
      .then((data) => setPrevOrders(data.orders || []))
      .catch(() => {})
      .finally(() => setPrevLoading(false));
  }, [userId, phone]); // eslint-disable-line react-hooks/exhaustive-deps

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.45)" }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            <h3 className="text-lg font-bold text-gray-900">{name || "—"}</h3>
            {phone && (
              <p className="text-xs font-mono text-gray-400 mt-0.5">{phone}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 text-xl leading-none"
          >
            ×
          </button>
        </div>

        <div className="overflow-y-auto flex-1">
          {/* Contact */}
          <div className="px-6 py-4 border-b">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
              Contact Info
            </p>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-gray-400 mb-0.5">নাম</p>
                <p className="font-medium text-gray-800">{name || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-0.5">ফোন</p>
                <p className="font-medium text-gray-800">{phone || "—"}</p>
              </div>
              {email && (
                <div className="col-span-2">
                  <p className="text-xs text-gray-400 mb-0.5">ইমেইল</p>
                  <p className="font-medium text-gray-800">{email}</p>
                </div>
              )}
            </div>
          </div>

          {/* Courier Score */}
          <div className="px-6 py-4 border-b">
            <CourierScorePanel
              lifetime={lifetime}
              phone={phone}
              loading={lifetimeLoading}
              onRefresh={refreshLifetime}
            />
          </div>

          {/* Previous Orders */}
          <div className="px-6 py-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
              Previous Orders
              {!prevLoading && (
                <span className="ml-2 text-gray-300 font-normal normal-case">
                  ({prevOrders.length} টি পাওয়া গেছে)
                </span>
              )}
            </p>
            {prevLoading ? (
              <p className="text-xs text-gray-400 py-3 text-center">
                লোড হচ্ছে…
              </p>
            ) : prevOrders.length === 0 ? (
              <p className="text-xs text-gray-400 py-3 text-center italic">
                কোনো আগের order নেই
              </p>
            ) : (
              <div className="space-y-2">
                {prevOrders.map((o) => (
                  <a
                    key={o._id}
                    href={`/dashboard/orders/${o._id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between gap-3 p-3 rounded-xl border hover:border-gray-300 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xs font-mono text-gray-500 shrink-0">
                        #{String(o._id).slice(-8).toUpperCase()}
                      </span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${ORDER_STATUS_COLOR[o.status] || "bg-gray-100 text-gray-500"}`}
                      >
                        {ORDER_STATUS_LABEL[o.status] || o.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-sm font-semibold text-gray-800">
                        ৳{Number(o.total || 0).toLocaleString("en-BD")}
                      </span>
                      <span className="text-xs text-gray-400">
                        {o.createdAt
                          ? new Date(o.createdAt).toLocaleDateString("en-BD", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })
                          : ""}
                      </span>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function CheckoutSessionModal({ session, onClose }) {
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const {
    lifetime,
    loading: lifetimeLoading,
    refresh: refreshLifetime,
  } = useCourierLifetime(session.userPhone);

  const itemTotal = (session.items || []).reduce(
    (sum, i) => sum + (i.price || 0) * (i.quantity || 1),
    0,
  );

  const timeAgo = (date) => {
    const mins = Math.floor((Date.now() - new Date(date)) / 60000);
    if (mins < 60) return `${mins} মিনিট আগে`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} ঘন্টা আগে`;
    const days = Math.floor(hrs / 24);
    if (days < 30) return `${days} দিন আগে`;
    return new Date(date).toLocaleDateString("en-BD");
  };

  // Fetch previous orders by userId (preferred) or phone/email
  useEffect(() => {
    const identifier = session.userId || session.userPhone || session.userEmail;
    if (!identifier) return;
    setOrdersLoading(true);
    const params = new URLSearchParams({ limit: 10, page: 1 });
    if (session.userId) {
      params.set("userId", session.userId);
    } else {
      params.set("q", session.userPhone || session.userEmail);
    }
    fetch(`${API}/api/admin/orders?${params}`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : { orders: [] }))
      .then((data) => setOrders(data.orders || []))
      .catch(() => {})
      .finally(() => setOrdersLoading(false));
  }, [session._id]); // eslint-disable-line react-hooks/exhaustive-deps

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.45)" }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            <h3 className="text-lg font-bold text-gray-900">
              {session.userName || "Guest Customer"}
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              {(() => {
                const mins = session.createdAt
                  ? Math.floor(
                      (Date.now() - new Date(session.createdAt)) / 60000,
                    )
                  : null;
                return mins !== null && mins < 5 ? (
                  <span className="inline-flex items-center gap-1 text-orange-600 font-medium text-xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                    Possibly still active
                  </span>
                ) : (
                  <span>
                    Abandoned{" "}
                    {session.createdAt ? timeAgo(session.createdAt) : ""}
                  </span>
                );
              })()}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 text-xl leading-none"
          >
            ×
          </button>
        </div>

        <div className="overflow-y-auto flex-1">
          {/* Contact info */}
          <div className="px-6 py-4 border-b">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
              Contact Info
            </p>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-gray-400 mb-0.5">নাম</p>
                <p className="font-medium text-gray-800">
                  {session.userName || "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-0.5">ফোন</p>
                <p className="font-medium text-gray-800">
                  {session.userPhone || "—"}
                </p>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-gray-400 mb-0.5">ইমেইল</p>
                <p className="font-medium text-gray-800">
                  {session.userEmail || "—"}
                </p>
              </div>
            </div>
          </div>

          {/* Abandoned cart items */}
          <div className="px-6 py-4 border-b">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
              Abandoned Cart ({session.items?.length || 0} টি পণ্য)
            </p>
            <div className="space-y-2">
              {(session.items || []).map((item, idx) => (
                <a
                  key={idx}
                  href={`/product/${item.productId}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3 p-2.5 rounded-xl border hover:border-indigo-300 hover:bg-indigo-50/40 transition-colors group"
                >
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-11 h-11 rounded-lg object-cover border shrink-0"
                    />
                  ) : (
                    <div className="w-11 h-11 rounded-lg bg-gray-100 shrink-0 flex items-center justify-center text-gray-300 text-lg">
                      📦
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate group-hover:text-indigo-700">
                      {item.title || "—"}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      ৳{Number(item.price || 0).toLocaleString("en-BD")} ×{" "}
                      {item.quantity}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-gray-700 shrink-0">
                    ৳
                    {((item.price || 0) * (item.quantity || 1)).toLocaleString(
                      "en-BD",
                    )}
                  </p>
                </a>
              ))}
            </div>
            <div className="flex justify-between items-center mt-3 pt-3 border-t">
              <span className="text-sm text-gray-500">মোট Cart Value</span>
              <span className="font-bold text-gray-900">
                ৳{itemTotal.toLocaleString("en-BD")}
              </span>
            </div>
          </div>

          {/* Courier Score */}
          <div className="px-6 py-4 border-b">
            <CourierScorePanel
              lifetime={lifetime}
              phone={session.userPhone}
              loading={lifetimeLoading}
              onRefresh={refreshLifetime}
            />
          </div>

          {/* Previous orders */}
          <div className="px-6 py-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
              Previous Orders
              {!ordersLoading && (
                <span className="ml-2 text-gray-300 font-normal normal-case">
                  ({orders.length} টি পাওয়া গেছে)
                </span>
              )}
            </p>

            {ordersLoading ? (
              <p className="text-xs text-gray-400 py-3 text-center">
                লোড হচ্ছে…
              </p>
            ) : !session.userId && !session.userPhone && !session.userEmail ? (
              <p className="text-xs text-gray-400 py-3 text-center italic">
                Customer-এর contact info নেই — order history দেখা সম্ভব নয়
              </p>
            ) : orders.length === 0 ? (
              <p className="text-xs text-gray-400 py-3 text-center italic">
                এই customer-এর কোনো আগের order নেই
              </p>
            ) : (
              <div className="space-y-2">
                {orders.map((o) => (
                  <a
                    key={o._id}
                    href={`/dashboard/orders/${o._id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between gap-3 p-3 rounded-xl border hover:border-gray-300 hover:bg-gray-50 transition-colors group"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xs font-mono text-gray-500 shrink-0">
                        #{String(o._id).slice(-8).toUpperCase()}
                      </span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${
                          ORDER_STATUS_COLOR[o.status] ||
                          "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {ORDER_STATUS_LABEL[o.status] || o.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-sm font-semibold text-gray-800">
                        ৳{Number(o.total || 0).toLocaleString("en-BD")}
                      </span>
                      <span className="text-xs text-gray-400">
                        {o.createdAt
                          ? new Date(o.createdAt).toLocaleDateString("en-BD", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })
                          : ""}
                      </span>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function AbandonCheckoutSection() {
  const { user } = useUser();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState("");
  const [selectedSession, setSelectedSession] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const searchRef = useRef(null);
  const PAGE_SIZE = 20;

  const deleteSession = async (id) => {
    if (!confirm("এই record টি delete করবেন?")) return;
    setDeletingId(id);
    try {
      await fetch(`${API}/api/admin/abandoned-checkouts/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      setRows((prev) => prev.filter((s) => s._id !== id));
      setTotal((prev) => Math.max(0, prev - 1));
    } finally {
      setDeletingId(null);
    }
  };

  const load = useCallback(async (pg, query) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: pg, limit: PAGE_SIZE });
      if (query) params.set("q", query);
      const r = await fetch(`${API}/api/admin/abandoned-checkouts?${params}`, {
        credentials: "include",
      });
      const data = r.ok ? await r.json() : {};
      setRows(data.sessions || []);
      setTotal(data.total || 0);
      setTotalPages(data.pages || 1);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(1, "");
  }, [load]);

  useEffect(() => {
    clearTimeout(searchRef.current);
    searchRef.current = setTimeout(() => {
      setPage(1);
      load(1, q);
    }, 300);
    return () => clearTimeout(searchRef.current);
  }, [q, load]);

  const timeAgo = (date) => {
    const mins = Math.floor((Date.now() - new Date(date)) / 60000);
    if (mins < 60) return `${mins} মিনিট আগে`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} ঘন্টা আগে`;
    return `${Math.floor(hrs / 24)} দিন আগে`;
  };

  const goPage = (p) => {
    setPage(p);
    load(p, q);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            Abandoned Checkouts
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {total} জন customer checkout শুরু করে order দেননি
          </p>
        </div>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="নাম, ইমেইল বা ফোন দিয়ে খুঁজুন…"
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 w-64"
        />
      </div>

      {/* Info note */}
      <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-sm text-blue-800">
        <span className="text-base mt-0.5">✓</span>
        <span>
          Guest user-রাও এখানে track হয় — checkout page খোলার সাথে সাথে record
          তৈরি হয়, এবং নাম ও ফোন টাইপ করলে সেই তথ্য automatically আপডেট হয়।{" "}
          <strong>শেষ ৩০ দিনের সব incomplete sessions দেখানো হচ্ছে।</strong>{" "}
          <span className="text-orange-600 font-medium">🟡 Active</span> মানে
          customer এখনো checkout-এ থাকতে পারে। Customer-এর নামে click করলে full
          details, item-এ click করলে product page।
        </span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-gray-400">লোড হচ্ছে…</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b text-xs text-gray-500 uppercase tracking-wide">
              <tr>
                <th className="px-4 py-3 text-left">#</th>
                <th className="px-4 py-3 text-left">Customer</th>
                <th className="px-4 py-3 text-left">Contact</th>
                <th className="px-4 py-3 text-left">Items</th>
                <th className="px-4 py-3 text-right">Cart Value</th>
                <th className="px-4 py-3 text-left">কতক্ষণ আগে</th>
                <th className="px-4 py-3 text-left"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {rows.map((s, idx) => {
                const itemTotal = (s.items || []).reduce(
                  (sum, i) => sum + (i.price || 0) * (i.quantity || 1),
                  0,
                );
                return (
                  <tr key={s._id} className="hover:bg-gray-50/50">
                    {/* Row number */}
                    <td className="px-4 py-3 text-gray-400 text-xs">
                      {(page - 1) * PAGE_SIZE + idx + 1}
                    </td>

                    {/* Customer name — click to open modal */}
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setSelectedSession(s)}
                        className="font-medium text-indigo-600 hover:text-indigo-800 hover:underline text-left"
                      >
                        {s.userName || (
                          <span className="text-gray-400 italic font-normal">
                            Guest
                          </span>
                        )}
                      </button>
                    </td>

                    {/* Contact */}
                    <td className="px-4 py-3 text-gray-500 text-xs space-y-0.5">
                      {s.userPhone && <div>{s.userPhone}</div>}
                      {s.userEmail && (
                        <div className="text-gray-400">{s.userEmail}</div>
                      )}
                      {!s.userPhone && !s.userEmail && (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>

                    {/* Items — each item is a link to product page */}
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1.5">
                        {(s.items || []).map((item, i) => (
                          <a
                            key={i}
                            href={`/product/${item.productId}`}
                            target="_blank"
                            rel="noreferrer"
                            title={item.title}
                            className="inline-flex items-center gap-1 text-xs bg-gray-100 hover:bg-indigo-100 hover:text-indigo-700 text-gray-700 rounded-full px-2.5 py-1 transition-colors max-w-[140px]"
                          >
                            {item.image && (
                              <img
                                src={item.image}
                                alt=""
                                className="w-4 h-4 rounded-full object-cover shrink-0"
                              />
                            )}
                            <span className="truncate">
                              {item.title || "পণ্য"}
                            </span>
                            {item.quantity > 1 && (
                              <span className="text-gray-400 shrink-0">
                                ×{item.quantity}
                              </span>
                            )}
                          </a>
                        ))}
                      </div>
                    </td>

                    {/* Cart value */}
                    <td className="px-4 py-3 text-right font-semibold text-gray-800 whitespace-nowrap">
                      ৳{itemTotal.toLocaleString("en-BD")}
                    </td>

                    {/* Time ago */}
                    <td className="px-4 py-3 text-xs whitespace-nowrap">
                      {s.createdAt
                        ? (() => {
                            const mins = Math.floor(
                              (Date.now() - new Date(s.createdAt)) / 60000,
                            );
                            return mins < 5 ? (
                              <span className="inline-flex items-center gap-1 bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium">
                                <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                                Active
                              </span>
                            ) : (
                              <span className="text-gray-400">
                                {timeAgo(s.createdAt)}
                              </span>
                            );
                          })()
                        : "—"}
                    </td>

                    {/* Delete */}
                    <td className="px-4 py-3">
                      {user?.role === "admin" && (
                        <button
                          onClick={() => deleteSession(s._id)}
                          disabled={deletingId === s._id}
                          className="text-xs text-red-400 hover:text-red-600 hover:underline disabled:opacity-40"
                          title="Delete record"
                        >
                          {deletingId === s._id ? "…" : "Delete"}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {!rows.length && !loading && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-14 text-center text-gray-400"
                  >
                    কোনো abandoned checkout নেই
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1.5">
          <button
            onClick={() => goPage(1)}
            disabled={page === 1}
            className="px-2.5 py-1.5 text-xs rounded-lg border hover:bg-gray-50 disabled:opacity-40"
          >
            «
          </button>
          <button
            onClick={() => goPage(page - 1)}
            disabled={page === 1}
            className="px-3 py-1.5 text-sm rounded-lg border hover:bg-gray-50 disabled:opacity-40"
          >
            ← Prev
          </button>

          {/* Page numbers */}
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            const start = Math.max(1, Math.min(page - 2, totalPages - 4));
            const p = start + i;
            return (
              <button
                key={p}
                onClick={() => goPage(p)}
                className={`w-9 h-9 text-sm rounded-lg border transition-colors ${
                  p === page
                    ? "bg-indigo-600 text-white border-indigo-600 font-semibold"
                    : "hover:bg-gray-50"
                }`}
              >
                {p}
              </button>
            );
          })}

          <button
            onClick={() => goPage(page + 1)}
            disabled={page === totalPages}
            className="px-3 py-1.5 text-sm rounded-lg border hover:bg-gray-50 disabled:opacity-40"
          >
            Next →
          </button>
          <button
            onClick={() => goPage(totalPages)}
            disabled={page === totalPages}
            className="px-2.5 py-1.5 text-xs rounded-lg border hover:bg-gray-50 disabled:opacity-40"
          >
            »
          </button>

          <span className="text-xs text-gray-400 ml-2">
            Page {page} of {totalPages} · {total} sessions
          </span>
        </div>
      )}

      {/* Customer detail modal */}
      {selectedSession && (
        <CheckoutSessionModal
          session={selectedSession}
          onClose={() => setSelectedSession(null)}
        />
      )}
    </div>
  );
}

// ─── All Wishlists ────────────────────────────────────────────────────────────

function WishlistCustomerModal({ customer, productId, onClose }) {
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const customerId = customer.id || customer._id;
  const {
    lifetime,
    loading: lifetimeLoading,
    refresh: refreshLifetime,
  } = useCourierLifetime(customer.mobile);

  useEffect(() => {
    if (!customerId) return;
    setOrdersLoading(true);
    fetch(
      `${API}/api/admin/orders?${new URLSearchParams({ userId: String(customerId), limit: 10, page: 1 })}`,
      {
        credentials: "include",
      },
    )
      .then((r) => (r.ok ? r.json() : { orders: [] }))
      .then((data) => setOrders(data.orders || []))
      .catch(() => {})
      .finally(() => setOrdersLoading(false));
  }, [customerId]); // eslint-disable-line react-hooks/exhaustive-deps

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.45)" }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            <h3 className="text-lg font-bold text-gray-900">
              {customer.name || "—"}
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Wishlist customer profile
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 text-xl leading-none"
          >
            ×
          </button>
        </div>

        <div className="overflow-y-auto flex-1">
          {/* Contact */}
          <div className="px-6 py-4 border-b">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
              Contact Info
            </p>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-gray-400 mb-0.5">নাম</p>
                <p className="font-medium text-gray-800">
                  {customer.name || "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-0.5">ফোন</p>
                <p className="font-medium text-gray-800">
                  {customer.mobile || "—"}
                </p>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-gray-400 mb-0.5">ইমেইল</p>
                <p className="font-medium text-gray-800">
                  {customer.email || "—"}
                </p>
              </div>
            </div>
          </div>

          {/* Courier Score */}
          <div className="px-6 py-4 border-b">
            <CourierScorePanel
              lifetime={lifetime}
              phone={customer.mobile}
              loading={lifetimeLoading}
              onRefresh={refreshLifetime}
            />
          </div>

          {/* Previous orders */}
          <div className="px-6 py-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
              Previous Orders
              {!ordersLoading && (
                <span className="ml-2 text-gray-300 font-normal normal-case">
                  ({orders.length} টি পাওয়া গেছে)
                </span>
              )}
            </p>
            {ordersLoading ? (
              <p className="text-xs text-gray-400 py-3 text-center">
                লোড হচ্ছে…
              </p>
            ) : orders.length === 0 ? (
              <p className="text-xs text-gray-400 py-3 text-center italic">
                এই customer-এর কোনো আগের order নেই
              </p>
            ) : (
              <div className="space-y-2">
                {orders.map((o) => (
                  <a
                    key={o._id}
                    href={`/dashboard/orders/${o._id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between gap-3 p-3 rounded-xl border hover:border-gray-300 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xs font-mono text-gray-500 shrink-0">
                        #{String(o._id).slice(-8).toUpperCase()}
                      </span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${ORDER_STATUS_COLOR[o.status] || "bg-gray-100 text-gray-500"}`}
                      >
                        {ORDER_STATUS_LABEL[o.status] || o.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-sm font-semibold text-gray-800">
                        ৳{Number(o.total || 0).toLocaleString("en-BD")}
                      </span>
                      <span className="text-xs text-gray-400">
                        {o.createdAt
                          ? new Date(o.createdAt).toLocaleDateString("en-BD", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })
                          : ""}
                      </span>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function AllWishlistSection() {
  const { user } = useUser();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedCustomer, setSelectedCustomer] = useState(null); // { customer, productId }
  const [deletingProductId, setDeletingProductId] = useState(null);
  const [deletingCustomerKey, setDeletingCustomerKey] = useState(null);
  const PAGE_SIZE = 20;

  const load = useCallback(async (pg) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: pg, limit: PAGE_SIZE });
      const r = await fetch(`${API}/api/admin/wishlists?${params}`, {
        credentials: "include",
      });
      const data = r.ok ? await r.json() : {};
      setRows(data.items || []);
      setTotal(data.total || 0);
      setTotalPages(data.pages || 1);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(1);
  }, [load]);

  const deleteProduct = async (productId) => {
    if (!window.confirm("এই পণ্যটি সব customer-এর wishlist থেকে সরিয়ে দেবেন?"))
      return;
    setDeletingProductId(productId);
    try {
      await fetch(`${API}/api/admin/wishlists/${productId}`, {
        method: "DELETE",
        credentials: "include",
      });
      setRows((prev) => prev.filter((r) => r.productId !== productId));
      setTotal((t) => Math.max(0, t - 1));
    } finally {
      setDeletingProductId(null);
    }
  };

  const deleteCustomer = async (productId, userId) => {
    const key = `${productId}__${userId}`;
    setDeletingCustomerKey(key);
    try {
      await fetch(`${API}/api/admin/wishlists/${productId}/users/${userId}`, {
        method: "DELETE",
        credentials: "include",
      });
      setRows((prev) =>
        prev
          .map((r) => {
            if (r.productId !== productId) return r;
            const customers = r.customers.filter(
              (c) => String(c.id) !== String(userId),
            );
            return { ...r, customers, count: customers.length };
          })
          .filter((r) => r.count > 0),
      );
    } finally {
      setDeletingCustomerKey(null);
    }
  };

  const goPage = (p) => {
    setPage(p);
    load(p);
  };

  const pageNumbers = () => {
    if (totalPages <= 7)
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages = new Set([1, totalPages, page]);
    for (
      let i = Math.max(2, page - 1);
      i <= Math.min(totalPages - 1, page + 1);
      i++
    )
      pages.add(i);
    return [...pages]
      .sort((a, b) => a - b)
      .reduce((acc, n, i, arr) => {
        if (i > 0 && n - arr[i - 1] > 1) acc.push("…");
        acc.push(n);
        return acc;
      }, []);
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-gray-900">All Wishlists</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          {total} টি unique পণ্য customer-দের wishlist-এ আছে
        </p>
      </div>

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-gray-400">লোড হচ্ছে…</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b text-xs text-gray-500 uppercase">
              <tr>
                <th className="px-4 py-3 text-left w-8">#</th>
                <th className="px-4 py-3 text-left">Product</th>
                <th className="px-4 py-3 text-center">Count</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Customers</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {rows.map((item, idx) => (
                <React.Fragment key={item.productId}>
                  <tr className="hover:bg-gray-50/60">
                    <td className="px-4 py-3 text-xs text-gray-400">
                      {(page - 1) * PAGE_SIZE + idx + 1}
                    </td>
                    <td className="px-4 py-3">
                      <a
                        href={`/product/${item.productId}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-3 group"
                      >
                        {item.product?.images?.[0]?.url ? (
                          <img
                            src={item.product.images[0].url}
                            alt=""
                            className="w-10 h-10 rounded-lg object-cover border shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-gray-100 shrink-0 flex items-center justify-center text-gray-300 text-lg">
                            📦
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-gray-800 max-w-[200px] truncate group-hover:text-indigo-600 transition-colors">
                            {item.product?.title || item.productId}
                          </p>
                          {item.product?.price != null && (
                            <p className="text-xs text-gray-400">
                              ৳
                              {Number(item.product.price).toLocaleString(
                                "en-BD",
                              )}
                            </p>
                          )}
                        </div>
                      </a>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-rose-50 text-rose-600 font-bold text-sm">
                        {item.count}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {item.product ? (
                        <span
                          className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium capitalize ${
                            item.product.status === "published"
                              ? "bg-green-100 text-green-700"
                              : item.product.status === "draft"
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          {item.product.status || "—"}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">Not found</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1.5">
                        {item.customers.map((c) => {
                          const key = `${item.productId}__${String(c.id)}`;
                          return (
                            <div
                              key={String(c.id)}
                              className="inline-flex items-center gap-1.5 text-xs bg-white border rounded-full pl-3 pr-1.5 py-1"
                            >
                              <button
                                onClick={() =>
                                  setSelectedCustomer({
                                    customer: c,
                                    productId: item.productId,
                                  })
                                }
                                className="text-indigo-600 hover:underline font-medium"
                              >
                                {c.name || c.email || "Unknown"}
                              </button>
                              {user?.role === "admin" && (
                                <button
                                  onClick={() =>
                                    deleteCustomer(item.productId, String(c.id))
                                  }
                                  disabled={deletingCustomerKey === key}
                                  className="w-4 h-4 flex items-center justify-center rounded-full bg-gray-100 hover:bg-red-100 text-gray-400 hover:text-red-500 text-xs disabled:opacity-40 transition-colors leading-none"
                                  title="Remove from wishlist"
                                >
                                  {deletingCustomerKey === key ? "…" : "×"}
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {user?.role === "admin" && (
                        <button
                          onClick={() => deleteProduct(item.productId)}
                          disabled={deletingProductId === item.productId}
                          className="text-xs text-red-500 hover:text-red-700 hover:underline disabled:opacity-40"
                        >
                          {deletingProductId === item.productId
                            ? "…"
                            : "Delete"}
                        </button>
                      )}
                    </td>
                  </tr>
                </React.Fragment>
              ))}
              {!rows.length && !loading && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-12 text-center text-gray-400"
                  >
                    কোনো wishlist data নেই
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1.5 flex-wrap">
          <button
            onClick={() => goPage(1)}
            disabled={page === 1}
            className="px-2.5 py-1.5 text-sm rounded-lg border hover:bg-gray-50 disabled:opacity-40"
          >
            «
          </button>
          <button
            onClick={() => goPage(page - 1)}
            disabled={page === 1}
            className="px-3 py-1.5 text-sm rounded-lg border hover:bg-gray-50 disabled:opacity-40"
          >
            ‹ Prev
          </button>
          {pageNumbers().map((n, i) =>
            n === "…" ? (
              <span
                key={`ellipsis-${i}`}
                className="px-2 text-gray-400 text-sm"
              >
                …
              </span>
            ) : (
              <button
                key={n}
                onClick={() => goPage(n)}
                className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                  page === n
                    ? "bg-indigo-600 text-white border-indigo-600 font-semibold"
                    : "hover:bg-gray-50"
                }`}
              >
                {n}
              </button>
            ),
          )}
          <button
            onClick={() => goPage(page + 1)}
            disabled={page === totalPages}
            className="px-3 py-1.5 text-sm rounded-lg border hover:bg-gray-50 disabled:opacity-40"
          >
            Next ›
          </button>
          <button
            onClick={() => goPage(totalPages)}
            disabled={page === totalPages}
            className="px-2.5 py-1.5 text-sm rounded-lg border hover:bg-gray-50 disabled:opacity-40"
          >
            »
          </button>
        </div>
      )}

      {selectedCustomer && (
        <WishlistCustomerModal
          customer={selectedCustomer.customer}
          productId={selectedCustomer.productId}
          onClose={() => setSelectedCustomer(null)}
        />
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function OrdersList() {
  const { user, refreshUser } = useUser();
  const searchParams = useSearchParams();
  const activeSection = searchParams?.get("tab") || "all-orders";

  useEffect(() => {
    if (!user) refreshUser();
  }, [user, refreshUser]);

  return (
    <div className="max-w-7xl mx-auto space-y-4">
      {activeSection === "all-orders" && <AllOrdersSection />}

      {activeSection === "incomplete" && (
        <FilteredOrdersSection
          statusFilter="incomplete"
          title="Incomplete Orders"
          emptyMsg="No incomplete orders. All orders have been completed or cancelled."
          showAging
        />
      )}

      {activeSection === "cancelled" && (
        <FilteredOrdersSection
          statusFilter="cancelled"
          title="Cancelled Orders"
          emptyMsg="No cancelled orders found."
          showCancelReason
        />
      )}

      {activeSection === "returns" && <ReturnsRefundsSection />}

      {activeSection === "abandoned-cart" && <AbandonedCartSection />}

      {activeSection === "abandon-checkout" && <AbandonCheckoutSection />}

      {activeSection === "all-wishlist" && <AllWishlistSection />}

      {activeSection === "timeline" && <OrderTimelineSection />}

      {activeSection === "customer-notes" && <CustomerNotesSection />}
    </div>
  );
}
