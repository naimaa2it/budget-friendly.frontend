"use client";

/**
 * MediaPicker — reusable modal to browse Cloudinary images and pick one or many.
 *
 * Props:
 *   open       — show/hide the modal
 *   onSelect   — called with a single asset object, or an array when multiple=true
 *   onClose    — called when the modal is dismissed
 *   multiple   — when true, allows selecting multiple images (default false)
 *
 * asset shape: { public_id, url, width, height, format }
 */

import React, { useState, useEffect, useCallback, useRef } from "react";

export default function MediaPicker({
  open,
  onSelect,
  onClose,
  multiple = false,
  recentUploads = [],
}) {
  const API = process.env.NEXT_PUBLIC_API_URL || "https://api.pickob.com";

  const ROOT_FOLDER = process.env.NEXT_PUBLIC_CLOUDINARY_FOLDER || "Pickob";

  const [items, setItems] = useState([]);
  const [folders, setFolders] = useState([]);
  const [folder, setFolder] = useState(ROOT_FOLDER);
  const [q, setQ] = useState("");
  const [nextCursor, setNextCursor] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(multiple ? [] : null);

  const qTimer = useRef(null);

  // reset selection when modal opens or mode changes
  useEffect(() => {
    if (open) setSelected(multiple ? [] : null);
  }, [open, multiple]);

  const load = useCallback(
    async (reset = true) => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (folder) params.set("folder", folder);
        if (q) params.set("q", q);
        if (!reset && nextCursor) params.set("next_cursor", nextCursor);

        const r = await fetch(`${API}/api/admin/media?${params}`, {
          credentials: "include",
        });
        const b = await r.json();
        setItems((prev) =>
          reset ? b.items || [] : [...prev, ...(b.items || [])],
        );
        setNextCursor(b.next_cursor || null);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    },
    [API, folder, q, nextCursor],
  );

  // load folders once
  useEffect(() => {
    if (!open) return;
    fetch(`${API}/api/admin/media/folders`, { credentials: "include" })
      .then((r) => r.json())
      .then((b) => {
        const list = b.folders || [];
        if (!list.includes(ROOT_FOLDER)) list.unshift(ROOT_FOLDER);
        setFolders(list);
      })
      .catch(() => setFolders([ROOT_FOLDER]));
  }, [open, API]); // eslint-disable-line react-hooks/exhaustive-deps

  // reload when folder or q changes
  useEffect(() => {
    if (!open) return;
    clearTimeout(qTimer.current);
    qTimer.current = setTimeout(() => load(true), 300);
    return () => clearTimeout(qTimer.current);
  }, [open, folder, q]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!open) return null;

  const isSel = (item) => {
    if (multiple)
      return (selected || []).some((s) => s.public_id === item.public_id);
    return selected?.public_id === item.public_id;
  };

  const selOrder = (item) => {
    if (!multiple) return -1;
    return (selected || []).findIndex((s) => s.public_id === item.public_id);
  };

  const toggleItem = (item) => {
    if (multiple) {
      setSelected((prev) => {
        const arr = prev || [];
        const exists = arr.find((s) => s.public_id === item.public_id);
        return exists
          ? arr.filter((s) => s.public_id !== item.public_id)
          : [...arr, item];
      });
    } else {
      setSelected((prev) => (prev?.public_id === item.public_id ? null : item));
    }
  };

  const handleSelect = () => {
    if (multiple) {
      if (!selected || selected.length === 0) return;
      onSelect(selected);
    } else {
      if (!selected) return;
      onSelect(selected);
    }
  };

  const canConfirm = multiple ? (selected || []).length > 0 : !!selected;
  const btnLabel = multiple
    ? `Use ${(selected || []).length} image${(selected || []).length !== 1 ? "s" : ""}`
    : "Use this image";

  return (
    <div className="fixed inset-0 z-9999 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <div>
            <h2 className="text-lg font-bold text-gray-800">Media Library</h2>
            {multiple && (
              <p className="text-xs text-indigo-600 font-medium mt-0.5">
                Multiple selection mode — click to select/deselect
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 px-5 py-3 border-b bg-gray-50">
          <input
            type="search"
            placeholder="Search by name…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="border rounded-lg px-3 py-1.5 text-sm w-48 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          {folders.length > 0 && (
            <select
              value={folder}
              onChange={(e) => setFolder(e.target.value)}
              className="border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value="">All folders</option>
              {folders.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          )}
          {loading && <span className="text-xs text-gray-400">Loading…</span>}
          {multiple && (selected || []).length > 0 && (
            <button
              onClick={() => setSelected([])}
              className="ml-auto text-xs text-red-500 hover:text-red-700 underline"
            >
              Clear selection
            </button>
          )}
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {(() => {
            const recentIds = new Set(recentUploads.map((r) => r.public_id));
            const dedupedItems = items.filter(
              (i) => !recentIds.has(i.public_id),
            );
            const mergedItems = [...recentUploads, ...dedupedItems];
            return mergedItems.length === 0 && !loading ? (
              <div className="text-center py-16 text-gray-400">
                No images found.
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                {mergedItems.map((item) => {
                  const sel = isSel(item);
                  const order = selOrder(item);
                  const isRecent = recentIds.has(item.public_id);
                  return (
                    <button
                      key={item.public_id}
                      onClick={() => toggleItem(item)}
                      className={`relative aspect-square rounded-xl overflow-hidden border-2 transition ${
                        sel
                          ? "border-blue-500 ring-2 ring-blue-400"
                          : "border-transparent hover:border-gray-300"
                      }`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.url}
                        alt={item.public_id}
                        className="w-full h-full object-cover bg-gray-100"
                        loading="lazy"
                        onError={(e) => {
                          e.currentTarget.src = "/assets/placeholder.svg";
                        }}
                      />
                      {isRecent && !sel && (
                        <div className="absolute top-1 left-1">
                          <span className="bg-green-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow">
                            New
                          </span>
                        </div>
                      )}
                      {sel && (
                        <div className="absolute inset-0 bg-blue-500/20 flex items-start justify-end p-1.5">
                          <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shadow">
                            {multiple ? order + 1 : "✓"}
                          </span>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })()}

          {/* Load more */}
          {nextCursor && (
            <div className="mt-4 flex justify-center">
              <button
                onClick={() => load(false)}
                disabled={loading}
                className="px-5 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 disabled:opacity-50"
              >
                {loading ? "Loading…" : "Load more"}
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-4 border-t bg-gray-50 rounded-b-2xl">
          <p className="text-sm text-gray-500">
            {multiple ? (
              (selected || []).length > 0 ? (
                <span className="text-gray-700 font-medium">
                  {selected.length} image{selected.length !== 1 ? "s" : ""}{" "}
                  selected
                </span>
              ) : (
                "Click images to select them"
              )
            ) : selected ? (
              <span className="text-gray-700 font-medium truncate max-w-xs inline-block">
                {selected.public_id}
              </span>
            ) : (
              "Click an image to select it"
            )}
          </p>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              onClick={handleSelect}
              disabled={!canConfirm}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-40"
            >
              {btnLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
