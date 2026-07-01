"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUser } from "@/components/context/UserContext";
import { FaBell, FaStar, FaQuestionCircle, FaClone } from "react-icons/fa";

const LIMIT = 20;

export default function ProductsList() {
  const { user, refreshUser } = useUser();
  const router = useRouter();
  const API = process.env.NEXT_PUBLIC_API_URL || "https://api.pickob.com";

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState(""); // '', 'draft', 'published', 'archived'
  const [categories, setCategories] = useState([]);
  const [selectedMain, setSelectedMain] = useState(null);
  const [selectedSub, setSelectedSub] = useState(null);
  const [selectedChild, setSelectedChild] = useState(null);
  const [duplicatingId, setDuplicatingId] = useState(null);
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
      const statusParam = statusFilter
        ? `&status=${encodeURIComponent(statusFilter)}`
        : "";
      const q = `${API}/api/admin/products?limit=${LIMIT}&page=${page}&q=${encodeURIComponent(query || "")}${catParam ? `&categoryId=${encodeURIComponent(catParam)}` : ""}${statusParam}`;
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
  }, [API, query, selectedMain, selectedSub, selectedChild, statusFilter, page]);

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

  const handleDelete = async (id, force = false) => {
    // only admins are allowed to delete products; moderators may archive via backend if needed
    if (user?.role !== "admin") {
      return alert("Only admin users can delete products");
    }

    const msg = force
      ? "Permanently delete this product? This cannot be undone."
      : "Archive this product?";
    if (!confirm(msg)) return;
    try {
      const url = `${API}/api/admin/products/${id}${force ? "?force=true" : ""}`;
      const resp = await fetch(url, {
        method: "DELETE",
        credentials: "include",
      });
      const body = await resp.json();
      if (!resp.ok) throw new Error(body.error || "Delete failed");
      fetchItems();
    } catch (err) {
      alert(err.message || "Failed");
    }
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
          Products
          {total > 0 && (
            <span className="ml-2 text-sm font-normal text-gray-500">
              ({total} total)
            </span>
          )}
        </h2>
        <Link
          href="/dashboard/products/new"
          className="px-3 py-2 bg-green-600 text-white rounded text-sm text-center shrink-0"
        >
          Create product
        </Link>
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

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading…</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-gray-600">
              <tr>
                <th className="py-2">Title</th>
                <th className="py-2">Price</th>
                <th className="py-2">Inventory</th>
                <th className="py-2">Status</th>
                <th className="py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((p) => (
                <tr
                  key={p._id}
                  className="border-t"
                  onMouseDown={(e) => {
                    if (e.button === 1) {
                      e.preventDefault();
                      window.open(`/dashboard/products/${p._id}`, "_blank");
                    }
                  }}
                >
                  <td className="py-3">
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
                      </div>
                    </div>
                  </td>
                  <td className="py-3">
                    {p.price
                      ? `₹${p.price}`
                      : p.variants?.[0]?.price
                        ? `₹${p.variants[0].price}`
                        : "-"}
                  </td>
                  <td className="py-3">
                    {p.inventory ??
                      (p.variants?.reduce(
                        (s, v) => s + (v.inventory || 0),
                        0,
                      ) ||
                        0)}
                  </td>
                  <td className="py-3">
                    <span
                      className={`px-2 py-1 text-xs rounded ${p.status === "published" ? "bg-green-50 text-green-700" : p.status === "draft" ? "bg-yellow-50 text-yellow-700" : "bg-gray-50 text-gray-700"}`}
                    >
                      {p.status}
                    </span>
                  </td>
                  <td className="py-3">
                    <div className="flex flex-wrap gap-1.5">
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
                        {duplicatingId === p._id ? "Duplicating…" : "Duplicate"}
                      </button>
                      {user?.role === "admin" && (
                        <button
                          className="px-2 py-1 border rounded text-xs text-white bg-red-600 hover:bg-red-700"
                          onClick={() => handleDelete(p._id, true)}
                        >
                          Delete
                        </button>
                      )}
                      <button
                        title="View waitlist for product"
                        onClick={() =>
                          router.push(`/dashboard/waitlist?productId=${p._id}`)
                        }
                        className="px-2 py-1 border rounded text-xs text-gray-600 hover:text-pink-600"
                      >
                        <FaBell className="inline-block mr-1" />
                        Waitlist
                      </button>
                      <button
                        title="View reviews for product"
                        onClick={() =>
                          router.push(`/dashboard/reviews?productId=${p._id}`)
                        }
                        className="px-2 py-1 border rounded text-xs text-gray-600 hover:text-pink-600"
                      >
                        <FaStar className="inline-block mr-1" />
                        Reviews
                      </button>
                      <button
                        title="View questions for product"
                        onClick={() =>
                          router.push(`/dashboard/questions?productId=${p._id}`)
                        }
                        className="px-2 py-1 border rounded text-xs text-gray-600 hover:text-pink-600"
                      >
                        <FaQuestionCircle className="inline-block mr-1" />
                        Q&A
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {items.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No products found
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
