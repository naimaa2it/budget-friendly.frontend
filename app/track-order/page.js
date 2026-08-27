"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import OrderTrackingTimeline from "@/components/order/OrderTrackingTimeline";
import { formatOrderId } from "@/lib/orderId";

const API = process.env.NEXT_PUBLIC_API_URL || "https://api.pickob.com";

const STATUS_LABELS = {
  pending: "Pending",
  confirmed: "Confirmed",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
  rejected: "Rejected",
  failed: "Failed",
};

const STATUS_COLORS = {
  pending: "bg-yellow-50 text-yellow-700",
  confirmed: "bg-blue-50 text-blue-700",
  processing: "bg-blue-50 text-blue-700",
  shipped: "bg-indigo-50 text-indigo-700",
  delivered: "bg-green-50 text-green-700",
  cancelled: "bg-gray-100 text-gray-500",
  rejected: "bg-red-50 text-red-600",
  failed: "bg-red-50 text-red-600",
};

function NotFoundHelp({ byPhone }) {
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-4 space-y-3">
      <div className="flex gap-3">
        <span className="text-xl shrink-0" aria-hidden="true">
          🔍
        </span>
        <div>
          <p className="text-sm font-semibold text-amber-900">
            অর্ডার খুঁজে পাওয়া যায়নি
          </p>
          <p className="text-sm text-amber-800/90 mt-1 leading-relaxed">
            {byPhone
              ? "এই phone number-এ কোনো অর্ডার নেই। নম্বরটি আবার চেক করুন।"
              : "Order ID আবার চেক করুন। Confirmation email বা My Orders page থেকে নিন।"}
          </p>
        </div>
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

function OrderCard({ order, courierLabels, onSelect, selected }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(order)}
      className={`w-full text-left rounded-xl border p-4 transition ${
        selected
          ? "border-rose-400 bg-rose-50/60 shadow-sm"
          : "border-gray-200 bg-white hover:border-rose-200 hover:bg-rose-50/30"
      }`}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="font-mono text-sm font-semibold text-gray-800">
          {formatOrderId(order._id)}
        </span>
        <span
          className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
            STATUS_COLORS[order.status] || "bg-gray-100 text-gray-500"
          }`}
        >
          {STATUS_LABELS[order.status] || order.status}
        </span>
      </div>
      <p className="text-sm text-gray-600">
        {order.billingDetails?.name} · ৳{order.total?.toLocaleString()}
      </p>
      {order.shipment?.trackingId && (
        <p className="text-xs text-gray-400 mt-1">
          Tracking: {order.shipment.trackingId}
        </p>
      )}
      <p className="text-xs text-gray-400 mt-0.5">
        {new Date(order.createdAt).toLocaleDateString("bn-BD")}
      </p>
    </button>
  );
}

// Decide whether the entered value is a phone number or an order ID.
// Phone: only digits/space/+/- and at least 10 digits. Everything else
// (e.g. "518640AC") is treated as an order ID.
function looksLikePhone(value) {
  if (/[a-zA-Z]/.test(value)) return false;
  const digits = value.replace(/\D/g, "");
  return /^[0-9+\-\s]+$/.test(value) && digits.length >= 10;
}

export default function TrackOrderPage() {
  const [query, setQuery] = useState("");
  const [order, setOrder] = useState(null);
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [courierLabels, setCourierLabels] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notFound, setNotFound] = useState(null); // null | "orderId" | "phone"

  const timelineRef = useRef(null);

  const handleTrack = async (e) => {
    e.preventDefault();
    setError("");
    setNotFound(null);
    setOrder(null);
    setOrders([]);
    setSelectedOrder(null);

    const val = query.trim();
    if (!val) {
      setError("Please enter your Order ID or phone number.");
      return;
    }

    const byPhone = looksLikePhone(val);

    setLoading(true);
    try {
      const params = new URLSearchParams(
        byPhone ? { phone: val } : { orderId: val },
      );
      const r = await fetch(`${API}/api/orders/track?${params}`);
      const data = await r.json();
      if (r.ok) {
        if (byPhone) {
          setOrders(data.orders || []);
        } else {
          setOrder(data.order);
        }
        setCourierLabels(data.courierLabels || {});
      } else if (r.status === 404) {
        setNotFound(byPhone ? "phone" : "orderId");
      } else {
        setError(data.error || "Something went wrong. Please try again.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const phoneOrders = orders;

  return (
    <div className="min-h-screen bg-[#fffaf6] py-10 px-4">
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Track Your Order</h1>
          <p className="text-sm text-gray-500 mt-2">
            Order ID বা Phone Number দিয়ে আপনার অর্ডার ট্র্যাক করুন।
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
          <form onSubmit={handleTrack} className="space-y-4">
            <div>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by order id or phone number"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
              />
              <p className="text-xs text-gray-400 mt-1.5">
                Order ID (e.g. 518640AC) অথবা phone number (e.g. 01712345678)
                দিন
              </p>
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                {error}
              </p>
            )}
            {notFound && <NotFoundHelp byPhone={notFound === "phone"} />}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-rose-600 text-white font-semibold text-sm hover:bg-rose-700 disabled:opacity-60 transition"
            >
              {loading ? "Searching…" : "Track Order"}
            </button>
          </form>
        </div>

        {/* Single order result (Order ID mode) */}
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
                <span
                  className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                    STATUS_COLORS[order.status] || "bg-gray-100 text-gray-500"
                  }`}
                >
                  {STATUS_LABELS[order.status] || order.status}
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

        {/* Phone lookup results */}
        {phoneOrders.length > 0 && (
          <div className="mt-6 space-y-3">
            <p className="text-sm font-medium text-gray-600">
              {phoneOrders.length}টি অর্ডার পাওয়া গেছে — বিস্তারিত দেখতে select
              করুন
            </p>
            <div className="space-y-2">
              {phoneOrders.map((o) => (
                <OrderCard
                  key={o._id}
                  order={o}
                  courierLabels={courierLabels}
                  onSelect={(o) => {
                    setSelectedOrder(o);
                    setTimeout(() => {
                      timelineRef.current?.scrollIntoView({
                        behavior: "smooth",
                        block: "start",
                      });
                    }, 50);
                  }}
                  selected={selectedOrder?._id === o._id}
                />
              ))}
            </div>
            {selectedOrder && (
              <div ref={timelineRef} className="mt-4 scroll-mt-6">
                <OrderTrackingTimeline
                  order={selectedOrder}
                  courierLabels={courierLabels}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
