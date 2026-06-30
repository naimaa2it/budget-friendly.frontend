"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";

const API = process.env.NEXT_PUBLIC_API_URL || "https://api.pickob.com";

// ─── Stock badge ──────────────────────────────────────────────────────────────
function StockBadge({ stock, threshold = 5 }) {
  if (stock <= 0)
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700">
        <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" />
        Out of Stock
      </span>
    );
  if (stock <= threshold)
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />
        Low Stock
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">
      <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
      In Stock
    </span>
  );
}

// ─── Stock bar ────────────────────────────────────────────────────────────────
function StockBar({ stock, threshold = 5, max = 100 }) {
  const pct = Math.min(100, (stock / Math.max(max, 1)) * 100);
  const color =
    stock <= 0
      ? "bg-red-400"
      : stock <= threshold
        ? "bg-amber-400"
        : "bg-green-400";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-gray-700 font-semibold w-8 text-right">
        {stock}
      </span>
    </div>
  );
}

// ─── Inline stock editor ──────────────────────────────────────────────────────
function InlineStockEditor({ value, onSave, disabled }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value));
  const inputRef = useRef(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);
  useEffect(() => {
    setDraft(String(value));
  }, [value]);

  const commit = () => {
    const num = Math.max(0, parseInt(draft, 10) || 0);
    onSave(num);
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="flex items-center gap-1">
        <input
          ref={inputRef}
          type="number"
          min="0"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit();
            if (e.key === "Escape") {
              setDraft(String(value));
              setEditing(false);
            }
          }}
          className="w-16 border border-rose-400 rounded px-1.5 py-0.5 text-sm text-center focus:outline-none focus:ring-1 focus:ring-rose-400"
        />
      </div>
    );
  }

  return (
    <button
      onClick={() => !disabled && setEditing(true)}
      title="Click to edit stock"
      className={`min-w-[2.5rem] px-2 py-0.5 rounded text-sm font-semibold border border-dashed transition ${disabled ? "opacity-40 cursor-not-allowed border-gray-200 text-gray-400" : "border-gray-300 text-gray-800 hover:border-rose-400 hover:text-rose-600 hover:bg-rose-50 cursor-text"}`}
    >
      {value}
    </button>
  );
}

// ─── Variant stock row ────────────────────────────────────────────────────────
function VariantStockRows({ product, onSave }) {
  return (
    <div className="mt-2 pl-8 space-y-1.5">
      {product.variants.map((v, i) => (
        <div key={i} className="flex items-center gap-3 text-xs text-gray-600">
          <span className="shrink-0 font-medium min-w-[6rem] truncate">
            {[v.color?.name, v.size].filter(Boolean).join(" / ") ||
              v.name ||
              `Variant ${i + 1}`}
          </span>
          {v.sku && <span className="text-gray-400 font-mono">{v.sku}</span>}
          <div className="flex-1 flex items-center gap-2">
            <InlineStockEditor
              value={Number(v.inventory) || 0}
              onSave={(val) => onSave(product._id, val, i)}
            />
            <StockBadge
              stock={Number(v.inventory) || 0}
              threshold={product.lowStockThreshold || 5}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function InventoryManager() {
  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState({
    total: 0,
    out_of_stock: 0,
    low_stock: 0,
    in_stock: 0,
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState({});
  const [query, setQuery] = useState("");
  const [stockFilter, setStockFilter] = useState("all");
  const [sort, setSort] = useState("stock_asc");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [expanded, setExpanded] = useState({});
  const [bulkPending, setBulkPending] = useState({});
  const [bulkSaving, setBulkSaving] = useState(false);

  const fetchInventory = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ sort, page, limit: 30 });
      if (query) params.set("q", query);
      if (stockFilter !== "all") params.set("stockFilter", stockFilter);
      const r = await fetch(`${API}/api/admin/inventory?${params}`, {
        credentials: "include",
      });
      const d = await r.json();
      if (r.ok) {
        setItems(d.items || []);
        setSummary(
          d.summary || { total: 0, out_of_stock: 0, low_stock: 0, in_stock: 0 },
        );
        setTotalPages(d.pages || 1);
        setTotal(d.total || 0);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  }, [query, stockFilter, sort, page]);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  const updateStock = async (productId, newStock, variantIndex) => {
    setSaving((s) => ({ ...s, [productId + (variantIndex ?? "")]: true }));
    try {
      const body = { inventory: newStock };
      if (variantIndex != null) body.variantIndex = variantIndex;
      const r = await fetch(`${API}/api/admin/inventory/${productId}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (r.ok) {
        const d = await r.json();
        setItems((prev) =>
          prev.map((it) => {
            if (it._id !== productId) return it;
            if (variantIndex != null) {
              const newVariants = it.variants.map((v, i) =>
                i === variantIndex ? { ...v, inventory: newStock } : v,
              );
              const totalStock = newVariants.reduce(
                (s, v) => s + (Number(v.inventory) || 0),
                0,
              );
              const threshold = it.lowStockThreshold ?? 5;
              const stockStatus =
                totalStock <= 0
                  ? "out_of_stock"
                  : totalStock <= threshold
                    ? "low_stock"
                    : "in_stock";
              return { ...it, variants: newVariants, totalStock, stockStatus };
            } else {
              const threshold = it.lowStockThreshold ?? 5;
              const stockStatus =
                newStock <= 0
                  ? "out_of_stock"
                  : newStock <= threshold
                    ? "low_stock"
                    : "in_stock";
              return {
                ...it,
                inventory: newStock,
                totalStock: newStock,
                stockStatus,
              };
            }
          }),
        );
      }
    } catch {
    } finally {
      setSaving((s) => {
        const n = { ...s };
        delete n[productId + (variantIndex ?? "")];
        return n;
      });
    }
  };

  const updateSettings = async (productId, field, value) => {
    try {
      await fetch(`${API}/api/admin/inventory/${productId}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      });
      setItems((prev) =>
        prev.map((it) =>
          it._id === productId ? { ...it, [field]: value } : it,
        ),
      );
    } catch {}
  };

  const handleBulkSave = async () => {
    if (!Object.keys(bulkPending).length) return;
    setBulkSaving(true);
    try {
      const updates = Object.entries(bulkPending).map(([key, val]) => {
        const [id, vidx] = key.split("__");
        return {
          id,
          inventory: val,
          ...(vidx !== "main" ? { variantIndex: Number(vidx) } : {}),
        };
      });
      await fetch(`${API}/api/admin/inventory/bulk`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updates }),
      });
      setBulkPending({});
      fetchInventory();
    } catch {
    } finally {
      setBulkSaving(false);
    }
  };

  const toggleExpand = (id) => setExpanded((p) => ({ ...p, [id]: !p[id] }));

  const FILTER_TABS = [
    {
      key: "all",
      label: "All Products",
      count: summary.total,
      color: "bg-gray-100 text-gray-700",
    },
    {
      key: "out_of_stock",
      label: "Out of Stock",
      count: summary.out_of_stock,
      color: "bg-red-100 text-red-700",
    },
    {
      key: "low_stock",
      label: "Low Stock",
      count: summary.low_stock,
      color: "bg-amber-100 text-amber-700",
    },
    {
      key: "in_stock",
      label: "In Stock",
      count: summary.in_stock,
      color: "bg-green-100 text-green-700",
    },
  ];

  return (
    <div className="space-y-5">
      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {FILTER_TABS.map((f) => (
          <button
            key={f.key}
            onClick={() => {
              setStockFilter(f.key);
              setPage(1);
            }}
            className={`rounded-xl p-4 text-left border transition shadow-sm hover:shadow-md ${stockFilter === f.key ? "ring-2 ring-rose-400 border-rose-200" : "border-gray-100 bg-white"}`}
          >
            <p className="text-xs text-gray-500 mb-1">{f.label}</p>
            <div
              className={`inline-block px-2 py-0.5 rounded-full text-lg font-bold ${f.color}`}
            >
              {f.count}
            </div>
          </button>
        ))}
      </div>

      {/* Bulk save bar */}
      {Object.keys(bulkPending).length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center justify-between gap-3">
          <p className="text-sm text-amber-800 font-medium">
            {Object.keys(bulkPending).length} unsaved change
            {Object.keys(bulkPending).length > 1 ? "s" : ""}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setBulkPending({})}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              Discard
            </button>
            <button
              onClick={handleBulkSave}
              disabled={bulkSaving}
              className="px-3 py-1.5 bg-amber-500 text-white text-xs font-semibold rounded-lg hover:bg-amber-600 disabled:opacity-60"
            >
              {bulkSaving ? "Saving…" : "Save All"}
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border shadow-sm">
        {/* Toolbar */}
        <div className="px-5 py-4 border-b flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Search product name or SKU…"
            className="border rounded-lg px-3 py-1.5 text-sm w-full sm:w-72 focus:outline-none focus:ring-2 focus:ring-rose-300"
          />
          <select
            value={sort}
            onChange={(e) => {
              setSort(e.target.value);
              setPage(1);
            }}
            className="border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
          >
            <option value="stock_asc">Stock: Low → High</option>
            <option value="stock_desc">Stock: High → Low</option>
            <option value="name_asc">Name: A → Z</option>
            <option value="name_desc">Name: Z → A</option>
          </select>
          <span className="text-xs text-gray-400 sm:ml-auto">
            {total} product{total !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Table */}
        {loading ? (
          <div className="py-20 text-center text-gray-400 text-sm">
            Loading inventory…
          </div>
        ) : items.length === 0 ? (
          <div className="py-20 text-center text-gray-400 text-sm">
            No products found.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {items.map((product) => {
              const thumb = product.images?.[0]?.url;
              const isExpanded = expanded[product._id];
              const threshold = product.lowStockThreshold ?? 5;
              const maxStock = Math.max(product.totalStock, 50);

              return (
                <div
                  key={product._id}
                  className="px-5 py-3 hover:bg-gray-50 transition"
                >
                  <div className="flex items-center gap-3">
                    {/* Expand toggle for variants */}
                    {product.hasVariants ? (
                      <button
                        onClick={() => toggleExpand(product._id)}
                        className="shrink-0 w-5 h-5 rounded flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                      >
                        <svg
                          className={`w-3 h-3 transition-transform ${isExpanded ? "rotate-90" : ""}`}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2.5}
                        >
                          <path d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    ) : (
                      <div className="shrink-0 w-5" />
                    )}

                    {/* Thumbnail */}
                    <div className="shrink-0 w-10 h-10 rounded-lg bg-gray-100 overflow-hidden">
                      {thumb ? (
                        <img
                          src={thumb}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300 text-lg">
                          📦
                        </div>
                      )}
                    </div>

                    {/* Name + SKU */}
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/dashboard/products/${product._id}`}
                        className="text-sm font-medium text-gray-800 hover:text-rose-600 truncate block"
                      >
                        {product.title}
                      </Link>
                      <div className="flex items-center gap-2 mt-0.5">
                        {product.sku && (
                          <span className="text-xs text-gray-400 font-mono">
                            {product.sku}
                          </span>
                        )}
                        {product.hasVariants && (
                          <span className="text-xs text-gray-400">
                            {product.variants.length} variant
                            {product.variants.length > 1 ? "s" : ""}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Stock bar */}
                    <div className="w-36 hidden sm:block">
                      <StockBar
                        stock={product.totalStock}
                        threshold={threshold}
                        max={maxStock}
                      />
                    </div>

                    {/* Badge */}
                    <div className="shrink-0 w-28 flex justify-end">
                      <StockBadge
                        stock={product.totalStock}
                        threshold={threshold}
                      />
                    </div>

                    {/* Inline stock editor (only for non-variant products) */}
                    {!product.hasVariants && (
                      <div className="shrink-0">
                        <InlineStockEditor
                          value={Number(product.inventory) || 0}
                          onSave={(val) => updateStock(product._id, val)}
                          disabled={saving[product._id + ""]}
                        />
                      </div>
                    )}

                    {/* Allow overselling toggle */}
                    <div
                      className="shrink-0 flex items-center gap-1.5"
                      title={
                        product.allowOverselling
                          ? "Overselling allowed — can sell when out of stock"
                          : "Overselling off — cannot sell when out of stock"
                      }
                    >
                      <span className="text-xs text-gray-400 hidden lg:inline">
                        {product.allowOverselling
                          ? "Oversell ON"
                          : "Oversell OFF"}
                      </span>
                      <button
                        onClick={() =>
                          updateSettings(
                            product._id,
                            "allowOverselling",
                            !product.allowOverselling,
                          )
                        }
                        className={`relative inline-flex h-5 w-9 rounded-full transition-colors focus:outline-none ${product.allowOverselling ? "bg-green-500" : "bg-gray-200"}`}
                      >
                        <span
                          className={`inline-block h-4 w-4 mt-0.5 rounded-full bg-white shadow transition-transform ${product.allowOverselling ? "translate-x-4" : "translate-x-0.5"}`}
                        />
                      </button>
                    </div>

                    {/* Edit link */}
                    <Link
                      href={`/dashboard/products/${product._id}`}
                      className="shrink-0 text-xs text-gray-400 hover:text-rose-500 px-2 py-1 rounded border border-transparent hover:border-rose-200"
                    >
                      Edit
                    </Link>
                  </div>

                  {/* Variant rows */}
                  {product.hasVariants && isExpanded && (
                    <VariantStockRows product={product} onSave={updateStock} />
                  )}

                  {/* Low stock threshold setting (shown when expanded or hovering) */}
                  {isExpanded && (
                    <div className="mt-2 pl-8 flex items-center gap-3 text-xs text-gray-500">
                      <span>Low stock threshold:</span>
                      <InlineStockEditor
                        value={product.lowStockThreshold ?? 5}
                        onSave={(val) =>
                          updateSettings(product._id, "lowStockThreshold", val)
                        }
                      />
                      <span className="text-gray-400">
                        (warn below this qty)
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 px-5 py-4 border-t">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 text-sm rounded-lg border hover:bg-gray-50 disabled:opacity-40"
            >
              ← Prev
            </button>
            <span className="text-sm text-gray-600">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 text-sm rounded-lg border hover:bg-gray-50 disabled:opacity-40"
            >
              Next →
            </button>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="bg-white rounded-xl border px-5 py-4 shadow-sm">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
          How it works
        </p>
        <div className="grid sm:grid-cols-3 gap-3 text-xs text-gray-600">
          <div className="flex gap-2">
            <span className="text-green-500">✓</span>
            <span>
              <strong>Click any stock number</strong> to edit it inline. Press
              Enter or click away to save.
            </span>
          </div>
          <div className="flex gap-2">
            <span className="text-amber-500">↕</span>
            <span>
              <strong>Expand variants</strong> (▶ arrow) to see and edit each
              variant's stock separately.
            </span>
          </div>
          <div className="flex gap-2">
            <span className="text-blue-500">⟳</span>
            <span>
              <strong>Oversell toggle</strong> — when ON, the product can be
              ordered even if stock is 0.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
