"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { formatOrderId } from "@/lib/orderId";

const API = process.env.NEXT_PUBLIC_API_URL || "https://api.pickob.com";

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
  cancelled: "bg-gray-100 text-gray-600",
  failed: "bg-red-100 text-red-600",
};

const PAYMENT_STATUS_STYLE = {
  unpaid: "bg-yellow-50 text-yellow-600",
  cod: "bg-orange-50 text-orange-600",
  paid: "bg-green-50 text-green-700",
  failed: "bg-red-50 text-red-600",
  cancelled: "bg-gray-50 text-gray-500",
  pending_verification: "bg-amber-50 text-amber-600",
};

function fmtDate(date) {
  return new Date(date).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function PreordersList() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const fetchPreorders = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/orders/admin/preorders`, {
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok) setRows(data.rows || []);
      else alert(data.error || "Failed to load pre-orders");
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPreorders();
  }, []);

  const filtered = rows.filter((r) => {
    if (statusFilter && r.status !== statusFilter) return false;
    if (filter) {
      const q = filter.toLowerCase();
      if (
        !r.productTitle?.toLowerCase().includes(q) &&
        !r.customerName?.toLowerCase().includes(q) &&
        !r.customerPhone?.toLowerCase().includes(q) &&
        !r.customerEmail?.toLowerCase().includes(q)
      )
        return false;
    }
    return true;
  });

  const statuses = Array.from(new Set(rows.map((r) => r.status))).filter(
    Boolean,
  );

  return (
    <div className="max-w-6xl mx-auto bg-white p-6 rounded shadow">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">
            Pre-orders Management
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {rows.length} total pre-order item{rows.length !== 1 ? "s" : ""}
          </p>
        </div>
        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Search by product, customer, phone, or email…"
          className="border px-3 py-2 rounded w-full sm:w-80 text-sm"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-6">
        <button
          onClick={() => setStatusFilter("")}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${statusFilter === "" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
        >
          All statuses
        </button>
        {statuses.map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize transition ${statusFilter === s ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
          >
            {s}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400">
          Loading pre-orders…
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          {filter || statusFilter
            ? "No pre-orders match your filters."
            : "No pre-orders yet."}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((row) => (
            <div
              key={`${row.orderId}-${row.itemIndex}`}
              className="border rounded-lg p-4 flex flex-wrap items-center gap-4"
            >
              <div className="relative w-14 h-14 rounded-lg overflow-hidden border border-gray-200 bg-gray-50 shrink-0">
                {row.image ? (
                  <Image
                    src={row.image}
                    alt={row.productTitle || "Product"}
                    fill
                    className="object-contain"
                  />
                ) : null}
              </div>

              <div className="flex-1 min-w-[180px]">
                <Link
                  href={`/product/${row.productId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-semibold text-blue-700 hover:underline"
                >
                  {row.productTitle || "Unknown Product"}
                </Link>
                <div className="text-xs text-gray-500 mt-0.5">
                  Qty: {row.quantity} &middot; ৳{row.price}
                  {row.color ? ` · ${row.color}` : ""}
                  {row.size ? ` · ${row.size}` : ""}
                </div>
              </div>

              <div className="min-w-[150px]">
                <div className="text-sm font-medium text-gray-700">
                  {row.customerName || "Unknown"}
                </div>
                <div className="text-xs text-gray-500">
                  {row.customerPhone || row.customerEmail || "—"}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`text-xs font-medium px-2 py-1 rounded-full capitalize ${STATUS_STYLE[row.status] || "bg-gray-100 text-gray-600"}`}
                >
                  {row.status}
                </span>
                <span
                  className={`text-xs font-medium px-2 py-1 rounded-full capitalize ${PAYMENT_STATUS_STYLE[row.paymentStatus] || "bg-gray-100 text-gray-600"}`}
                >
                  {row.paymentStatus}
                </span>
              </div>

              <div className="text-xs text-gray-400 min-w-[140px] text-right">
                {fmtDate(row.createdAt)}
              </div>

              <Link
                href={`/dashboard/orders/${row.orderId}`}
                className="text-xs px-3 py-1.5 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 font-medium transition"
              >
                {formatOrderId(row.orderId)}
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
