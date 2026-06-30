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
          #{formatOrderId(order._id)}
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

export default function TrackOrderPage() {
  const [mode, setMode] = useState("orderId");

  // Order ID mode
  const [orderId, setOrderId] = useState("");
  const [order, setOrder] = useState(null);
  const [courierLabels, setCourierLabels] = useState({});
  const [orderLoading, setOrderLoading] = useState(false);
  const [orderError, setOrderError] = useState("");
  const [orderNotFound, setOrderNotFound] = useState(false);

  // Phone mode
  const [phone, setPhone] = useState("");
  const [phoneOrders, setPhoneOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [phoneLoading, setPhoneLoading] = useState(false);
  const [phoneError, setPhoneError] = useState("");
  const [phoneNotFound, setPhoneNotFound] = useState(false);

  const timelineRef = useRef(null);

  const switchMode = (m) => {
    setMode(m);
    setOrderError("");
    setPhoneError("");
    setOrderNotFound(false);
    setPhoneNotFound(false);
    setOrder(null);
    setPhoneOrders([]);
    setSelectedOrder(null);
  };

  const handleTrackByOrderId = async (e) => {
    e.preventDefault();
    setOrderError("");
    setOrderNotFound(false);
    setOrder(null);

    const val = orderId.trim();
    if (!val) {
      setOrderError("Please enter your Order ID.");
      return;
    }

    setOrderLoading(true);
    try {
      const params = new URLSearchParams({ orderId: val });
      const r = await fetch(`${API}/api/orders/track?${params}`);
      const data = await r.json();
      if (r.ok) {
        setOrder(data.order);
        setCourierLabels(data.courierLabels || {});
      } else if (r.status === 404) {
        setOrderNotFound(true);
      } else {
        setOrderError(data.error || "Something went wrong. Please try again.");
      }
    } catch {
      setOrderError("Something went wrong. Please try again.");
    } finally {
      setOrderLoading(false);
    }
  };

  const handleTrackByPhone = async (e) => {
    e.preventDefault();
    setPhoneError("");
    setPhoneNotFound(false);
    setPhoneOrders([]);
    setSelectedOrder(null);

    const val = phone.trim();
    if (!val) {
      setPhoneError("Please enter your phone number.");
      return;
    }

    setPhoneLoading(true);
    try {
      const params = new URLSearchParams({ phone: val });
      const r = await fetch(`${API}/api/orders/track?${params}`);
      const data = await r.json();
      if (r.ok) {
        setPhoneOrders(data.orders || []);
        setCourierLabels(data.courierLabels || {});
      } else if (r.status === 404) {
        setPhoneNotFound(true);
      } else {
        setPhoneError(data.error || "Something went wrong. Please try again.");
      }
    } catch {
      setPhoneError("Something went wrong. Please try again.");
    } finally {
      setPhoneLoading(false);
    }
  };

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
          {/* Mode tabs */}
          <div className="flex rounded-lg border border-gray-200 p-1 gap-1 bg-gray-50">
            {[
              { key: "orderId", label: "Order ID" },
              { key: "phone", label: "Phone Number" },
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
            <form onSubmit={handleTrackByOrderId} className="space-y-4">
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
              {orderNotFound && <NotFoundHelp byPhone={false} />}

              <button
                type="submit"
                disabled={orderLoading}
                className="w-full py-3 rounded-xl bg-rose-600 text-white font-semibold text-sm hover:bg-rose-700 disabled:opacity-60 transition"
              >
                {orderLoading ? "Looking up order…" : "Track Order"}
              </button>
            </form>
          )}

          {/* Phone form */}
          {mode === "phone" && (
            <form onSubmit={handleTrackByPhone} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 01712345678"
                  type="tel"
                  inputMode="numeric"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
                />
                <p className="text-xs text-gray-400 mt-1.5">
                  অর্ডারে যে phone number দিয়েছিলেন সেটি দিন
                </p>
              </div>

              {phoneError && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                  {phoneError}
                </p>
              )}
              {phoneNotFound && <NotFoundHelp byPhone={true} />}

              <button
                type="submit"
                disabled={phoneLoading}
                className="w-full py-3 rounded-xl bg-rose-600 text-white font-semibold text-sm hover:bg-rose-700 disabled:opacity-60 transition"
              >
                {phoneLoading ? "Searching…" : "Find Orders"}
              </button>
            </form>
          )}
        </div>

        {/* Single order result (Order ID mode) */}
        {order && (
          <div className="mt-6 space-y-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400 uppercase">Order</p>
                  <p className="font-mono text-sm font-semibold text-gray-800">
                    #{formatOrderId(order._id)}
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

        {/* Phone mode results */}
        {mode === "phone" && phoneOrders.length > 0 && (
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
