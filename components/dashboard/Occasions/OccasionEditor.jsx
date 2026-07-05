"use client";

import React, { useState, useEffect, useRef } from "react";
import MediaPicker from "@/components/dashboard/MediaPicker";
import { uploadAdminImage } from "@/lib/uploadImage";

const EMPTY_CARD = {
  image: { url: "", public_id: "" },
  subtitle: "",
  label: "",
  link: "/",
};

export default function OccasionEditor({
  sectionId = null,
  onSuccess,
  onCancel,
}) {
  const API = process.env.NEXT_PUBLIC_API_URL || "https://api.pickob.com";
  const isEdit = !!sectionId;

  const [title, setTitle] = useState("");
  const [titleBn, setTitleBn] = useState("");
  const [viewAllLink, setViewAllLink] = useState("/");
  const [isActive, setIsActive] = useState(true);
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pickerIdx, setPickerIdx] = useState(null); // which card index has picker open
  const fileRefs = useRef({});

  // Load existing section if editing
  useEffect(() => {
    if (!isEdit) return;
    setLoading(true);
    fetch(`${API}/api/admin/occasions/${sectionId}`, { credentials: "include" })
      .then((r) => r.json())
      .then((b) => {
        const s = b.section || {};
        setTitle(s.title || "");
        setTitleBn(s.titleBn || "");
        setViewAllLink(s.viewAllLink || "/");
        setIsActive(s.isActive !== false);
        setCards((s.cards || []).map((c) => ({ ...c })));
      })
      .catch((err) => alert("Failed to load: " + err.message))
      .finally(() => setLoading(false));
  }, [sectionId, isEdit, API]);

  // ── Card helpers ───────────────────────────────────────────────────────────

  const addCard = () =>
    setCards((prev) => [
      ...prev,
      { ...EMPTY_CARD, image: { url: "", public_id: "" } },
    ]);

  const removeCard = (idx) =>
    setCards((prev) => prev.filter((_, i) => i !== idx));

  const moveCard = (idx, dir) => {
    setCards((prev) => {
      const next = [...prev];
      const swap = idx + dir;
      if (swap < 0 || swap >= next.length) return next;
      [next[idx], next[swap]] = [next[swap], next[idx]];
      return next;
    });
  };

  const updateCard = (idx, field, value) => {
    setCards((prev) =>
      prev.map((c, i) => (i === idx ? { ...c, [field]: value } : c)),
    );
  };

  // Upload image for a specific card
  const handleCardImageUpload = async (idx, file) => {
    if (!file) return;
    const previewUrl = URL.createObjectURL(file);
    updateCard(idx, "image", {
      url: previewUrl,
      public_id: "",
      __uploading: true,
    });

    try {
      const body = await uploadAdminImage(file, "Pickob/occasions");
      updateCard(idx, "image", {
        url: body.asset.url,
        public_id: body.asset.public_id,
      });
      URL.revokeObjectURL(previewUrl);
    } catch (err) {
      updateCard(idx, "image", { url: "", public_id: "" });
      alert("Image upload failed: " + err.message);
    }
  };

  // ── Save ───────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!title.trim()) return alert("Section title is required");
    setSaving(true);
    try {
      const cleanCards = cards.map(({ __uploading, ...c }) => ({
        image: { url: c.image?.url || "", public_id: c.image?.public_id || "" },
        subtitle: c.subtitle || "",
        label: c.label || "",
        link: c.link || "/",
      }));

      const payload = {
        title: title.trim(),
        titleBn: titleBn.trim(),
        viewAllLink,
        isActive,
        cards: cleanCards,
      };
      const url = isEdit
        ? `${API}/api/admin/occasions/${sectionId}`
        : `${API}/api/admin/occasions`;
      const method = isEdit ? "PUT" : "POST";

      const resp = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || "Save failed");
      onSuccess && onSuccess(data.section);
    } catch (err) {
      alert(err.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <div className="flex items-center justify-center h-40 text-gray-500">
        Loading…
      </div>
    );

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-xl shadow p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800">
          {isEdit ? "Edit Occasion Section" : "New Occasion Section"}
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

      {/* Title & View All */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Section Title * (English)
          </label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Eid Fest on Kitchen Appliances!"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Section Title (বাংলা)
          </label>
          <input
            value={titleBn}
            onChange={(e) => setTitleBn(e.target.value)}
            placeholder="যেমন: ঈদ ফেস্ট - রান্নাঘর যন্ত্রপাতি!"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            View All Link
          </label>
          <input
            value={viewAllLink}
            onChange={(e) => setViewAllLink(e.target.value)}
            placeholder="/category/kitchen"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Cards */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-semibold text-gray-700">
            Cards ({cards.length})
          </h3>
          <button
            onClick={addCard}
            className="flex items-center gap-1.5 bg-blue-600 text-white text-sm px-3 py-1.5 rounded-lg hover:bg-blue-700"
          >
            <span className="text-lg leading-none">+</span> Add Card
          </button>
        </div>

        {cards.length === 0 && (
          <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center text-gray-400 text-sm">
            No cards yet — click "Add Card" to add occasion category cards.
          </div>
        )}

        <div className="space-y-4">
          {cards.map((card, idx) => (
            <div
              key={idx}
              className="border border-gray-200 rounded-xl p-4 bg-gray-50"
            >
              <div className="flex items-start gap-4">
                {/* Image upload + preview */}
                <div className="shrink-0">
                  <div
                    onClick={() => fileRefs.current[idx]?.click()}
                    className="w-28 h-24 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden cursor-pointer hover:border-blue-400 bg-white relative"
                  >
                    {card.image?.url ? (
                      <>
                        <img
                          src={card.image.url}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                        {card.image.__uploading && (
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
                    ref={(el) => (fileRefs.current[idx] = el)}
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleCardImageUpload(idx, f);
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setPickerIdx(idx)}
                    className="mt-1 text-[10px] text-blue-600 hover:underline block w-full text-center"
                  >
                    From Library
                  </button>
                  {card.image?.url && !card.image.__uploading && (
                    <button
                      onClick={() =>
                        updateCard(idx, "image", { url: "", public_id: "" })
                      }
                      className="mt-0.5 text-[10px] text-red-500 hover:text-red-700 block w-full text-center"
                    >
                      Remove
                    </button>
                  )}
                </div>

                {/* Fields */}
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-gray-600">
                      Category Label *
                    </label>
                    <input
                      value={card.label}
                      onChange={(e) => updateCard(idx, "label", e.target.value)}
                      placeholder="e.g. Air Conditioners"
                      className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600">
                      Link
                    </label>
                    <input
                      value={card.link}
                      onChange={(e) => updateCard(idx, "link", e.target.value)}
                      placeholder="/category/air-conditioners"
                      className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-xs font-medium text-gray-600">
                      Subtitle / Offer text
                    </label>
                    <input
                      value={card.subtitle}
                      onChange={(e) =>
                        updateCard(idx, "subtitle", e.target.value)
                      }
                      placeholder="e.g. Up to 29% OFF | Starting from ৳35,990"
                      className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-1 ml-2">
                  <button
                    onClick={() => moveCard(idx, -1)}
                    disabled={idx === 0}
                    className="p-1 rounded hover:bg-gray-200 disabled:opacity-30 text-gray-500 text-sm"
                    title="Move up"
                  >
                    ▲
                  </button>
                  <button
                    onClick={() => moveCard(idx, 1)}
                    disabled={idx === cards.length - 1}
                    className="p-1 rounded hover:bg-gray-200 disabled:opacity-30 text-gray-500 text-sm"
                    title="Move down"
                  >
                    ▼
                  </button>
                  <button
                    onClick={() => removeCard(idx)}
                    className="p-1 rounded hover:bg-red-100 text-red-500 text-sm"
                    title="Delete card"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Media Picker for card images */}
      <MediaPicker
        open={pickerIdx !== null}
        onSelect={(asset) => {
          if (pickerIdx !== null) {
            updateCard(pickerIdx, "image", {
              url: asset.url,
              public_id: asset.public_id,
            });
            setPickerIdx(null);
          }
        }}
        onClose={() => setPickerIdx(null)}
      />

      {/* Footer buttons */}
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
          {saving ? "Saving…" : isEdit ? "Save Changes" : "Create Section"}
        </button>
      </div>
    </div>
  );
}
