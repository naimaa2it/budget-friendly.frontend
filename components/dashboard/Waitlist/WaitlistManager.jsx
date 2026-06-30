"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { FaTrash, FaBell, FaCheck, FaFilter, FaSync } from "react-icons/fa";
import { useUser } from "@/components/context/UserContext";
import { useSearchParams } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_URL || "https://api.pickob.com";

export default function WaitlistManager() {
  const { user } = useUser();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterNotified, setFilterNotified] = useState("all"); // 'all' | 'pending' | 'notified'
  const [search, setSearch] = useState("");
  const searchParams = useSearchParams();
  const productParam = searchParams?.get("productId") || null;
  const notifiedParam = searchParams?.get("filterNotified") || null;

  useEffect(() => {
    if (
      notifiedParam &&
      ["all", "pending", "notified"].includes(notifiedParam)
    ) {
      setFilterNotified(notifiedParam);
    }
  }, [notifiedParam]);

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (filterNotified === "pending") params.set("notified", "false");
      if (filterNotified === "notified") params.set("notified", "true");
      const res = await fetch(`${API}/api/admin/waitlist?${params}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to load waitlist");
      const data = await res.json();
      setEntries(data.entries || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filterNotified]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const markNotified = async (id) => {
    try {
      await fetch(`${API}/api/admin/waitlist/${id}/notified`, {
        method: "PUT",
        credentials: "include",
      });
      setEntries((prev) =>
        prev.map((e) => (e._id === id ? { ...e, notified: true } : e)),
      );
    } catch {
      alert("Failed to update entry.");
    }
  };

  const deleteEntry = async (id) => {
    if (!confirm("Remove this waitlist entry?")) return;
    try {
      await fetch(`${API}/api/admin/waitlist/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      setEntries((prev) => prev.filter((e) => e._id !== id));
    } catch {
      alert("Failed to delete entry.");
    }
  };

  const filtered = entries.filter((e) => {
    if (productParam) return String(e.productId) === String(productParam);
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (e.productTitle || "").toLowerCase().includes(q) ||
      (e.email || "").toLowerCase().includes(q) ||
      (e.phone || "").includes(q)
    );
  });

  const pendingCount = entries.filter((e) => !e.notified).length;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <FaBell className="text-amber-500" /> Product Waitlist
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Customers who want to be notified when out-of-stock products are
            restocked.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {pendingCount > 0 && (
            <Link
              href="/dashboard/waitlist?filterNotified=pending"
              className="bg-amber-100 text-amber-700 text-xs font-semibold px-3 py-1 rounded-full hover:bg-amber-200 transition"
            >
              {pendingCount} pending notification{pendingCount !== 1 ? "s" : ""}
            </Link>
          )}
          <button
            onClick={fetchEntries}
            className="flex items-center gap-1.5 bg-gray-100 text-gray-700 text-sm px-3 py-1.5 rounded-lg hover:bg-gray-200 transition"
          >
            <FaSync className="w-3 h-3" /> Refresh
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input
          type="text"
          placeholder="Search by product, email, or phone…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
        />
        <div className="flex items-center gap-2">
          <FaFilter className="text-gray-400 text-sm" />
          {["all", "pending", "notified"].map((val) => (
            <button
              key={val}
              onClick={() => setFilterNotified(val)}
              className={`capitalize text-sm px-3 py-1.5 rounded-lg border transition ${
                filterNotified === val
                  ? "bg-pink-600 text-white border-pink-600"
                  : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
              }`}
            >
              {val}
            </button>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 text-red-700 border border-red-200 rounded-lg p-4 mb-4 text-sm">
          {error}
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-gray-400">
          Loading…
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <FaBell className="text-4xl mb-3 text-gray-300" />
          <p className="text-lg font-medium">No waitlist entries found.</p>
          <p className="text-sm mt-1">
            Customers will appear here when they join a product waitlist.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600 uppercase text-xs tracking-wide">
                <tr>
                  <th className="px-4 py-3 text-left">Product</th>
                  <th className="px-4 py-3 text-left">Email</th>
                  <th className="px-4 py-3 text-left">Phone</th>
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((entry) => (
                  <tr key={entry._id} className="hover:bg-gray-50 transition">
                    <td
                      className="px-4 py-3 font-medium text-gray-800 max-w-40 truncate"
                      title={entry.productTitle}
                    >
                      {entry.productTitle || (
                        <span className="text-gray-400 italic">Unknown</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {entry.email ? (
                        <a
                          href={`mailto:${entry.email}`}
                          className="hover:underline text-blue-600"
                        >
                          {entry.email}
                        </a>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {entry.phone ? (
                        <a
                          href={`tel:${entry.phone}`}
                          className="hover:underline text-blue-600"
                        >
                          {entry.phone}
                        </a>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                      {new Date(entry.createdAt).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-3">
                      {entry.notified ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
                          <FaCheck className="w-3 h-3" /> Notified
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                          <FaBell className="w-3 h-3" /> Pending
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {!entry.notified && (
                          <button
                            onClick={() => markNotified(entry._id)}
                            title="Mark as notified"
                            className="text-xs text-green-700 bg-green-50 border border-green-200 px-2 py-1 rounded hover:bg-green-100 transition"
                          >
                            Mark Notified
                          </button>
                        )}
                        {user?.role === "admin" && (
                          <button
                            onClick={() => deleteEntry(entry._id)}
                            title="Delete entry"
                            className="text-red-500 hover:text-red-700 transition p-1"
                          >
                            <FaTrash className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 bg-gray-50 border-t text-xs text-gray-500">
            Showing {filtered.length} of {entries.length} entries
          </div>
        </div>
      )}
    </div>
  );
}
