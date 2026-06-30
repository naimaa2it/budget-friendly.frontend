"use client";

import React, { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { getDisplayPrice } from "@/lib/pricing";

const API = process.env.NEXT_PUBLIC_API_URL || "https://api.pickob.com";

export default function MostPopular() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [limit, setLimit] = useState(20);
  const [deletingId, setDeletingId] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(
        `${API}/api/analytics/most-popular?limit=${limit}`,
        {
          credentials: "include",
        },
      );
      const body = await res.json();
      if (!res.ok) {
        setError(body?.error || "Failed to load");
        return;
      }
      setItems(body.items || []);
    } catch {
      setError("Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDelete = async (item) => {
    if (
      !confirm(`Reset view count for "${item.title}"? This cannot be undone.`)
    )
      return;
    setDeletingId(item._id);
    try {
      const res = await fetch(`${API}/api/analytics/most-popular/${item._id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const body = await res.json();
      if (!res.ok) {
        alert(body?.error || "Failed to delete");
        return;
      }
      setItems((prev) => prev.filter((p) => p._id !== item._id));
    } catch {
      alert("Failed to delete");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Most Popular Products</h1>
          <p className="mt-1 text-sm text-gray-500">
            Products ranked by total page views from all visitors (guests &amp;
            logged-in users).
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            className="text-sm border rounded px-2 py-1.5"
          >
            <option value={10}>Top 10</option>
            <option value={20}>Top 20</option>
            <option value={50}>Top 50</option>
          </select>
          <button
            onClick={fetchData}
            className="px-3 py-1.5 text-sm border rounded"
          >
            Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-xl border p-8 text-center text-gray-500">
          Loading…
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-5 text-red-700 text-sm">
          {error}
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-xl border p-8 text-center text-gray-400 text-sm">
          No view data yet. Product page visits will appear here.
        </div>
      ) : (
        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase text-gray-500 bg-gray-50 border-b">
                <th className="py-2.5 px-4 w-8">#</th>
                <th className="py-2.5 px-4">Product</th>
                <th className="py-2.5 px-4 text-right">Views</th>
                <th className="py-2.5 px-4 text-right">Sales (30d)</th>
                <th className="py-2.5 px-4 text-right">Price</th>
                <th className="py-2.5 px-4"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => {
                const thumb =
                  item.images?.[0]?.url || "/assets/placeholder.svg";
                const { price } = getDisplayPrice(item);
                return (
                  <tr
                    key={item._id}
                    className="border-b last:border-0 hover:bg-gray-50 transition-colors"
                  >
                    <td className="py-2.5 px-4 text-gray-400 font-mono text-xs">
                      {idx + 1}
                    </td>
                    <td className="py-2.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 shrink-0 rounded-md border border-gray-100 overflow-hidden bg-gray-50">
                          <Image
                            src={thumb}
                            alt={item.title}
                            width={36}
                            height={36}
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              e.currentTarget.src = "/assets/placeholder.svg";
                            }}
                          />
                        </div>
                        <span className="font-medium text-gray-800 truncate max-w-50">
                          {item.title}
                        </span>
                      </div>
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      <span className="inline-flex items-center gap-1 bg-purple-50 text-purple-700 font-semibold text-xs px-2 py-0.5 rounded-full">
                        {(item.viewCount || 0).toLocaleString("en-BD")}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-right text-gray-600">
                      {(item.monthlySold || 0).toLocaleString("en-BD")}
                    </td>
                    <td className="py-2.5 px-4 text-right font-semibold text-gray-800">
                      {price != null
                        ? `৳${Number(price).toLocaleString()}`
                        : "—"}
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={`/dashboard/products/${item._id}`}
                          className="text-xs px-2 py-1 border rounded hover:bg-gray-50"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => handleDelete(item)}
                          disabled={deletingId === item._id}
                          className="text-xs px-2 py-1 border border-red-200 text-red-600 rounded hover:bg-red-50 disabled:opacity-50"
                          title="Reset view count"
                        >
                          {deletingId === item._id ? "…" : "Delete"}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
