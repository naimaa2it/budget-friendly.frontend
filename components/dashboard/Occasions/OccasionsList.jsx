"use client";

import React, { useState, useEffect, useCallback } from "react";
import OccasionEditor from "./OccasionEditor";
import { useUser } from "@/components/context/UserContext";

export default function OccasionsList() {
  const API = process.env.NEXT_PUBLIC_API_URL || "https://api.pickob.com";
  const { user } = useUser();
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("list"); // 'list' | 'create' | 'edit'
  const [editId, setEditId] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    fetch(`${API}/api/admin/occasions`, { credentials: "include" })
      .then((r) => r.json())
      .then((b) => setSections(b.items || []))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [API]);

  useEffect(() => {
    load();
  }, [load]);

  const handleToggleActive = async (section) => {
    try {
      const resp = await fetch(`${API}/api/admin/occasions/${section._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ isActive: !section.isActive }),
      });
      if (!resp.ok) throw new Error("Failed");
      setSections((prev) =>
        prev.map((s) =>
          s._id === section._id ? { ...s, isActive: !s.isActive } : s,
        ),
      );
    } catch {
      alert("Failed to update");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this occasion section? This cannot be undone."))
      return;
    setDeleting(id);
    try {
      const resp = await fetch(`${API}/api/admin/occasions/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!resp.ok) throw new Error("Failed");
      setSections((prev) => prev.filter((s) => s._id !== id));
    } catch {
      alert("Delete failed");
    } finally {
      setDeleting(null);
    }
  };

  const handleMoveOrder = async (idx, dir) => {
    const next = [...sections];
    const swap = idx + dir;
    if (swap < 0 || swap >= next.length) return;
    [next[idx], next[swap]] = [next[swap], next[idx]];
    const updated = next.map((s, i) => ({ ...s, order: i }));
    setSections(updated);
    try {
      await fetch(`${API}/api/admin/occasions-reorder`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(
          updated.map((s) => ({ _id: s._id, order: s.order })),
        ),
      });
    } catch {
      alert("Reorder failed");
    }
  };

  // ── Editor views ────────────────────────────────────────────────────────────
  if (view === "create")
    return (
      <OccasionEditor
        onSuccess={() => {
          load();
          setView("list");
        }}
        onCancel={() => setView("list")}
      />
    );

  if (view === "edit" && editId)
    return (
      <OccasionEditor
        sectionId={editId}
        onSuccess={() => {
          load();
          setView("list");
          setEditId(null);
        }}
        onCancel={() => {
          setView("list");
          setEditId(null);
        }}
      />
    );

  // ── List view ───────────────────────────────────────────────────────────────
  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Occasion Sections</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Manage festival / occasion mini-banner sections shown on the
            homepage.
          </p>
        </div>
        <button
          onClick={() => setView("create")}
          className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 shrink-0"
        >
          + New Section
        </button>
      </div>

      {loading ? (
        <div className="text-center text-gray-400 py-16">Loading…</div>
      ) : sections.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-xl">
          <p className="text-gray-500 mb-3">No occasion sections yet.</p>
          <button
            onClick={() => setView("create")}
            className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Create your first section
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {sections.map((section, idx) => (
            <div
              key={section._id}
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
                  disabled={idx === sections.length - 1}
                  className="text-gray-400 hover:text-gray-700 disabled:opacity-20 text-xs leading-none p-0.5"
                >
                  ▼
                </button>
              </div>

              {/* Preview thumbnails */}
              <div className="flex gap-1 shrink-0">
                {section.cards?.slice(0, 4).map((card, ci) => (
                  <div
                    key={ci}
                    className="w-10 h-8 rounded overflow-hidden bg-gray-100 border border-gray-200"
                  >
                    {card.image?.url ? (
                      <img
                        src={card.image.url}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">
                        ?
                      </div>
                    )}
                  </div>
                ))}
                {(section.cards?.length || 0) > 4 && (
                  <div className="w-10 h-8 rounded bg-gray-100 border border-gray-200 flex items-center justify-center text-xs text-gray-500">
                    +{section.cards.length - 4}
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-800 truncate">
                  {section.title}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {section.cards?.length || 0} card
                  {section.cards?.length !== 1 ? "s" : ""} · View All →{" "}
                  {section.viewAllLink}
                </p>
              </div>

              {/* Active toggle */}
              <div
                onClick={() => handleToggleActive(section)}
                className={`relative w-10 h-5 rounded-full cursor-pointer transition-colors shrink-0 ${section.isActive ? "bg-green-500" : "bg-gray-300"}`}
              >
                <div
                  className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${section.isActive ? "translate-x-5" : "translate-x-0"}`}
                />
              </div>

              {/* Edit / Delete */}
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => {
                    setEditId(section._id);
                    setView("edit");
                  }}
                  className="text-blue-600 hover:text-blue-800 text-sm px-3 py-1.5 border border-blue-200 rounded-lg hover:bg-blue-50"
                >
                  Edit
                </button>
                {user?.role === "admin" && (
                  <button
                    onClick={() => handleDelete(section._id)}
                    disabled={deleting === section._id}
                    className="text-red-500 hover:text-red-700 text-sm px-3 py-1.5 border border-red-200 rounded-lg hover:bg-red-50 disabled:opacity-50"
                  >
                    {deleting === section._id ? "…" : "Delete"}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
