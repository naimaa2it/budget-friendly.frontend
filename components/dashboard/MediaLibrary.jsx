"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import toast from "react-hot-toast";
import { useUser } from "@/components/context/UserContext";

const ROOT_FOLDER = process.env.NEXT_PUBLIC_CLOUDINARY_FOLDER || "SmartBuyBD";

export default function MediaLibrary() {
  const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
  const { user } = useUser();

  const [items, setItems] = useState([]);
  const [folders, setFolders] = useState([]);
  const [folder, setFolder] = useState(ROOT_FOLDER);
  const [q, setQ] = useState("");
  const [nextCursor, setNextCursor] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selected, setSelected] = useState(new Set());
  const [deleting, setDeleting] = useState(false);
  const [hoverId, setHoverId] = useState(null);
  const [previewItem, setPreviewItem] = useState(null);

  const qTimer = useRef(null);
  const fileInputRef = useRef(null);

  const loadFolders = useCallback(async () => {
    try {
      const r = await fetch(`${API}/api/admin/media/folders`, {
        credentials: "include",
      });
      const b = await r.json();
      const list = b.folders || [];
      if (!list.includes(ROOT_FOLDER)) list.unshift(ROOT_FOLDER);
      setFolders(list);
    } catch (e) {
      console.error(e);
      setFolders([ROOT_FOLDER]);
    }
  }, [API]);

  const loadImages = useCallback(
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
        const fresh = b.items || [];
        setItems((prev) => (reset ? fresh : [...prev, ...fresh]));
        setNextCursor(b.next_cursor || null);
        if (reset) setSelected(new Set());
      } catch (e) {
        console.error(e);
        toast.error("Failed to load images");
      } finally {
        setLoading(false);
      }
    },
    [API, folder, q, nextCursor],
  ); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    loadFolders();
  }, [loadFolders]);

  useEffect(() => {
    clearTimeout(qTimer.current);
    qTimer.current = setTimeout(() => loadImages(true), 300);
    return () => clearTimeout(qTimer.current);
  }, [folder, q]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setUploading(true);
    const uploadFolder = folder || ROOT_FOLDER;
    let successCount = 0;
    for (const file of files) {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", uploadFolder);
      try {
        const r = await fetch(`${API}/api/admin/upload`, {
          method: "POST",
          body: fd,
          credentials: "include",
        });
        const b = await r.json();
        if (!r.ok) throw new Error(b.error || "Upload failed");
        successCount++;
      } catch (err) {
        toast.error(`Failed: ${file.name} — ${err.message}`);
      }
    }
    if (successCount > 0) toast.success(`${successCount} file(s) uploaded`);
    e.target.value = "";
    setUploading(false);
    loadImages(true);
  };

  const toggleSelect = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectAll = () => setSelected(new Set(items.map((i) => i.public_id)));
  const clearSel = () => setSelected(new Set());

  const handleDelete = async () => {
    if (selected.size === 0) return;
    if (!confirm(`Delete ${selected.size} image(s)? This cannot be undone.`))
      return;
    setDeleting(true);
    try {
      const r = await fetch(`${API}/api/admin/media`, {
        method: "DELETE",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ public_ids: [...selected] }),
      });
      if (!r.ok) throw new Error();
      toast.success(`Deleted ${selected.size} image(s)`);
      setItems((prev) => prev.filter((i) => !selected.has(i.public_id)));
      setSelected(new Set());
      if (previewItem && selected.has(previewItem.public_id))
        setPreviewItem(null);
    } catch {
      toast.error("Delete failed");
    } finally {
      setDeleting(false);
    }
  };

  const deleteSingle = async (item, e) => {
    e.stopPropagation();
    if (!confirm("Delete this image?")) return;
    setDeleting(true);
    try {
      const r = await fetch(`${API}/api/admin/media`, {
        method: "DELETE",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          public_ids: [item.public_id],
          resource_type: item.resource_type,
        }),
      });
      if (!r.ok) throw new Error();
      toast.success("Image deleted");
      setItems((prev) => prev.filter((i) => i.public_id !== item.public_id));
      if (previewItem?.public_id === item.public_id) setPreviewItem(null);
    } catch {
      toast.error("Delete failed");
    } finally {
      setDeleting(false);
    }
  };

  const copyUrl = (url, e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(url).then(() => toast.success("URL copied"));
  };

  return (
    <div className="p-6 min-h-screen bg-gray-50">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Media Library</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Browse and manage all uploaded images and videos.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {selected.size > 0 && user?.role === "admin" && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 disabled:opacity-50"
            >
              🗑 Delete {selected.size} selected
            </button>
          )}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50"
          >
            {uploading ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Uploading…
              </>
            ) : (
              <>↑ Upload</>
            )}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            multiple
            hidden
            onChange={handleUpload}
          />
        </div>
      </div>

      {/* Folder badge */}
      <div className="mb-4 flex items-center gap-2 text-xs text-gray-500">
        <span>Uploading to:</span>
        <span className="bg-blue-50 text-blue-700 border border-blue-200 rounded-full px-2.5 py-0.5 font-medium">
          📁 {folder || ROOT_FOLDER}
        </span>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <input
          type="search"
          placeholder="Search by name…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="border border-gray-300 rounded-xl px-3 py-2 text-sm w-52 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
        />
        {folders.length > 0 && (
          <select
            value={folder}
            onChange={(e) => setFolder(e.target.value)}
            className="border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
          >
            <option value="">All folders</option>
            {folders.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        )}
        <button
          onClick={() => loadImages(true)}
          disabled={loading}
          className="px-3 py-2 text-sm bg-white border border-gray-300 rounded-xl hover:bg-gray-100 disabled:opacity-50"
        >
          ↻ Refresh
        </button>
        {items.length > 0 && (
          <>
            {user?.role === "admin" && (
              <button
                onClick={selectAll}
                className="px-3 py-2 text-sm text-blue-600 hover:underline"
              >
                Select all
              </button>
            )}
            {selected.size > 0 && (
              <button
                onClick={clearSel}
                className="px-3 py-2 text-sm text-gray-500 hover:underline"
              >
                Clear selection
              </button>
            )}
          </>
        )}
        {loading && (
          <span className="text-xs text-gray-400 ml-1">Loading…</span>
        )}
        <span className="ml-auto text-xs text-gray-400">
          {items.length} shown
        </span>
      </div>

      {/* Grid */}
      {items.length === 0 && !loading ? (
        <div className="text-center py-24 text-gray-400 text-sm">
          No media found.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {items.map((item) => {
            const isSel = selected.has(item.public_id);
            const isHov = hoverId === item.public_id;
            const isVideo = item.resource_type === "video";
            return (
              <div
                key={item.public_id}
                className={`relative aspect-square rounded-xl overflow-hidden border-2 cursor-pointer transition-all ${
                  isSel
                    ? "border-blue-500 ring-2 ring-blue-400"
                    : "border-transparent hover:border-gray-300"
                }`}
                onClick={() => toggleSelect(item.public_id)}
                onMouseEnter={() => setHoverId(item.public_id)}
                onMouseLeave={() => setHoverId(null)}
              >
                {isVideo ? (
                  <video
                    src={item.url}
                    className="w-full h-full object-cover bg-gray-100"
                    muted
                    playsInline
                  />
                ) : (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={item.url}
                    alt={item.public_id}
                    className="w-full h-full object-cover bg-gray-100"
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.src = "/assets/placeholder.svg";
                    }}
                  />
                )}

                {/* Video badge */}
                {isVideo && (
                  <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-0.5 rounded">
                    🎥 Video
                  </div>
                )}

                {/* Hover overlay */}
                {(isHov || isSel) && (
                  <div className="absolute inset-0 bg-black/40 flex flex-col justify-between p-2">
                    <div className="flex justify-between items-start">
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center text-xs font-bold ${
                          isSel
                            ? "bg-blue-500 border-blue-500 text-white"
                            : "border-white"
                        }`}
                      >
                        {isSel && "✓"}
                      </div>
                      <div className="flex gap-1">
                        <button
                          title="Preview"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPreviewItem(item);
                          }}
                          className="bg-white/90 hover:bg-white rounded-md w-6 h-6 flex items-center justify-center text-gray-700 text-xs"
                        >
                          ⛶
                        </button>
                        <button
                          title="Copy URL"
                          onClick={(e) => copyUrl(item.url, e)}
                          className="bg-white/90 hover:bg-white rounded-md w-6 h-6 flex items-center justify-center text-gray-700 text-xs"
                        >
                          ⎘
                        </button>
                        {user?.role === "admin" && (
                          <button
                            title="Delete"
                            onClick={(e) => deleteSingle(item, e)}
                            className="bg-red-500 hover:bg-red-600 rounded-md w-6 h-6 flex items-center justify-center text-white text-xs"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="text-white text-[10px] leading-tight truncate">
                      {item.public_id.split("/").pop()}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Load more */}
      {nextCursor && (
        <div className="mt-6 flex justify-center">
          <button
            onClick={() => loadImages(false)}
            disabled={loading}
            className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
          >
            {loading ? "Loading…" : "Load more images"}
          </button>
        </div>
      )}

      {/* Preview Modal */}
      {previewItem && (
        <div
          className="fixed inset-0 z-9999 bg-black/70 flex items-center justify-center p-4"
          onClick={() => setPreviewItem(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl overflow-hidden max-w-2xl w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <h3 className="font-semibold text-gray-800 text-sm truncate max-w-xs">
                {previewItem.public_id}
              </h3>
              <button
                onClick={() => setPreviewItem(null)}
                className="text-gray-400 hover:text-gray-700 text-2xl leading-none ml-2"
              >
                ×
              </button>
            </div>

            {previewItem.resource_type === "video" ? (
              <video
                src={previewItem.url}
                controls
                className="w-full max-h-[60vh] object-contain bg-gray-100"
              />
            ) : (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={previewItem.url}
                alt={previewItem.public_id}
                className="w-full max-h-[60vh] object-contain bg-gray-100"
              />
            )}

            <div className="px-4 py-3 bg-gray-50 flex items-center justify-between">
              <div className="text-xs text-gray-500 space-y-0.5">
                <p>
                  Type:{" "}
                  <span className="font-medium">
                    {previewItem.resource_type === "video" ? "Video" : "Image"}
                  </span>
                </p>
                {previewItem.format && (
                  <p>
                    Format:{" "}
                    <span className="font-medium">
                      {previewItem.format.toUpperCase()}
                    </span>
                  </p>
                )}
                {previewItem.width && previewItem.height && (
                  <p>
                    Size:{" "}
                    <span className="font-medium">
                      {previewItem.width} × {previewItem.height}
                    </span>
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={(e) => copyUrl(previewItem.url, e)}
                  className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-300"
                >
                  Copy URL
                </button>
                {user?.role === "admin" && (
                  <button
                    onClick={(e) => deleteSingle(previewItem, e)}
                    className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-medium hover:bg-red-700"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
