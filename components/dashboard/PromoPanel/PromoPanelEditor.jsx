"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import MediaPicker from "@/components/dashboard/MediaPicker";
import Image from "next/image";

function ProductSearchSelect({ selectedProducts, onChange, API }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef(null);

  const search = useCallback(
    async (q) => {
      if (!q.trim()) {
        setResults([]);
        return;
      }
      setSearching(true);
      try {
        const r = await fetch(
          `${API}/api/products?q=${encodeURIComponent(q)}&limit=10&status=published`,
          { credentials: "include" },
        );
        const json = await r.json();
        setResults(json.items || []);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    },
    [API],
  );

  const handleInput = (e) => {
    const val = e.target.value;
    setQuery(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(val), 350);
  };

  const isSelected = (id) =>
    selectedProducts.some((p) => (p._id || p.id) === id);

  const toggle = (product) => {
    const id = product._id || product.id;
    if (isSelected(id)) {
      onChange(selectedProducts.filter((p) => (p._id || p.id) !== id));
    } else {
      onChange([...selectedProducts, product]);
    }
  };

  const remove = (id) =>
    onChange(selectedProducts.filter((p) => (p._id || p.id) !== id));

  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-2">
        Products (shown in Popular Picks carousel)
      </label>

      {/* Selected chips */}
      {selectedProducts.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3 p-3 bg-gray-50 rounded-lg border">
          {selectedProducts.map((p) => {
            const id = p._id || p.id;
            const img = p.images?.[0]?.url || "/assets/placeholder.svg";
            return (
              <div
                key={id}
                className="flex items-center gap-1.5 bg-white border rounded-lg px-2 py-1 text-xs shadow-sm"
              >
                <Image
                  src={img}
                  alt={p.title}
                  width={24}
                  height={24}
                  className="w-6 h-6 object-contain rounded"
                />
                <span className="max-w-30 truncate text-gray-800">
                  {p.title}
                </span>
                <button
                  onClick={() => remove(id)}
                  className="text-gray-400 hover:text-red-500 ml-1 font-bold leading-none"
                >
                  ×
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Search input */}
      <div className="relative">
        <input
          value={query}
          onChange={handleInput}
          placeholder="Search products by name…"
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 pr-8"
        />
        {searching && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2">
            <svg
              className="animate-spin w-4 h-4 text-blue-500"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8z"
              />
            </svg>
          </div>
        )}
      </div>

      {/* Results */}
      {results.length > 0 && (
        <div className="mt-1 border rounded-lg divide-y max-h-52 overflow-y-auto bg-white shadow-lg z-10 relative">
          {results.map((p) => {
            const id = p._id || p.id;
            const img = p.images?.[0]?.url || "/assets/placeholder.svg";
            const selected = isSelected(id);
            return (
              <button
                key={id}
                onClick={() => toggle(p)}
                className={`w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-blue-50 transition text-sm ${selected ? "bg-blue-50" : ""}`}
              >
                <Image
                  src={img}
                  alt={p.title}
                  width={32}
                  height={32}
                  className="w-8 h-8 object-contain rounded border shrink-0"
                />
                <span className="flex-1 truncate text-gray-800">{p.title}</span>
                {selected && (
                  <span className="text-blue-600 font-bold text-xs shrink-0">
                    ✓ Added
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
      {query && !searching && results.length === 0 && (
        <p className="text-xs text-gray-400 mt-1">No products found</p>
      )}
    </div>
  );
}

export default function PromoPanelEditor({
  panelId = null,
  onSuccess,
  onCancel,
}) {
  const API = process.env.NEXT_PUBLIC_API_URL || "https://api.pickob.com";
  const isEdit = !!panelId;

  const [image, setImage] = useState({ url: "", public_id: "" });
  const [subtitle, setSubtitle] = useState("");
  const [title, setTitle] = useState("");
  const [buttonText, setButtonText] = useState("View All");
  const [buttonLink, setButtonLink] = useState("/");
  const [isActive, setIsActive] = useState(true);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    if (!isEdit) return;
    setLoading(true);
    fetch(`${API}/api/admin/promo-panels/${panelId}`, {
      credentials: "include",
    })
      .then((r) => r.json())
      .then((b) => {
        const s = b.panel || {};
        setImage(s.image || { url: "", public_id: "" });
        setSubtitle(s.subtitle || "");
        setTitle(s.title || "");
        setButtonText(s.buttonText || "View All");
        setButtonLink(s.buttonLink || "/");
        setIsActive(s.isActive !== false);
        setSelectedProducts(s.productIds || []);
      })
      .catch((err) => alert("Failed to load: " + err.message))
      .finally(() => setLoading(false));
  }, [panelId, isEdit, API]);

  const handleImageUpload = async (file) => {
    if (!file) return;
    const preview = URL.createObjectURL(file);
    setImage({ url: preview, public_id: "", __uploading: true });
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "Pickob/panels");
      const resp = await fetch(`${API}/api/admin/upload`, {
        method: "POST",
        credentials: "include",
        body: fd,
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || "Upload failed");
      setImage({ url: data.asset.url, public_id: data.asset.public_id });
    } catch (err) {
      alert("Image upload failed: " + err.message);
      setImage({ url: "", public_id: "" });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const body = {
        image,
        subtitle,
        title,
        buttonText,
        buttonLink,
        isActive,
        productIds: selectedProducts.map((p) => p._id || p.id),
      };
      const url = isEdit
        ? `${API}/api/admin/promo-panels/${panelId}`
        : `${API}/api/admin/promo-panels`;
      const resp = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || "Failed");
      onSuccess && onSuccess(data.panel);
    } catch (err) {
      alert("Save failed: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return <div className="py-16 text-center text-gray-400">Loading…</div>;

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-2xl shadow space-y-5">
      <h2 className="text-2xl font-bold text-gray-800">
        {isEdit ? "Edit Promo Panel" : "New Promo Panel"}
      </h2>

      {/* Image upload */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Panel Image
        </label>
        <div
          className="relative border-2 border-dashed border-gray-300 rounded-xl overflow-hidden cursor-pointer hover:border-blue-400 transition"
          style={{ height: "200px" }}
          onClick={() => fileRef.current?.click()}
        >
          {image.url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={image.url}
              alt="Promo panel preview"
              className="w-full h-full object-contain bg-gray-50"
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-2">
              <svg
                className="w-10 h-10"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M4 16l4-4 4 4 4-6 4 6M4 20h16M4 4h16"
                />
              </svg>
              <span className="text-sm">Click to upload image</span>
              <span className="text-xs text-gray-300">
                Recommended: 256 × 256 px
              </span>
            </div>
          )}
          {uploading && (
            <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
              <span className="text-blue-600 font-semibold text-sm">
                Uploading…
              </span>
            </div>
          )}
          {image.url && !uploading && (
            <div className="absolute bottom-2 right-2">
              <span className="bg-black/50 text-white text-xs px-2 py-1 rounded">
                Click to change
              </span>
            </div>
          )}
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleImageUpload(e.target.files[0])}
        />
        <div className="mt-2 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowPicker(true)}
            className="text-xs px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-600 flex items-center gap-1"
          >
            <span>🖼</span> Select from Media Library
          </button>
          {image.url && (
            <button
              type="button"
              onClick={() => setImage({ url: "", public_id: "" })}
              className="text-xs px-3 py-1.5 border border-red-200 rounded-lg hover:bg-red-50 text-red-500"
            >
              Remove
            </button>
          )}
        </div>
      </div>

      <MediaPicker
        open={showPicker}
        onSelect={(asset) => {
          setImage({ url: asset.url, public_id: asset.public_id });
          setShowPicker(false);
        }}
        onClose={() => setShowPicker(false)}
      />

      {/* Text fields */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          Small text (above heading)
        </label>
        <input
          value={subtitle}
          onChange={(e) => setSubtitle(e.target.value)}
          placeholder="e.g. Car Wheel"
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          Heading
        </label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Buy the Grills"
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Button Text
          </label>
          <input
            value={buttonText}
            onChange={(e) => setButtonText(e.target.value)}
            placeholder="View All"
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Button Link
          </label>
          <input
            value={buttonLink}
            onChange={(e) => setButtonLink(e.target.value)}
            placeholder="/products"
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Product selection */}
      <div className="border-t pt-4">
        <ProductSearchSelect
          selectedProducts={selectedProducts}
          onChange={setSelectedProducts}
          API={API}
        />
        <p className="text-xs text-gray-400 mt-1">
          Selected products will appear in the Popular Picks carousel on the
          homepage.
        </p>
      </div>

      {/* Active toggle */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setIsActive((v) => !v)}
          className={`relative w-12 h-6 rounded-full transition-colors ${isActive ? "bg-blue-600" : "bg-gray-300"}`}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${isActive ? "translate-x-6" : ""}`}
          />
        </button>
        <span className="text-sm text-gray-700">
          {isActive ? "Active (shown on homepage)" : "Inactive (hidden)"}
        </span>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button
          onClick={handleSave}
          disabled={saving || uploading}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 transition"
        >
          {saving ? "Saving…" : isEdit ? "Save Changes" : "Add Panel"}
        </button>
        {onCancel && (
          <button
            onClick={onCancel}
            className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}
