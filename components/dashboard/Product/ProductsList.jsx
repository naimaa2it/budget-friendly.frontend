"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUser } from "@/components/context/UserContext";
import {
  FaBell,
  FaStar,
  FaQuestionCircle,
  FaClone,
  FaTrash,
  FaTrashRestore,
} from "react-icons/fa";

const LIMIT = 20;
// Must match TRASH_RETENTION_MS on the backend (30 days).
const TRASH_RETENTION_DAYS = 30;

// Days left before a trashed product is permanently purged by the cron job.
const daysLeftInTrash = (deletedAt) => {
  if (!deletedAt) return null;
  const elapsedMs = Date.now() - new Date(deletedAt).getTime();
  const left = TRASH_RETENTION_DAYS - Math.floor(elapsedMs / 86400000);
  return Math.max(0, left);
};

export default function ProductsList() {
  const { user, refreshUser } = useUser();
  const router = useRouter();
  const API = process.env.NEXT_PUBLIC_API_URL || "https://api.pickob.com";

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState(""); // '', 'draft', 'published', 'archived'
  const [viewTrash, setViewTrash] = useState(false); // recycle-bin view
  const [categories, setCategories] = useState([]);
  const [selectedMain, setSelectedMain] = useState(null);
  const [selectedSub, setSelectedSub] = useState(null);
  const [selectedChild, setSelectedChild] = useState(null);
  const [duplicatingId, setDuplicatingId] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]); // bulk-selected product ids
  const [bulkBusy, setBulkBusy] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const totalPages = Math.ceil(total / LIMIT);

  // helper to collect all descendant ids in tree node
  const collectIds = (node) => {
    if (!node) return [];
    let ids = [String(node._id)];
    if (node.children && node.children.length) {
      node.children.forEach((c) => {
        ids = ids.concat(collectIds(c));
      });
    }
    return ids;
  };

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      // determine which category ids to include
      let catIds = [];
      if (selectedChild) catIds = [String(selectedChild._id)];
      else if (selectedSub) catIds = collectIds(selectedSub);
      else if (selectedMain) catIds = collectIds(selectedMain);

      const catParam = catIds.length ? catIds.join(",") : "";
      const statusParam =
        !viewTrash && statusFilter
          ? `&status=${encodeURIComponent(statusFilter)}`
          : "";
      const trashParam = viewTrash ? "&trashed=true" : "";
      const q = `${API}/api/admin/products?limit=${LIMIT}&page=${page}&q=${encodeURIComponent(query || "")}${catParam ? `&categoryId=${encodeURIComponent(catParam)}` : ""}${statusParam}${trashParam}`;
      const resp = await fetch(q, { credentials: "include" });
      const body = await resp.json();
      if (resp.ok) {
        setItems(body.items || []);
        setTotal(body.total ?? body.pagination?.total ?? 0);
      } else {
        throw new Error(body.error || "Failed to load");
      }
    } catch (err) {
      console.error("Load products error", err);
    } finally {
      setLoading(false);
    }
  }, [
    API,
    query,
    selectedMain,
    selectedSub,
    selectedChild,
    statusFilter,
    viewTrash,
    page,
  ]);

  useEffect(() => {
    if (!user) refreshUser();
  }, [user, refreshUser]);

  useEffect(() => {
    // load categories for filter
    fetch(`${API}/api/products/categories`)
      .then((r) => r.json())
      .then((b) => setCategories(b.categories || []))
      .catch(() => setCategories([]));
  }, [API]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // clear the selection whenever the visible list changes
  useEffect(() => {
    setSelectedIds([]);
  }, [items]);

  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const allSelected = items.length > 0 && selectedIds.length === items.length;
  const toggleSelectAll = () => {
    setSelectedIds(allSelected ? [] : items.map((p) => String(p._id)));
  };

  // Run a bulk action (trash / restore / permanent-delete) against the current selection.
  const runBulkAction = async (action, ids, confirmMsg) => {
    if (!ids.length) return;
    if (confirmMsg && !confirm(confirmMsg)) return;
    setBulkBusy(true);
    try {
      const resp = await fetch(`${API}/api/admin/products/${action}`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });
      const body = await resp.json();
      if (!resp.ok) throw new Error(body.error || "Action failed");
      setSelectedIds([]);
      await fetchItems();
    } catch (err) {
      alert(err.message || "Failed");
    } finally {
      setBulkBusy(false);
    }
  };

  const moveToTrash = (ids) =>
    runBulkAction(
      "trash",
      ids,
      `Move ${ids.length} product(s) to Trash? They can be restored within ${TRASH_RETENTION_DAYS} days.`,
    );

  const restoreFromTrash = (ids) => runBulkAction("restore", ids, null);

  const permanentDelete = (ids) => {
    if (user?.role !== "admin") {
      return alert("Only admin users can permanently delete products");
    }
    return runBulkAction(
      "permanent-delete",
      ids,
      `Permanently delete ${ids.length} product(s)? This cannot be undone.`,
    );
  };

  const handleDuplicate = async (id) => {
    setDuplicatingId(id);
    try {
      const resp = await fetch(`${API}/api/admin/products/${id}/duplicate`, {
        method: "POST",
        credentials: "include",
      });
      const body = await resp.json();
      if (!resp.ok) throw new Error(body.error || "Duplicate failed");
      await fetchItems();
      if (body.product?._id) {
        router.push(`/dashboard/products/${body.product._id}`);
      }
    } catch (err) {
      alert(err.message || "Failed to duplicate product");
    } finally {
      setDuplicatingId(null);
    }
  };

  return (
    <div className="mx-auto mt-6 bg-white p-4 sm:p-6 rounded shadow">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
        <h2 className="text-lg font-semibold">
          {viewTrash ? "Trash" : "Products"}
          {total > 0 && (
            <span className="ml-2 text-sm font-normal text-gray-500">
              ({total} total)
            </span>
          )}
        </h2>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => {
              setViewTrash((v) => !v);
              setPage(1);
              setSelectedIds([]);
            }}
            className={`px-3 py-2 rounded text-sm border ${viewTrash ? "bg-gray-800 text-white border-gray-800" : "bg-white text-gray-700 hover:bg-gray-50"}`}
          >
            <FaTrash className="inline-block mr-1" />
            {viewTrash ? "Back to Products" : "Trash"}
          </button>
          {!viewTrash && (
            <Link
              href="/dashboard/products/new"
              className="px-3 py-2 bg-green-600 text-white rounded text-sm text-center"
            >
              Create product
            </Link>
          )}
        </div>
      </div>

      {/* filters / search / sorting — placed on the next line */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <select
          value={selectedMain?._id || ""}
          onChange={(e) => {
            const id = e.target.value;
            const main = categories.find((c) => String(c._id) === id) || null;
            setSelectedMain(main);
            setSelectedSub(null);
            setSelectedChild(null);
            setPage(1);
          }}
          className="border px-3 py-2 rounded"
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
            const id = e.target.value;
            const sub =
              (selectedMain?.children || []).find(
                (c) => String(c._id) === id,
              ) || null;
            setSelectedSub(sub);
            setSelectedChild(null);
            setPage(1);
          }}
          className="border px-3 py-2 rounded"
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
            const id = e.target.value;
            const child =
              (selectedSub?.children || []).find((c) => String(c._id) === id) ||
              null;
            setSelectedChild(child);
            setPage(1);
          }}
          className="border px-3 py-2 rounded"
        >
          <option value="">Sub‑sub category</option>
          {(selectedSub?.children || []).map((c) => (
            <option key={c._id} value={c._id}>
              {c.name}
            </option>
          ))}
        </select>

        {!viewTrash && (
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="border px-3 py-2 rounded bg-white"
          >
            <option value="">All statuses</option>
            <option value="draft">📝 Drafts</option>
            <option value="published">✅ Published</option>
            <option value="archived">📦 Archived</option>
          </select>
        )}

        <input
          aria-label="Search products"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setPage(1);
          }}
          placeholder="Search products"
          className="border px-3 py-2 rounded flex-1 min-w-45"
        />
      </div>

      {/* Bulk action bar — appears once one or more rows are selected */}
      {selectedIds.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 mb-4 p-3 bg-pink-50 border border-pink-100 rounded">
          <span className="text-sm font-medium text-gray-700">
            {selectedIds.length} selected
          </span>
          {viewTrash ? (
            <>
              <button
                onClick={() => restoreFromTrash(selectedIds)}
                disabled={bulkBusy}
                className="px-3 py-1.5 rounded text-xs text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
              >
                <FaTrashRestore className="inline-block mr-1" />
                Restore
              </button>
              {user?.role === "admin" && (
                <button
                  onClick={() => permanentDelete(selectedIds)}
                  disabled={bulkBusy}
                  className="px-3 py-1.5 rounded text-xs text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
                >
                  <FaTrash className="inline-block mr-1" />
                  Delete permanently
                </button>
              )}
            </>
          ) : (
            <button
              onClick={() => moveToTrash(selectedIds)}
              disabled={bulkBusy}
              className="px-3 py-1.5 rounded text-xs text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
            >
              <FaTrash className="inline-block mr-1" />
              Move to Trash
            </button>
          )}
          <button
            onClick={() => setSelectedIds([])}
            disabled={bulkBusy}
            className="px-3 py-1.5 rounded text-xs border text-gray-600 hover:bg-gray-50 disabled:opacity-50"
          >
            Clear
          </button>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading…</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-gray-600">
              <tr>
                <th className="py-2 w-8">
                  <input
                    type="checkbox"
                    aria-label="Select all products"
                    checked={allSelected}
                    onChange={toggleSelectAll}
                    className="cursor-pointer"
                  />
                </th>
                <th className="py-2 px-3">Title</th>
                <th className="py-2 px-3 whitespace-nowrap">Price</th>
                <th className="py-2 px-3 whitespace-nowrap">Inventory</th>
                <th className="py-2 px-3 whitespace-nowrap">Status</th>
                <th className="py-2 px-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((p) => {
                const id = String(p._id);
                const checked = selectedIds.includes(id);
                const daysLeft = viewTrash ? daysLeftInTrash(p.deletedAt) : null;
                return (
                  <tr
                    key={p._id}
                    className={`border-t ${checked ? "bg-pink-50/50" : ""}`}
                    onMouseDown={(e) => {
                      if (e.button === 1 && !viewTrash) {
                        e.preventDefault();
                        window.open(`/dashboard/products/${p._id}`, "_blank");
                      }
                    }}
                  >
                    <td className="py-3 align-top">
                      <input
                        type="checkbox"
                        aria-label={`Select ${p.title}`}
                        checked={checked}
                        onChange={() => toggleSelect(id)}
                        className="cursor-pointer mt-1"
                      />
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-3">
                        {p.images?.[0]?.url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={p.images[0].url}
                            alt=""
                            className="w-12 h-12 object-cover rounded"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center text-xs text-gray-400">
                            No image
                          </div>
                        )}
                        <div>
                          <div className="font-medium">{p.title}</div>
                          <div className="text-xs text-gray-500">
                            {p.category} · {p.tags?.slice(0, 3).join(", ")}
                          </div>
                          {viewTrash && daysLeft !== null && (
                            <span
                              className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-medium ${daysLeft <= 3 ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-700"}`}
                            >
                              {daysLeft > 0
                                ? `🗑 ${daysLeft} of ${TRASH_RETENTION_DAYS} days left`
                                : "🗑 Pending permanent deletion"}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      {p.price
                        ? `₹${p.price}`
                        : p.variants?.[0]?.price
                          ? `₹${p.variants[0].price}`
                          : "-"}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      {p.inventory ??
                        (p.variants?.reduce(
                          (s, v) => s + (v.inventory || 0),
                          0,
                        ) ||
                          0)}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-1 text-xs rounded ${p.status === "published" ? "bg-green-50 text-green-700" : p.status === "draft" ? "bg-yellow-50 text-yellow-700" : "bg-gray-50 text-gray-700"}`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex flex-wrap gap-1.5">
                        {viewTrash ? (
                          <>
                            <button
                              title="Restore this product"
                              onClick={() => restoreFromTrash([id])}
                              disabled={bulkBusy}
                              className="px-2 py-1 border rounded text-xs text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
                            >
                              <FaTrashRestore className="inline-block mr-1" />
                              Restore
                            </button>
                            {user?.role === "admin" && (
                              <button
                                title="Delete permanently"
                                onClick={() => permanentDelete([id])}
                                disabled={bulkBusy}
                                className="px-2 py-1 border rounded text-xs text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
                              >
                                <FaTrash className="inline-block mr-1" />
                                Delete
                              </button>
                            )}
                          </>
                        ) : (
                          <>
                            <Link
                              className="px-2 py-1 border rounded text-xs"
                              href={`/dashboard/products/${p._id}`}
                            >
                              Edit
                            </Link>
                            <button
                              title="Duplicate this product"
                              onClick={() => handleDuplicate(p._id)}
                              disabled={duplicatingId === p._id}
                              className="px-2 py-1 border rounded text-xs text-gray-600 hover:text-pink-600 disabled:opacity-50"
                            >
                              <FaClone className="inline-block mr-1" />
                              {duplicatingId === p._id
                                ? "Duplicating…"
                                : "Duplicate"}
                            </button>
                            <button
                              title="Move to Trash"
                              onClick={() => moveToTrash([id])}
                              disabled={bulkBusy}
                              className="px-2 py-1 border rounded text-xs text-red-600 hover:bg-red-50 disabled:opacity-50"
                            >
                              <FaTrash className="inline-block mr-1" />
                              Trash
                            </button>
                            <button
                              title="View waitlist for product"
                              onClick={() =>
                                router.push(
                                  `/dashboard/waitlist?productId=${p._id}`,
                                )
                              }
                              className="px-2 py-1 border rounded text-xs text-gray-600 hover:text-pink-600"
                            >
                              <FaBell className="inline-block mr-1" />
                              Waitlist
                            </button>
                            <button
                              title="View reviews for product"
                              onClick={() =>
                                router.push(
                                  `/dashboard/reviews?productId=${p._id}`,
                                )
                              }
                              className="px-2 py-1 border rounded text-xs text-gray-600 hover:text-pink-600"
                            >
                              <FaStar className="inline-block mr-1" />
                              Reviews
                            </button>
                            <button
                              title="View questions for product"
                              onClick={() =>
                                router.push(
                                  `/dashboard/questions?productId=${p._id}`,
                                )
                              }
                              className="px-2 py-1 border rounded text-xs text-gray-600 hover:text-pink-600"
                            >
                              <FaQuestionCircle className="inline-block mr-1" />
                              Q&A
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {items.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              {viewTrash ? "Trash is empty" : "No products found"}
            </div>
          )}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 pt-4 border-t">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 border rounded text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            ← Previous
          </button>
          <span className="text-sm text-gray-600">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 border rounded text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
