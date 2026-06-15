"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { formatOrderId } from "@/lib/orderId";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const PICKED_STATUSES = ["accepted", "picked", "approved"];

const STATUS_STYLE = {
  pending: "bg-yellow-100 text-yellow-800",
  accepted: "bg-emerald-100 text-emerald-800",
  picked: "bg-orange-100 text-orange-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-700",
  confirmed: "bg-blue-100 text-blue-700",
};

function fmt(date) {
  return new Date(date).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

const PAGE_SIZE = 25;

export default function OrderPickManager() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [picking, setPicking] = useState(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const debounceRef = useRef(null);

  const loadOrders = useCallback(async (pg, q) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: pg, limit: PAGE_SIZE, status: "all" });
      if (q) params.set("q", q);
      const r = await fetch(`${API}/api/admin/orders?${params}`, { credentials: "include" });
      const data = r.ok ? await r.json() : { orders: [], pages: 1, total: 0 };
      setOrders(data.orders || []);
      setTotalPages(data.pages || 1);
      setTotal(data.total || 0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrders(page, search);
  }, [page, loadOrders]); // eslint-disable-line react-hooks/exhaustive-deps

  // Debounced search — resets to page 1
  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(1);
      loadOrders(1, search);
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [search, loadOrders]);

  const togglePick = async (order, pick) => {
    setPicking(order._id);
    try {
      const r = await fetch(`${API}/api/admin/orders/${order._id}/pick`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pick }),
      });
      const data = await r.json();
      if (r.ok) {
        setOrders((prev) => prev.map((o) => (o._id === order._id ? data : o)));
      } else {
        alert(data.error || "Could not update pick status.");
      }
    } finally {
      setPicking(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">All New Orders</h1>
          <p className="text-sm text-gray-500 mt-1">
            Turn on Pick to accept an order and view its details. The person who picks is auto-assigned.
          </p>
        </div>
        <Link href="/dashboard/orders" className="text-sm text-rose-600 hover:underline">
          ← All Orders
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search order, customer, phone…"
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 w-full sm:w-64"
        />
        <span className="text-xs text-gray-400">{total} order{total !== 1 ? "s" : ""}</span>
      </div>

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-gray-400">Loading orders…</div>
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b text-xs text-gray-500 uppercase">
              <tr>
                <th className="px-4 py-3 text-left w-10">
                  <input type="checkbox" disabled className="rounded opacity-40" />
                </th>
                <th className="px-4 py-3 text-left">Order #</th>
                <th className="px-4 py-3 text-left">Customer</th>
                <th className="px-4 py-3 text-left">Total Amount</th>
                <th className="px-4 py-3 text-left">Date &amp; Time</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Pickup</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {orders.map((order) => {
                const isPicked =
                  PICKED_STATUSES.includes(order.status) || Boolean(order.pickedBy?.name);
                return (
                  <tr
                    key={order._id}
                    className={`hover:bg-gray-50/60 ${isPicked ? "cursor-pointer" : ""}`}
                    onClick={() => {
                      if (isPicked) {
                        window.location.href = `/dashboard/orders/${order._id}`;
                      }
                    }}
                  >
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <input type="checkbox" className="rounded" disabled />
                    </td>
                    <td className="px-4 py-3 font-mono text-gray-700">
                      {isPicked ? (
                        <Link
                          href={`/dashboard/orders/${order._id}`}
                          className="text-rose-600 hover:underline font-semibold"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {formatOrderId(order._id)}
                        </Link>
                      ) : (
                        <span className="text-gray-500">{formatOrderId(order._id)}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-800">
                      {order.billingDetails?.name || "—"}
                    </td>
                    <td className="px-4 py-3 font-medium">
                      ৳ {Number(order.total || 0).toLocaleString("en-BD", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                      {fmt(order.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block text-xs font-medium px-2.5 py-1 rounded-full capitalize ${STATUS_STYLE[order.status] || "bg-gray-100 text-gray-600"}`}
                      >
                        {order.status}
                      </span>
                      {order.pickedBy?.name && (
                        <p className="text-[10px] text-gray-400 mt-1">
                          Picked by {order.pickedBy.name}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <label className="inline-flex items-center gap-2 cursor-pointer">
                        <span className="text-xs text-gray-600">Pick</span>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={isPicked}
                          disabled={picking === order._id}
                          onClick={() => togglePick(order, !isPicked)}
                          className={`relative w-10 h-5 rounded-full transition-colors ${
                            isPicked ? "bg-rose-500" : "bg-gray-300"
                          } disabled:opacity-50`}
                        >
                          <span
                            className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                              isPicked ? "translate-x-5" : ""
                            }`}
                          />
                        </button>
                      </label>
                    </td>
                  </tr>
                );
              })}
              {!orders.length && !loading && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                    No orders found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
            className="px-3 py-1.5 text-sm rounded-lg border hover:bg-gray-50 disabled:opacity-40">← Prev</button>
          <span className="text-sm text-gray-600">Page {page} of {totalPages}</span>
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
            className="px-3 py-1.5 text-sm rounded-lg border hover:bg-gray-50 disabled:opacity-40">Next →</button>
        </div>
      )}
    </div>
  );
}
