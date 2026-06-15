"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useUser } from "@/components/context/UserContext";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const RISK_BADGE = {
  low: "bg-emerald-50 text-emerald-700 border-emerald-200",
  medium: "bg-amber-50 text-amber-700 border-amber-200",
  high: "bg-red-50 text-red-700 border-red-200",
};

function RiskBadge({ summary }) {
  if (!summary) return <span className="text-gray-400 text-xs">—</span>;
  const level = summary.riskLevel || "low";
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border ${RISK_BADGE[level]}`}
      title={`Risk score: ${summary.riskScore}/100`}
    >
      {summary.riskScore}
      <span className="opacity-70 capitalize">({level})</span>
    </span>
  );
}

export default function CustomersList() {
  const { user, refreshUser } = useUser();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!user) refreshUser();
  }, [user, refreshUser]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        q: query || "",
        includeStats: "1",
      });
      const resp = await fetch(`${API}/api/admin/users?${params}`, {
        credentials: "include",
      });
      const body = await resp.json();
      if (resp.ok) setItems(body.items || []);
      else throw new Error(body.error || "Failed to load");
    } catch (err) {
      console.error(err);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const handleDelete = async (id) => {
    if (!confirm("Delete this user account?")) return;
    try {
      const resp = await fetch(`${API}/api/admin/users/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const body = await resp.json();
      if (!resp.ok) throw new Error(body.error || "Delete failed");
      fetchUsers();
    } catch (err) {
      alert(err.message || "Failed");
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-4">
      <div className="bg-white rounded-xl border shadow-sm p-5">
        <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Customers</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Search by name, email, or mobile. List shows yourHaat stats — open profile for
              lifetime courier fraud check (Pathao/Steadfast/RedX).
            </p>
          </div>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, email, mobile…"
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-full sm:w-72 focus:outline-none focus:ring-2 focus:ring-rose-300"
          />
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading customers…</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-y">
                <tr>
                  <th className="px-3 py-3">Customer</th>
                  <th className="px-3 py-3">Mobile</th>
                  <th className="px-3 py-3">Orders</th>
                  <th className="px-3 py-3">Delivered</th>
                  <th className="px-3 py-3">Cancelled</th>
                  <th className="px-3 py-3">Returned</th>
                  <th className="px-3 py-3">Success</th>
                  <th className="px-3 py-3">Risk</th>
                  <th className="px-3 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map((u) => {
                  const s = u.orderSummary;
                  return (
                    <tr key={u._id} className="hover:bg-rose-50/30">
                      <td className="px-3 py-3">
                        <p className="font-medium text-gray-800">{u.name || "—"}</p>
                        <p className="text-xs text-gray-400">{u.email}</p>
                      </td>
                      <td className="px-3 py-3 font-mono text-gray-700">
                        {u.mobile || "—"}
                      </td>
                      <td className="px-3 py-3 font-semibold">{s?.totalOrders ?? 0}</td>
                      <td className="px-3 py-3 text-green-700">{s?.delivered ?? 0}</td>
                      <td className="px-3 py-3 text-gray-600">{s?.cancelled ?? 0}</td>
                      <td className="px-3 py-3 text-orange-600">{s?.returned ?? 0}</td>
                      <td className="px-3 py-3">
                        <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                          {s?.deliverySuccessRate ?? 0}%
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <RiskBadge summary={s} />
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex flex-wrap gap-2">
                          <Link
                            href={`/dashboard/customers/${u._id}/profile`}
                            className="px-2 py-1 border rounded text-xs font-medium text-rose-700 border-rose-200 hover:bg-rose-50"
                          >
                            Profile
                          </Link>
                          <Link
                            href={`/dashboard/customers/${u._id}`}
                            className="px-2 py-1 border rounded text-xs hover:bg-gray-50"
                          >
                            Edit
                          </Link>
                          {user?.role === "admin" && (
                            <button
                              className="px-2 py-1 border rounded text-xs text-red-600 hover:bg-red-50"
                              onClick={() => handleDelete(u._id)}
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {items.length === 0 && (
                  <tr>
                    <td colSpan={9} className="text-center py-10 text-gray-400">
                      No customers found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
