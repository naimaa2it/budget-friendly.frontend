"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import MediaPicker from "@/components/dashboard/MediaPicker";
import { useUser } from "@/components/context/UserContext";
import { uploadAdminImage } from "@/lib/uploadImage";

export default function PopupManager() {
  const API = process.env.NEXT_PUBLIC_API_URL || "https://api.pickob.com";
  const { user } = useUser();

  const [image, setImage] = useState({ url: "", public_id: "" });
  const [link, setLink] = useState("/");
  const [isActive, setIsActive] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showPicker, setShowPicker] = useState(false);
  const [saved, setSaved] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    fetch(`${API}/api/admin/popup`, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        const p = d.popup;
        if (p) {
          setImage(p.image || { url: "", public_id: "" });
          setLink(p.link || "/");
          setIsActive(p.isActive !== false);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [API]);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await uploadFile(file);
  };

  const uploadFile = async (file) => {
    const preview = URL.createObjectURL(file);
    setImage({ url: preview, public_id: "", __uploading: true });
    setUploading(true);
    try {
      const data = await uploadAdminImage(file, "Pickob/popups");
      setImage({ url: data.asset.url, public_id: data.asset.public_id });
    } catch (err) {
      alert("Image upload failed: " + err.message);
      setImage({ url: "", public_id: "" });
    } finally {
      setUploading(false);
    }
  };

  const handlePickerSelect = (asset) => {
    setImage({ url: asset.url, public_id: asset.public_id });
    setShowPicker(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) await uploadFile(file);
  };

  const handleSave = async () => {
    if (!image.url) {
      alert("Please upload a popup image first.");
      return;
    }
    setSaving(true);
    try {
      const resp = await fetch(`${API}/api/admin/popup`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ image, link, isActive }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || "Failed");
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      alert("Save failed: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (
      !confirm(
        "Remove the popup image and disable popup? This cannot be undone.",
      )
    )
      return;
    try {
      const resp = await fetch(`${API}/api/admin/popup`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!resp.ok) throw new Error("Failed");
      setImage({ url: "", public_id: "" });
      setLink("/");
      setIsActive(true);
    } catch (err) {
      alert("Delete failed: " + err.message);
    }
  };

  if (loading)
    return <div className="py-16 text-center text-gray-400">Loading…</div>;

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Popup Banner</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Shown to visitors after 3 seconds. Auto-closes after 6 seconds if not
          dismissed.
        </p>
      </div>

      {/* Image upload */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Popup Image *
        </label>
        <div
          className="relative border-2 border-dashed border-gray-300 rounded-xl overflow-hidden cursor-pointer hover:border-blue-400 transition"
          style={{ minHeight: "220px" }}
          onClick={() => !uploading && fileRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
        >
          {image.url ? (
            <div className="relative w-full" style={{ minHeight: "220px" }}>
              <Image
                src={image.url}
                alt="Popup preview"
                fill
                className="object-contain"
                unoptimized={image.url.startsWith("blob:")}
              />
              {uploading && (
                <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                  <span className="text-sm font-medium text-blue-600 animate-pulse">
                    Uploading…
                  </span>
                </div>
              )}
              {!uploading && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setImage({ url: "", public_id: "" });
                  }}
                  className="absolute top-2 right-2 bg-white rounded-full shadow p-1 hover:bg-red-50"
                >
                  <svg
                    className="w-4 h-4 text-red-500"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full py-12 gap-2 text-gray-400">
              <svg
                className="w-10 h-10"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M3 15l5-5 4 4 3-3 4 4" />
                <circle cx="8.5" cy="8.5" r="1.5" />
              </svg>
              <span className="text-sm">
                Click or drag & drop to upload image
              </span>
            </div>
          )}
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
        <div className="flex gap-2 mt-2">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="text-xs px-3 py-1.5 border rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-50"
          >
            {uploading ? "Uploading…" : "Upload new image"}
          </button>
          <button
            type="button"
            onClick={() => setShowPicker(true)}
            className="text-xs px-3 py-1.5 border rounded-lg text-gray-600 hover:bg-gray-50"
          >
            Pick from Media Library
          </button>
        </div>
      </div>

      {/* Link */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          Click-through Link
        </label>
        <input
          type="text"
          value={link}
          onChange={(e) => setLink(e.target.value)}
          placeholder="e.g. /category/sale or https://..."
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
        />
        <p className="text-xs text-gray-400 mt-1">
          Where visitors go when they click the popup image.
        </p>
      </div>

      {/* Active toggle */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setIsActive((v) => !v)}
          className={`relative w-11 h-6 rounded-full transition-colors ${isActive ? "bg-blue-600" : "bg-gray-300"}`}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${isActive ? "translate-x-5" : ""}`}
          />
        </button>
        <span className="text-sm text-gray-700 font-medium">
          {isActive ? "Popup enabled" : "Popup disabled"}
        </span>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button
          onClick={handleSave}
          disabled={saving || uploading}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition text-sm disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save Popup"}
        </button>
        {image.url && user?.role === "admin" && (
          <button
            onClick={handleDelete}
            className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 text-sm"
          >
            Remove Popup
          </button>
        )}
        {saved && (
          <span className="self-center text-sm text-green-600 font-medium">
            ✓ Saved!
          </span>
        )}
      </div>

      {/* Media picker modal */}
      {showPicker && (
        <MediaPicker
          open={showPicker}
          onSelect={handlePickerSelect}
          onClose={() => setShowPicker(false)}
        />
      )}
    </div>
  );
}
