"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { formatOrderId } from "@/lib/orderId";

const API = process.env.NEXT_PUBLIC_API_URL || "https://api.pickob.com";

function fmt(date) {
  return new Date(date).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function RewardsOverview() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("orders");

  useEffect(() => {
    fetch(`${API}/api/admin/rewards`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="text-center py-16 text-gray-400">Loading rewards…</div>
    );
  }
  if (!data) {
    return (
      <div className="text-center py-16 text-red-500">
        Failed to load rewards.
      </div>
    );
  }

  const { stats, users, orders, pointsPerTk } = data;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">All Rewards</h1>
        <p className="text-sm text-gray-500 mt-1">
          Customer reward points — {pointsPerTk} points = ৳1
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border p-4">
          <p className="text-xs text-gray-500 uppercase">Total balance</p>
          <p className="text-2xl font-bold text-rose-600">
            {stats.totalBalance}
          </p>
          <p className="text-xs text-gray-400">≈ ৳{stats.totalBalanceTk}</p>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <p className="text-xs text-gray-500 uppercase">Users with points</p>
          <p className="text-2xl font-bold">{stats.usersWithBalance}</p>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <p className="text-xs text-gray-500 uppercase">
            Points earned (orders)
          </p>
          <p className="text-2xl font-bold text-green-600">
            {stats.totalEarned}
          </p>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <p className="text-xs text-gray-500 uppercase">Points redeemed</p>
          <p className="text-2xl font-bold text-amber-600">
            {stats.totalRedeemed}
          </p>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setTab("orders")}
          className={`px-4 py-2 rounded-full text-sm font-medium ${
            tab === "orders"
              ? "bg-rose-500 text-white"
              : "bg-gray-100 text-gray-600"
          }`}
        >
          Orders ({orders.length})
        </button>
        <button
          type="button"
          onClick={() => setTab("users")}
          className={`px-4 py-2 rounded-full text-sm font-medium ${
            tab === "users"
              ? "bg-rose-500 text-white"
              : "bg-gray-100 text-gray-600"
          }`}
        >
          Users ({users.length})
        </button>
      </div>

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        {tab === "orders" ? (
          orders.length === 0 ? (
            <p className="text-center py-12 text-gray-400">
              No reward activity yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs uppercase text-gray-500 bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3">Order</th>
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3">Earned</th>
                    <th className="px-4 py-3">Redeemed</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {orders.map((o) => (
                    <tr key={o._id} className="hover:bg-rose-50/30">
                      <td className="px-4 py-3">
                        <Link
                          href={`/dashboard/orders/${o._id}`}
                          className="font-mono text-xs text-rose-600 hover:underline"
                        >
                          {formatOrderId(o._id)}
                        </Link>
                      </td>
                      <td className="px-4 py-3">{o.customerName || "—"}</td>
                      <td className="px-4 py-3 font-medium text-green-700">
                        +{o.rewardPointsEarned}
                      </td>
                      <td className="px-4 py-3 text-amber-700">
                        {o.rewardPointsRedeemed > 0
                          ? `-${o.rewardPointsRedeemed} (৳${o.rewardPointsDiscount})`
                          : "—"}
                      </td>
                      <td className="px-4 py-3 capitalize">{o.status}</td>
                      <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                        {fmt(o.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : users.length === 0 ? (
          <p className="text-center py-12 text-gray-400">
            No users with reward balance.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase text-gray-500 bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Balance</th>
                  <th className="px-4 py-3">Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((u) => (
                  <tr key={u._id}>
                    <td className="px-4 py-3 font-medium">{u.name || "—"}</td>
                    <td className="px-4 py-3 text-gray-600">{u.email}</td>
                    <td className="px-4 py-3 font-bold text-rose-600">
                      {u.rewardPointsBalance}
                    </td>
                    <td className="px-4 py-3">
                      ৳{Math.floor((u.rewardPointsBalance || 0) / pointsPerTk)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
