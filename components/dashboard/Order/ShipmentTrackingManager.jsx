"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { formatOrderId } from "@/lib/orderId";
import BookWithCourierModal from "@/components/dashboard/Order/BookWithCourierModal";

const API = process.env.NEXT_PUBLIC_API_URL || "https://api.pickob.com";

const STATUS_STYLE = {
  pending: "bg-yellow-100 text-yellow-700",
  confirmed: "bg-blue-100 text-blue-700",
  processing: "bg-indigo-100 text-indigo-700",
  shipped: "bg-purple-100 text-purple-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-gray-100 text-gray-600",
  failed: "bg-red-100 text-red-600",
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

function OrderTrackingCard({
  order,
  couriers,
  expanded,
  onToggle,
  onSaved,
  highlighted,
}) {
  const [bookModalOpen, setBookModalOpen] = useState(false);
  const [form, setForm] = useState({
    courier: order.shipment?.courier || "",
    trackingId: order.shipment?.trackingId || "",
    trackingUrl: order.shipment?.trackingUrl || "",
  });
  const [saving, setSaving] = useState(false);

  const courierOptions = [
    { value: "", label: "Select courier" },
    ...couriers.map((c) => ({ value: c.slug, label: c.name })),
  ];
  const courierLabel = couriers.find(
    (c) => c.slug === order.shipment?.courier,
  )?.name;

  useEffect(() => {
    setForm({
      courier: order.shipment?.courier || "",
      trackingId: order.shipment?.trackingId || "",
      trackingUrl: order.shipment?.trackingUrl || "",
    });
  }, [order._id, order.shipment]);

  const saveShipment = async () => {
    if (!form.trackingUrl?.trim()) {
      alert("Paste the live tracking link from the courier SMS or app.");
      return;
    }
    if (!form.courier) {
      alert("Please select a courier.");
      return;
    }
    setSaving(true);
    try {
      const r = await fetch(`${API}/api/admin/orders/${order._id}/shipment`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courier: form.courier,
          trackingId: form.trackingId?.trim() || null,
          trackingUrl: form.trackingUrl.trim(),
          markHandedOver: true,
        }),
      });
      const updated = await r.json();
      if (r.ok) onSaved(updated);
      else alert(updated.error || "Could not save shipment.");
    } finally {
      setSaving(false);
    }
  };

  const events = order.shipment?.trackingEvents || [];
  const hasTracking = Boolean(order.shipment?.trackingUrl);
  const latestEvent = events[events.length - 1];

  return (
    <article
      className={`bg-white rounded-xl border shadow-sm overflow-hidden transition ${
        highlighted ? "border-rose-400 ring-2 ring-rose-100" : "border-gray-200"
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center gap-4 px-4 py-3.5 hover:bg-gray-50 text-left transition"
      >
        <span
          className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition ${expanded ? "bg-rose-100 text-rose-600" : "bg-gray-100 text-gray-500"}`}
        >
          <svg
            className={`w-4 h-4 transition-transform ${expanded ? "rotate-90" : ""}`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M9 5l7 7-7 7" />
          </svg>
        </span>
        <div className="flex-1 min-w-0 grid sm:grid-cols-4 gap-2 items-center">
          <div>
            <p className="font-mono text-sm font-bold text-gray-900">
              {formatOrderId(order._id)}
            </p>
            <p className="text-xs text-gray-500 truncate">
              {order.billingDetails?.name}
            </p>
          </div>
          <p className="text-xs text-gray-500 hidden sm:block">
            {fmt(order.createdAt)}
          </p>
          <p className="text-sm text-gray-700 hidden sm:block">
            {courierLabel || order.shipment?.courier || "No courier"}
            {hasTracking && (
              <span className="text-green-600 ml-1">· tracked</span>
            )}
          </p>
          <div className="flex items-center gap-2 sm:justify-end">
            <span
              className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${STATUS_STYLE[order.status] || "bg-gray-100 text-gray-600"}`}
            >
              {order.status}
            </span>
          </div>
        </div>
        {!expanded && latestEvent && (
          <p className="text-xs text-gray-400 truncate max-w-[10rem] hidden md:block">
            {latestEvent.message}
          </p>
        )}
      </button>

      {expanded && (
        <div className="px-4 pb-4 pt-0 border-t border-gray-100 space-y-4 bg-linear-to-b from-rose-50/30 to-white">
          <div className="flex flex-wrap gap-2 pt-4">
            <Link
              href={`/dashboard/orders/${order._id}`}
              className="text-xs font-medium text-rose-600 hover:underline"
            >
              Full order details →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Courier
              </label>
              <select
                value={form.courier}
                onChange={(e) =>
                  setForm((p) => ({ ...p, courier: e.target.value }))
                }
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 bg-white"
              >
                {courierOptions.map((opt) => (
                  <option key={opt.value || "empty"} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Tracking ID
              </label>
              <input
                value={form.trackingId}
                onChange={(e) =>
                  setForm((p) => ({ ...p, trackingId: e.target.value }))
                }
                placeholder="Consignment ID (optional)"
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Live tracking URL
            </label>
            <input
              value={form.trackingUrl}
              onChange={(e) =>
                setForm((p) => ({ ...p, trackingUrl: e.target.value }))
              }
              placeholder="Paste link from courier SMS / app"
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5"
            />
            <p className="text-[11px] text-gray-400 mt-1">
              Save করলে customer's /track-order/ ও My Orders page-এ এই link auto
              update হবে।
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setBookModalOpen(true)}
              className="px-4 py-2 text-sm font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
            >
              Book Courier
            </button>
            <button
              type="button"
              onClick={saveShipment}
              disabled={saving}
              className="px-4 py-2 text-sm font-semibold rounded-lg bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save & sync tracking"}
            </button>
            {form.trackingUrl && (
              <a
                href={form.trackingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50"
              >
                Open tracking ↗
              </a>
            )}
          </div>

          {events.length > 0 && (
            <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Tracking updates (auto from courier)
              </p>
              <ul className="text-xs space-y-1.5 max-h-36 overflow-y-auto">
                {[...events].reverse().map((ev, i) => (
                  <li
                    key={`${ev.at}-${i}`}
                    className="text-gray-700 flex gap-2"
                  >
                    <span className="text-gray-400 shrink-0 whitespace-nowrap">
                      {ev.at ? fmt(ev.at) : "—"}
                    </span>
                    <span>{ev.message}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <BookWithCourierModal
        order={order}
        open={bookModalOpen}
        onClose={() => setBookModalOpen(false)}
        onBooked={(updated) => {
          onSaved(updated);
          setBookModalOpen(false);
        }}
      />
    </article>
  );
}

export default function ShipmentTrackingManager() {
  const searchParams = useSearchParams();
  const highlightOrderId = searchParams?.get("order") || null;
  const [orders, setOrders] = useState([]);
  const [couriers, setCouriers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(highlightOrderId);
  const [filter, setFilter] = useState("all");

  const loadMeta = useCallback(async () => {
    const courierRes = await fetch(`${API}/api/admin/couriers`, {
      credentials: "include",
    });
    const courierData = courierRes.ok ? await courierRes.json() : { items: [] };
    setCouriers(courierData.items || []);
  }, []);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "100", page: "1" });
      if (filter === "needs") params.set("needsTracking", "1");
      else if (filter !== "all") params.set("status", filter);
      const r = await fetch(`${API}/api/admin/orders?${params}`, {
        credentials: "include",
      });
      const data = await r.json();
      setOrders(r.ok ? data.orders || [] : []);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    loadMeta();
    loadOrders();
  }, [loadMeta, loadOrders]);

  useEffect(() => {
    if (highlightOrderId) setExpandedId(highlightOrderId);
  }, [highlightOrderId]);

  const handleSaved = (updated) => {
    setOrders((list) => list.map((o) => (o._id === updated._id ? updated : o)));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Order Tracking</h1>
          <p className="text-sm text-gray-500 mt-1">
            সব order collapsed — expand করে courier name ও live tracking URL
            save করুন।
          </p>
        </div>
        <Link
          href="/dashboard/shipment-tracking/settings"
          className="px-3 py-2 text-sm font-medium rounded-lg border border-gray-200 hover:bg-gray-50"
        >
          Courier settings
        </Link>
      </div>

      <div className="flex flex-wrap gap-2">
        {[
          { key: "all", label: "All orders" },
          { key: "needs", label: "Needs tracking" },
          { key: "confirmed", label: "Confirmed" },
          { key: "processing", label: "Processing" },
          { key: "shipped", label: "Shipped" },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setFilter(tab.key)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
              filter === tab.key
                ? "bg-rose-500 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
        <button
          type="button"
          onClick={loadOrders}
          className="text-xs text-rose-600 hover:text-rose-700 font-medium ml-auto"
        >
          Refresh
        </button>
      </div>

      {loading ? (
        <p className="text-center text-gray-400 py-16">Loading orders…</p>
      ) : orders.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 bg-white p-12 text-center">
          <p className="text-gray-600">No orders in this view.</p>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-sm text-gray-500">
            {orders.length} order{orders.length !== 1 ? "s" : ""}
          </p>
          {orders.map((order) => (
            <OrderTrackingCard
              key={order._id}
              order={order}
              couriers={couriers}
              expanded={expandedId === order._id}
              highlighted={highlightOrderId === order._id}
              onToggle={() =>
                setExpandedId((id) => (id === order._id ? null : order._id))
              }
              onSaved={handleSaved}
            />
          ))}
        </div>
      )}
    </div>
  );
}
