"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useUser } from "@/components/context/UserContext";
import { uploadAdminImage } from "@/lib/uploadImage";
import MediaPicker from "@/components/dashboard/MediaPicker";

const API = process.env.NEXT_PUBLIC_API_URL || "https://api.pickob.com";

const slugify = (name) =>
  name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-") || `brand-${Date.now()}`;

function BrandForm({ brand, onSuccess, onCancel }) {
  const [name, setName] = useState(brand?.name || "");
  const [logo, setLogo] = useState(brand?.logo || null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showPicker, setShowPicker] = useState(false);
  const fileRef = useRef(null);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const { asset } = await uploadAdminImage(file, "Pickob/brands");
      setLogo(asset.url);
    } catch (err) {
      setError(err.message || "Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleSave = async () => {
    if (!name.trim()) return setError("Brand name is required");
    if (!logo) return setError("Please upload a logo");
    setSaving(true);
    setError("");
    try {
      const url = brand
        ? `${API}/api/brands/${brand._id}`
        : `${API}/api/brands`;
      const payload = brand
        ? { name: name.trim(), logo }
        : { name: name.trim(), slug: slugify(name), logo };
      const resp = await fetch(url, {
        method: brand ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const body = await resp.json().catch(() => ({}));
      if (resp.status === 409) throw new Error("এই নামের brand আগে থেকেই আছে");
      if (!resp.ok) throw new Error(body.error || "Save failed");
      onSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white border border-blue-200 rounded-xl p-4 shadow-sm space-y-3">
      <p className="font-semibold text-gray-800 text-sm">
        {brand ? "Edit Brand Logo" : "Add Brand Logo"}
      </p>

      <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
        {/* Logo preview / upload */}
        <div className="flex items-center gap-3">
          <div className="w-24 h-14 border border-gray-200 rounded-lg bg-gray-50 flex items-center justify-center overflow-hidden shrink-0">
            {logo ? (
              <img src={logo} alt="" className="max-w-full max-h-full object-contain" />
            ) : (
              <span className="text-gray-300 text-xs">No logo</span>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-blue-600 border border-blue-200 rounded-lg px-3 py-1.5 cursor-pointer hover:bg-blue-50 text-center">
              {uploading ? "Uploading…" : logo ? "Change Logo" : "Upload Logo"}
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFile}
                disabled={uploading}
              />
            </label>
            <button
              type="button"
              onClick={() => setShowPicker(true)}
              className="text-xs text-gray-600 border border-gray-300 rounded-lg px-3 py-1.5 hover:bg-gray-50 flex items-center justify-center gap-1"
            >
              <span>🖼</span> Select from Media Library
            </button>
          </div>
        </div>

        <MediaPicker
          open={showPicker}
          onSelect={(asset) => {
            setLogo(asset.url);
            setShowPicker(false);
          }}
          onClose={() => setShowPicker(false)}
        />

        {/* Name */}
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Brand name (e.g. Samsung)"
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        {/* Actions */}
        <div className="flex gap-2 shrink-0">
          <button
            onClick={handleSave}
            disabled={saving || uploading}
            className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? "Saving…" : brand ? "Update" : "Add"}
          </button>
          <button
            onClick={onCancel}
            className="text-gray-600 text-sm px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </div>

      {error && <p className="text-red-500 text-xs">{error}</p>}
    </div>
  );
}

export default function BrandLogosList() {
  const { user } = useUser();
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [editId, setEditId] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    fetch(`${API}/api/brands/admin/list`, { credentials: "include" })
      .then((r) => r.json())
      .then((b) => setBrands(b.brands || []))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleToggleActive = async (brand) => {
    try {
      const resp = await fetch(`${API}/api/brands/${brand._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ isActive: !brand.isActive }),
      });
      if (!resp.ok) throw new Error("Failed");
      setBrands((prev) =>
        prev.map((b) =>
          b._id === brand._id ? { ...b, isActive: !b.isActive } : b,
        ),
      );
    } catch {
      alert("Failed to update");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this brand logo? This cannot be undone.")) return;
    setDeleting(id);
    try {
      const resp = await fetch(`${API}/api/brands/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!resp.ok) throw new Error("Failed");
      setBrands((prev) => prev.filter((b) => b._id !== id));
    } catch {
      alert("Delete failed");
    } finally {
      setDeleting(null);
    }
  };

  const handleMoveOrder = async (idx, dir) => {
    const next = [...brands];
    const swap = idx + dir;
    if (swap < 0 || swap >= next.length) return;
    [next[idx], next[swap]] = [next[swap], next[idx]];
    const updated = next.map((b, i) => ({ ...b, order: i }));
    setBrands(updated);
    try {
      await Promise.all(
        [updated[idx], updated[swap]].map((b) =>
          fetch(`${API}/api/brands/${b._id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ order: b.order }),
          }),
        ),
      );
    } catch {
      alert("Reorder failed");
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Brand Logos</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Manage the &quot;Top Global Brands&quot; logo strip shown on the
            homepage.
          </p>
        </div>
        {!adding && (
          <button
            onClick={() => {
              setAdding(true);
              setEditId(null);
            }}
            className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 shrink-0"
          >
            + Add Brand
          </button>
        )}
      </div>

      {adding && (
        <div className="mb-4">
          <BrandForm
            onSuccess={() => {
              setAdding(false);
              load();
            }}
            onCancel={() => setAdding(false)}
          />
        </div>
      )}

      {loading ? (
        <div className="text-center text-gray-400 py-16">Loading…</div>
      ) : brands.length === 0 && !adding ? (
        <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-xl">
          <p className="text-gray-500 mb-3">No brand logos yet.</p>
          <button
            onClick={() => setAdding(true)}
            className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Add your first brand
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {brands.map((brand, idx) =>
            editId === brand._id ? (
              <BrandForm
                key={brand._id}
                brand={brand}
                onSuccess={() => {
                  setEditId(null);
                  load();
                }}
                onCancel={() => setEditId(null)}
              />
            ) : (
              <div
                key={brand._id}
                className="flex items-center gap-4 bg-white border border-gray-200 rounded-xl p-4 shadow-sm"
              >
                {/* Order controls */}
                <div className="flex flex-col gap-0.5">
                  <button
                    onClick={() => handleMoveOrder(idx, -1)}
                    disabled={idx === 0}
                    className="text-gray-400 hover:text-gray-700 disabled:opacity-20 text-xs leading-none p-0.5"
                  >
                    ▲
                  </button>
                  <button
                    onClick={() => handleMoveOrder(idx, 1)}
                    disabled={idx === brands.length - 1}
                    className="text-gray-400 hover:text-gray-700 disabled:opacity-20 text-xs leading-none p-0.5"
                  >
                    ▼
                  </button>
                </div>

                {/* Logo */}
                <div className="w-20 h-12 rounded-lg overflow-hidden bg-gray-50 border border-gray-200 flex items-center justify-center shrink-0">
                  {brand.logo ? (
                    <img
                      src={brand.logo}
                      alt={brand.name}
                      className="max-w-full max-h-full object-contain"
                    />
                  ) : (
                    <span className="text-gray-300 text-xs">No logo</span>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800 truncate">
                    {brand.name}
                  </p>
                </div>

                {/* Active toggle */}
                <div
                  onClick={() => handleToggleActive(brand)}
                  className={`relative w-10 h-5 rounded-full cursor-pointer transition-colors shrink-0 ${brand.isActive ? "bg-green-500" : "bg-gray-300"}`}
                >
                  <div
                    className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${brand.isActive ? "translate-x-5" : "translate-x-0"}`}
                  />
                </div>

                {/* Edit / Delete */}
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => {
                      setEditId(brand._id);
                      setAdding(false);
                    }}
                    className="text-blue-600 hover:text-blue-800 text-sm px-3 py-1.5 border border-blue-200 rounded-lg hover:bg-blue-50"
                  >
                    Edit
                  </button>
                  {user?.role === "admin" && (
                    <button
                      onClick={() => handleDelete(brand._id)}
                      disabled={deleting === brand._id}
                      className="text-red-500 hover:text-red-700 text-sm px-3 py-1.5 border border-red-200 rounded-lg hover:bg-red-50 disabled:opacity-50"
                    >
                      {deleting === brand._id ? "…" : "Delete"}
                    </button>
                  )}
                </div>
              </div>
            ),
          )}
        </div>
      )}
    </div>
  );
}
