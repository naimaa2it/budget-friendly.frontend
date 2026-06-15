"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { formatOrderId } from "@/lib/orderId";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const STATUS_STYLE = {
  pending: "bg-yellow-100 text-yellow-700",
  accepted: "bg-emerald-100 text-emerald-700",
  picked: "bg-orange-100 text-orange-700",
  approved: "bg-green-100 text-green-700",
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

export default function AuthorizedFollowUpProfile({ adminId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!adminId) return;
    fetch(`${API}/api/admin/admins/${adminId}/pick-profile`, {
      credentials: "include",
    })
      .then((r) => (r.ok ? r.json() : null))
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [adminId]);

  if (loading) {
    return <div className="text-center py-16 text-gray-400">Loading profile…</div>;
  }
  if (!data?.person) {
    return <div className="text-center py-16 text-red-500">Profile not found.</div>;
  }

  const { person, orders, stats } = data;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{person.name}</h1>
          <p className="text-sm text-gray-500 mt-1">
            {person.email} · <span className="capitalize">{person.role}</span>
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/dashboard/authorized/${adminId}`}
            className="text-sm px-3 py-2 border rounded-lg hover:bg-gray-50"
          >
            Edit account
          </Link>
          <Link
            href="/dashboard/authorized"
            className="text-sm px-3 py-2 border rounded-lg hover:bg-gray-50"
          >
            ← All authorized
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-xl border p-4">
        <p className="text-xs text-gray-500 uppercase">Orders picked</p>
        <p className="text-3xl font-bold text-emerald-700 mt-1">{stats.total}</p>
      </div>

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b">
          <h2 className="font-semibold text-gray-800">Picked orders</h2>
        </div>
        {!orders.length ? (
          <p className="px-5 py-10 text-center text-gray-400">No orders picked yet.</p>
        ) : (
          <ul className="divide-y">
            {orders.map((order) => (
              <li key={order._id} className="px-5 py-4 hover:bg-gray-50 flex flex-wrap items-center gap-3">
                <Link
                  href={`/dashboard/orders/${order._id}`}
                  className="font-mono text-sm font-semibold text-rose-600 hover:underline"
                >
                  {formatOrderId(order._id)}
                </Link>
                <span className="text-sm text-gray-700">
                  {order.billingDetails?.name} · {order.billingDetails?.phone}
                </span>
                <span className="text-sm font-medium">৳{order.total?.toFixed(2)}</span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${STATUS_STYLE[order.status] || "bg-gray-100"}`}
                >
                  {order.status}
                </span>
                <span className="text-xs text-gray-400 ml-auto">
                  Picked {order.pickedBy?.pickedAt ? fmt(order.pickedBy.pickedAt) : fmt(order.createdAt)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
