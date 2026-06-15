"use client";

import React, { useState } from "react";
import Link from "next/link";
import OrderTrackingTimeline from "@/components/order/OrderTrackingTimeline";
import { formatOrderId } from "@/lib/orderId";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

function OrderNotFoundHelp() {
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-4 space-y-3">
      <div className="flex gap-3">
        <span className="text-xl shrink-0" aria-hidden="true">🔍</span>
        <div>
          <p className="text-sm font-semibold text-amber-900">
            We couldn&apos;t find a matching order
          </p>
          <p className="text-sm text-amber-800/90 mt-1 leading-relaxed">
            Please double-check your Order ID and try again.
          </p>
        </div>
      </div>
      <div className="rounded-lg bg-white/80 border border-amber-100 px-3 py-3 space-y-2 text-sm text-gray-700">
        <p className="font-medium text-gray-800">Tips</p>
        <ul className="space-y-1.5 list-disc list-inside">
          <li>Order ID confirmation email-এ পাবেন</li>
          <li>My Orders page-এ short Order ID দেখা যাবে</li>
        </ul>
      </div>
      <Link
        href="/user/orders"
        className="inline-flex items-center justify-center w-full py-2.5 rounded-lg border border-rose-200 bg-white text-sm font-semibold text-rose-700 hover:bg-rose-50 transition"
      >
        Go to My Orders
      </Link>
    </div>
  );
}

export default function TrackOrderPage() {
  const [mode, setMode] = useState("orderId");

  // Order ID state
  const [orderId, setOrderId] = useState("");
  const [order, setOrder] = useState(null);
  const [courierLabels, setCourierLabels] = useState({});
  const [orderLoading, setOrderLoading] = useState(false);
  const [orderError, setOrderError] = useState("");
  const [notFound, setNotFound] = useState(false);

  // Tracking URL state
  const [trackingUrl, setTrackingUrl] = useState("");
  const [trackingUrlError, setTrackingUrlError] = useState("");

  const switchMode = (m) => {
    setMode(m);
    setOrderError("");
    setTrackingUrlError("");
    setNotFound(false);
    setOrder(null);
  };

  const handleTrackOrder = async (e) => {
    e.preventDefault();
    setOrderError("");
    setNotFound(false);
    setOrder(null);

    const value = orderId.trim();
    if (!value) {
      setOrderError("Please enter your Order ID.");
      return;
    }

    setOrderLoading(true);
    try {
      const params = new URLSearchParams({ orderId: value });
      const r = await fetch(`${API}/api/orders/track?${params}`);
      const data = await r.json();
      if (r.ok) {
        setOrder(data.order);
        setCourierLabels(data.courierLabels || {});
      } else if (r.status === 404) {
        setNotFound(true);
      } else {
        setOrderError(data.error || "Something went wrong. Please try again.");
      }
    } catch {
      setOrderError("Something went wrong. Please try again.");
    } finally {
      setOrderLoading(false);
    }
  };

  const handleTrackUrl = (e) => {
    e.preventDefault();
    const value = trackingUrl.trim();
    if (!value) {
      setTrackingUrlError("Please enter a tracking URL.");
      return;
    }
    try {
      const url = new URL(value);
      if (!["http:", "https:"].includes(url.protocol)) throw new Error();
    } catch {
      setTrackingUrlError("Please enter a valid URL starting with http:// or https://");
      return;
    }
    setTrackingUrlError("");
    window.open(value, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="min-h-screen bg-[#fffaf6] py-10 px-4">
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Track Your Order</h1>
          <p className="text-sm text-gray-500 mt-2">
            Order ID বা courier tracking URL দিয়ে track করুন।
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
          {/* Mode tabs */}
          <div className="flex rounded-lg border border-gray-200 p-1 gap-1 bg-gray-50">
            {[
              { key: "orderId", label: "Order ID" },
              { key: "trackingUrl", label: "Tracking URL" },
            ].map((m) => (
              <button
                key={m.key}
                type="button"
                onClick={() => switchMode(m.key)}
                className={`flex-1 px-2 py-2 text-xs font-medium rounded-md transition ${
                  mode === m.key
                    ? "bg-white text-rose-700 shadow-sm border border-gray-200"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          {/* Order ID form */}
          {mode === "orderId" && (
            <form onSubmit={handleTrackOrder} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Order ID
                </label>
                <input
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                  placeholder="e.g. 518640AC"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
                />
                <p className="text-xs text-gray-400 mt-1.5">
                  Confirmation email বা My Orders page থেকে নিন
                </p>
              </div>

              {orderError && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                  {orderError}
                </p>
              )}
              {notFound && <OrderNotFoundHelp />}

              <button
                type="submit"
                disabled={orderLoading}
                className="w-full py-3 rounded-xl bg-rose-600 text-white font-semibold text-sm hover:bg-rose-700 disabled:opacity-60 transition"
              >
                {orderLoading ? "Looking up order…" : "Track Order"}
              </button>
            </form>
          )}

          {/* Tracking URL form */}
          {mode === "trackingUrl" && (
            <form onSubmit={handleTrackUrl} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tracking URL
                </label>
                <input
                  value={trackingUrl}
                  onChange={(e) => setTrackingUrl(e.target.value)}
                  placeholder="https://steadfast.com.bd/t/..."
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
                />
                <p className="text-xs text-gray-400 mt-1.5">
                  Courier SMS বা email থেকে full tracking link paste করুন
                </p>
              </div>

              {trackingUrlError && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                  {trackingUrlError}
                </p>
              )}

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-rose-600 text-white font-semibold text-sm hover:bg-rose-700 transition"
              >
                Open Tracking Page
              </button>
            </form>
          )}
        </div>

        {order && (
          <div className="mt-6 space-y-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400 uppercase">Order</p>
                  <p className="font-mono text-sm font-semibold text-gray-800">
                    {formatOrderId(order._id)}
                  </p>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 capitalize">
                  {order.status}
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                {order.billingDetails?.name} · ৳{order.total?.toLocaleString()}
              </p>
              {order.shipment?.trackingId && (
                <p className="text-xs text-gray-500 mt-1">
                  Tracking ID: {order.shipment.trackingId}
                </p>
              )}
            </div>
            <OrderTrackingTimeline
              order={order}
              courierLabels={courierLabels}
            />
          </div>
        )}
      </div>
    </div>
  );
}
