"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useUser } from "@/components/context/UserContext";
import { useSearchParams } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_URL || "https://api.pickob.com";

function Stars({ value }) {
  return (
    <span className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <svg
          key={n}
          className={`w-4 h-4 ${n <= value ? "text-yellow-400" : "text-gray-300"}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </span>
  );
}

export default function ReviewsList() {
  const { user } = useUser();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingKey, setEditingKey] = useState(null); // "productId-index"
  const [editForm, setEditForm] = useState({ rating: 5, body: "" });
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState("");
  const searchParams = useSearchParams();
  const productParam = searchParams?.get("productId") || null;

  // category filter state
  const [categories, setCategories] = useState([]);
  const [selectedMain, setSelectedMain] = useState(null);
  const [selectedSub, setSelectedSub] = useState(null);
  const [selectedChild, setSelectedChild] = useState(null);

  // sort state: 'date_desc' | 'date_asc' | 'rating_desc' | 'rating_asc'
  const [sortBy, setSortBy] = useState("date_desc");

  // collect all descendant ids for a category node
  const collectIds = (node) => {
    if (!node) return [];
    let ids = [String(node._id)];
    (node.children || []).forEach((c) => {
      ids = ids.concat(collectIds(c));
    });
    return ids;
  };

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/products/admin-reviews`, {
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok) setRows(data.rows || []);
      else alert(data.error || "Failed to load reviews");
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  useEffect(() => {
    fetch(`${API}/api/products/categories`)
      .then((r) => r.json())
      .then((b) => setCategories(b.categories || []))
      .catch(() => setCategories([]));
  }, [API]);

  const handleDelete = async (productId, index) => {
    if (!confirm("Delete this review permanently?")) return;
    try {
      const res = await fetch(
        `${API}/api/products/${productId}/reviews/${index}`,
        {
          method: "DELETE",
          credentials: "include",
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Delete failed");
      fetchReviews();
    } catch (err) {
      alert(err.message || "Failed");
    }
  };

  const startEdit = (row) => {
    setEditingKey(`${row.productId}-${row.index}`);
    setEditForm({ rating: row.rating || 5, body: row.body || "" });
  };

  const cancelEdit = () => {
    setEditingKey(null);
    setEditForm({ rating: 5, body: "" });
  };

  const handleSave = async (productId, index) => {
    setSaving(true);
    try {
      const res = await fetch(
        `${API}/api/products/admin-reviews/${productId}/${index}`,
        {
          method: "PUT",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(editForm),
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      setEditingKey(null);
      fetchReviews();
    } catch (err) {
      alert(err.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  // build active category id set
  const activeCatIds = (() => {
    if (selectedChild) return new Set(collectIds(selectedChild).map(String));
    if (selectedSub) return new Set(collectIds(selectedSub).map(String));
    if (selectedMain) return new Set(collectIds(selectedMain).map(String));
    return null;
  })();

  const filtered = rows
    .filter((r) => {
      // if productId query param present, only show reviews for that product
      if (productParam) return String(r.productId) === String(productParam);
      // text search
      if (filter) {
        const q = filter.toLowerCase();
        if (
          !r.productTitle?.toLowerCase().includes(q) &&
          !r.authorName?.toLowerCase().includes(q) &&
          !r.body?.toLowerCase().includes(q)
        )
          return false;
      }
      // category filter
      if (activeCatIds && !activeCatIds.has(String(r.categoryId))) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "date_asc")
        return new Date(a.createdAt) - new Date(b.createdAt);
      if (sortBy === "rating_desc") return (b.rating || 0) - (a.rating || 0);
      if (sortBy === "rating_asc") return (a.rating || 0) - (b.rating || 0);
      // date_desc (default)
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

  return (
    <div className="max-w-6xl mx-auto bg-white p-6 rounded shadow">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">
            Reviews Management
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">
            <Link
              href="/dashboard/reviews"
              className="hover:text-pink-700 hover:underline"
            >
              {rows.length} total review{rows.length !== 1 ? "s" : ""}
            </Link>
          </p>
        </div>
        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Search by product, author, or comment…"
          className="border px-3 py-2 rounded w-full sm:w-72 text-sm"
        />
      </div>

      {/* Category + sort filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <select
          value={selectedMain?._id || ""}
          onChange={(e) => {
            const main =
              categories.find((c) => String(c._id) === e.target.value) || null;
            setSelectedMain(main);
            setSelectedSub(null);
            setSelectedChild(null);
          }}
          className="border px-3 py-2 rounded text-sm bg-white"
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c._id} value={c._id}>
              {c.name}
            </option>
          ))}
        </select>

        <select
          value={selectedSub?._id || ""}
          onChange={(e) => {
            const sub =
              (selectedMain?.children || []).find(
                (c) => String(c._id) === e.target.value,
              ) || null;
            setSelectedSub(sub);
            setSelectedChild(null);
          }}
          className="border px-3 py-2 rounded text-sm bg-white"
          disabled={!selectedMain}
        >
          <option value="">Sub category</option>
          {(selectedMain?.children || []).map((c) => (
            <option key={c._id} value={c._id}>
              {c.name}
            </option>
          ))}
        </select>

        <select
          value={selectedChild?._id || ""}
          onChange={(e) => {
            const child =
              (selectedSub?.children || []).find(
                (c) => String(c._id) === e.target.value,
              ) || null;
            setSelectedChild(child);
          }}
          className="border px-3 py-2 rounded text-sm bg-white"
          disabled={!selectedSub}
        >
          <option value="">Sub‑sub category</option>
          {(selectedSub?.children || []).map((c) => (
            <option key={c._id} value={c._id}>
              {c.name}
            </option>
          ))}
        </select>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="border px-3 py-2 rounded text-sm bg-white ml-auto"
        >
          <option value="date_desc">Newest first</option>
          <option value="date_asc">Oldest first</option>
          <option value="rating_desc">Highest rating</option>
          <option value="rating_asc">Lowest rating</option>
        </select>
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400">Loading reviews…</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          {filter || activeCatIds
            ? "No reviews match your filters."
            : "No reviews yet."}
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((row) => {
            const key = `${row.productId}-${row.index}`;
            const isEditing = editingKey === key;
            return (
              <div key={key} className="border rounded-lg p-4">
                {/* Product & meta */}
                <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
                  <div>
                    <span className="text-xs font-medium bg-pink-50 text-pink-700 px-2 py-0.5 rounded hover:bg-pink-100 transition">
                      <Link
                        href={`/product/${row.productId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {row.productTitle || "Unknown Product"}
                      </Link>
                    </span>
                    <div className="flex items-center gap-2 mt-1">
                      <Stars value={row.rating} />
                      <span className="text-sm font-medium text-gray-700">
                        {row.authorName || "Anonymous"}
                      </span>
                      <span className="text-xs text-gray-400">
                        {row.createdAt
                          ? new Date(row.createdAt).toLocaleDateString()
                          : ""}
                      </span>
                    </div>
                  </div>
                  {!isEditing && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => startEdit(row)}
                        className="text-xs px-3 py-1.5 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 font-medium transition"
                      >
                        Edit
                      </button>
                      {user?.role === "admin" && (
                        <button
                          onClick={() => handleDelete(row.productId, row.index)}
                          className="text-xs px-3 py-1.5 rounded bg-red-50 text-red-600 hover:bg-red-100 font-medium transition"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Body / edit form */}
                {isEditing ? (
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-medium text-gray-600 block mb-1">
                        Rating
                      </label>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <button
                            key={n}
                            type="button"
                            onClick={() =>
                              setEditForm((f) => ({ ...f, rating: n }))
                            }
                          >
                            <svg
                              className={`w-6 h-6 ${n <= editForm.rating ? "text-yellow-400" : "text-gray-300"}`}
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-600 block mb-1">
                        Comment
                      </label>
                      <textarea
                        value={editForm.body}
                        onChange={(e) =>
                          setEditForm((f) => ({ ...f, body: e.target.value }))
                        }
                        rows={3}
                        className="w-full border rounded px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-pink-300"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSave(row.productId, row.index)}
                        disabled={saving}
                        className="text-sm px-4 py-1.5 rounded bg-pink-600 text-white hover:bg-pink-700 disabled:opacity-60 font-medium transition"
                      >
                        {saving ? "Saving…" : "Save"}
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="text-sm px-4 py-1.5 rounded border text-gray-600 hover:bg-gray-50 transition"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {row.body}
                    </p>
                    {row.images?.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {row.images.map((imgUrl, i) => (
                          <a
                            key={i}
                            href={imgUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="relative w-16 h-16 rounded-lg overflow-hidden border border-gray-200 hover:opacity-90 transition"
                          >
                            <Image
                              src={imgUrl}
                              alt={`review-photo-${i + 1}`}
                              fill
                              className="object-cover"
                            />
                          </a>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
