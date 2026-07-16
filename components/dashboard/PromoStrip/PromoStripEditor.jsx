"use client";

import React, { useEffect, useRef, useState } from "react";
import MediaPicker from "@/components/dashboard/MediaPicker";
import { uploadAdminImage } from "@/lib/uploadImage";

export default function PromoStripEditor({
  itemId = null,
  onSuccess,
  onCancel,
}) {
  const API = process.env.NEXT_PUBLIC_API_URL || "https://api.pickob.com";
  const isEdit = !!itemId;

  const [title, setTitle] = useState("");
  const [highlightWord, setHighlightWord] = useState("");
  const [highlightColor, setHighlightColor] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [link, setLink] = useState("/");
  const [image, setImage] = useState({ url: "", public_id: "" });
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    if (!isEdit) return;
    setLoading(true);
    fetch(`${API}/api/admin/promo-strip/${itemId}`, { credentials: "include" })
      .then((r) => r.json())
      .then((b) => {
        const item = b.item || {};
        setTitle(item.title || "");
        setHighlightWord(item.highlightWord || "");
        setHighlightColor(item.highlightColor || "");
        setSubtitle(item.subtitle || "");
        setLink(item.link || "/");
        setImage(
          item.image?.url
            ? { url: item.image.url, public_id: item.image.public_id || "" }
            : { url: "", public_id: "" },
        );
        setIsActive(item.isActive !== false);
      })
      .catch((err) => alert("Failed to load: " + err.message))
      .finally(() => setLoading(false));
  }, [API, isEdit, itemId]);

  const handleImageUpload = async (file) => {
    if (!file) return;
    const previewUrl = URL.createObjectURL(file);
    setImage({ url: previewUrl, public_id: "", __uploading: true });

    try {
      const body = await uploadAdminImage(file, "Pickob/promostrip");
      setImage({ url: body.asset.url, public_id: body.asset.public_id });
      URL.revokeObjectURL(previewUrl);
    } catch (err) {
      setImage({ url: "", public_id: "" });
      alert("Image upload failed: " + err.message);
    }
  };

  const handleSave = async () => {
    if (!title.trim()) return alert("Title is required");
    setSaving(true);
    try {
      const payload = {
        title: title.trim(),
        highlightWord: highlightWord.trim(),
        highlightColor: highlightColor.trim(),
        subtitle: subtitle.trim(),
        link: link.trim() || "/",
        image: { url: image.url || "", public_id: image.public_id || "" },
        isActive,
      };
      const url = isEdit
        ? `${API}/api/admin/promo-strip/${itemId}`
        : `${API}/api/admin/promo-strip`;
      const method = isEdit ? "PUT" : "POST";

      const resp = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || "Save failed");
      onSuccess && onSuccess(data.item);
    } catch (err) {
      alert(err.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return <div className="text-center text-gray-500 py-16">Loading…</div>;

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-xl shadow p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-gray-800">
          {isEdit ? "Edit Promo Item" : "New Promo Item"}
        </h2>
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <span className="text-sm text-gray-600">Active</span>
          <div
            onClick={() => setIsActive((v) => !v)}
            className={`relative w-11 h-6 rounded-full transition-colors ${isActive ? "bg-green-500" : "bg-gray-300"}`}
          >
            <div
              className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${isActive ? "translate-x-5" : "translate-x-0"}`}
            />
          </div>
        </label>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[132px_1fr] gap-4">
        <div>
          <div
            onClick={() => fileRef.current?.click()}
            className="w-32 h-32 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden cursor-pointer hover:border-blue-400 bg-white relative"
          >
            {image.url ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={image.url}
                  alt=""
                  className="w-full h-full object-cover"
                />
                {image.__uploading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/70">
                    <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </>
            ) : (
              <div className="text-center text-gray-400 text-xs px-1">
                <div className="text-2xl mb-1">🖼️</div>
                Click to upload
              </div>
            )}
          </div>
          <input
            type="file"
            accept="image/*"
            ref={fileRef}
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleImageUpload(f);
            }}
          />
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            className="mt-1 text-[11px] text-blue-600 hover:underline block w-full text-center"
          >
            From Library
          </button>
          {image.url && !image.__uploading && (
            <button
              type="button"
              onClick={() => setImage({ url: "", public_id: "" })}
              className="mt-0.5 text-[11px] text-red-500 hover:text-red-700 block w-full text-center"
            >
              Remove
            </button>
          )}
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Main Text *
            </label>
            <input
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                // drop the highlight if its word no longer exists in the text
                const words = e.target.value.trim().split(/\s+/);
                if (highlightWord && !words.includes(highlightWord)) {
                  setHighlightWord("");
                }
              }}
              placeholder="e.g. Mega Sale"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {title.trim() && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Highlight a word (optional)
              </label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {title
                  .trim()
                  .split(/\s+/)
                  .map((word, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() =>
                        setHighlightWord((prev) =>
                          prev === word ? "" : word,
                        )
                      }
                      className={`px-2 py-1 text-xs rounded-md border transition-colors ${
                        highlightWord === word
                          ? "bg-blue-600 text-white border-blue-600"
                          : "bg-white text-gray-600 border-gray-300 hover:border-blue-400"
                      }`}
                    >
                      {word}
                    </button>
                  ))}
              </div>
              {highlightWord && (
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={highlightColor || "#e11d48"}
                    onChange={(e) => setHighlightColor(e.target.value)}
                    className="w-9 h-9 rounded border border-gray-300 cursor-pointer p-0.5"
                  />
                  <input
                    value={highlightColor}
                    onChange={(e) => setHighlightColor(e.target.value)}
                    placeholder="#e11d48"
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {highlightColor && (
                    <button
                      type="button"
                      onClick={() => setHighlightColor("")}
                      className="text-[11px] text-red-500 hover:text-red-700 whitespace-nowrap"
                    >
                      Clear
                    </button>
                  )}
                </div>
              )}
              <p className="text-[11px] text-gray-400 mt-1">
                Leave empty to keep the default gradient text style.
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Subtitle
            </label>
            <input
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              placeholder="e.g. Cashback on bKash Payments"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Link
            </label>
            <input
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="/category/deals"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      <MediaPicker
        open={pickerOpen}
        onSelect={(asset) => {
          setImage({ url: asset.url, public_id: asset.public_id || "" });
          setPickerOpen(false);
        }}
        onClose={() => setPickerOpen(false)}
      />

      <div className="flex gap-3 justify-end border-t pt-4">
        {onCancel && (
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-600"
          >
            Cancel
          </button>
        )}
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-5 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60"
        >
          {saving ? "Saving…" : isEdit ? "Save Changes" : "Create Item"}
        </button>
      </div>
    </div>
  );
}
