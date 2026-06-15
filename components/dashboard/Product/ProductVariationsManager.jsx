"use client";

import React, { useEffect, useMemo, useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const emptyForm = { name: "", optionsText: "" };

const normalizeVariation = (item) => ({
  id: item.id || item._id,
  name: item.name || "",
  options: (item.options || []).map((option) => ({
    id: option.id || option._id,
    value: option.value || "",
  })),
});

export default function ProductVariationsManager() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [search, setSearch] = useState("");

  const options = useMemo(
    () =>
      form.optionsText
        .split("\n")
        .map((value) => value.trim())
        .filter(Boolean)
        .map((value) => ({ value })),
    [form.optionsText],
  );

  const visibleItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => {
      const values = (item.options || []).map((option) => option.value).join(" ");
      return `${item.name} ${values}`.toLowerCase().includes(q);
    });
  }, [items, search]);

  const fetchVariations = async () => {
    setLoading(true);
    try {
      const resp = await fetch(`${API}/api/admin/variations?per_page=50`, {
        credentials: "include",
      });
      const data = await resp.json();
      const list = data.result?.data || data.variations || [];
      setItems(list.map(normalizeVariation));
    } catch (err) {
      setMessage({ type: "error", text: err.message || "Failed to load variations." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVariations();
  }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setFormOpen(true);
  };

  const openEdit = (item) => {
    setEditingId(item.id);
    setForm({
      name: item.name,
      optionsText: (item.options || []).map((option) => option.value).join("\n"),
    });
    setFormOpen(true);
  };

  const closeForm = () => {
    setEditingId(null);
    setForm(emptyForm);
    setFormOpen(false);
  };

  const saveVariation = async (e) => {
    e.preventDefault();
    const name = form.name.trim();
    if (!name) {
      setMessage({ type: "error", text: "Variation name is required." });
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      const resp = await fetch(
        `${API}/api/admin/variations${editingId ? `/${editingId}` : ""}`,
        {
          method: editingId ? "PUT" : "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, options }),
        },
      );
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || "Save failed.");
      setMessage({ type: "success", text: editingId ? "Variation updated." : "Variation created." });
      closeForm();
      fetchVariations();
    } catch (err) {
      setMessage({ type: "error", text: err.message || "Save failed." });
    } finally {
      setSaving(false);
    }
  };

  const deleteVariation = async (id) => {
    if (!confirm("Delete this product variation?")) return;
    try {
      const resp = await fetch(`${API}/api/admin/variations/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || "Delete failed.");
      setMessage({ type: "success", text: "Variation deleted." });
      fetchVariations();
      if (editingId === id) closeForm();
    } catch (err) {
      setMessage({ type: "error", text: err.message || "Delete failed." });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-7xl px-4">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-bold text-gray-950">Variations</h1>
          <button
            type="button"
            onClick={openCreate}
            className="rounded-xl bg-gray-950 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-black"
          >
            + Create Variation
          </button>
        </div>

        {message && (
          <p
            className={`mb-4 rounded-xl px-4 py-3 text-sm ${
              message.type === "success"
                ? "bg-green-50 text-green-700"
                : "bg-red-50 text-red-700"
            }`}
          >
            {message.text}
          </p>
        )}

        {formOpen && (
          <form
            onSubmit={saveVariation}
            className="mb-5 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                {editingId ? "Edit Variation" : "Create Variation"}
              </h2>
              <button
                type="button"
                onClick={closeForm}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
              >
                Close
              </button>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-[20rem_minmax(0,1fr)_auto] md:items-start">
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Variation Name
                </label>
                <input
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Style"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Values
                </label>
                <textarea
                  value={form.optionsText}
                  onChange={(e) => setForm((prev) => ({ ...prev, optionsText: e.target.value }))}
                  className="min-h-24 w-full rounded-lg border border-gray-300 px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder={"Regular Fit\nSlim Fit\nOversized"}
                />
                <p className="mt-1 text-xs text-gray-500">One value per line.</p>
              </div>
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60 md:mt-7"
              >
                {saving ? "Saving..." : editingId ? "Update" : "Save"}
              </button>
            </div>
          </form>
        )}

        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 px-5 py-4">
            <h2 className="text-base font-semibold text-gray-900">All Variations</h2>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-64 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Search"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="bg-gray-100 text-left text-gray-900">
                <tr>
                  <th className="px-5 py-3 font-semibold">Variations</th>
                  <th className="px-5 py-3 font-semibold">Values</th>
                  <th className="px-5 py-3 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={3} className="px-5 py-10 text-center text-gray-500">
                      Loading variations...
                    </td>
                  </tr>
                ) : visibleItems.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-5 py-10 text-center text-gray-500">
                      No variations found.
                    </td>
                  </tr>
                ) : (
                  visibleItems.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-5 py-3 font-medium text-gray-900">{item.name}</td>
                      <td className="px-5 py-3 text-gray-700">
                        {(item.options || []).map((option) => option.value).join(", ")}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => openEdit(item)}
                            className="rounded-full border border-gray-300 px-3 py-1 text-xs font-semibold text-green-700 hover:bg-green-50"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteVariation(item.id)}
                            className="rounded-full border border-gray-300 px-3 py-1 text-xs font-semibold text-red-600 hover:bg-red-50"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between border-t border-gray-200 px-5 py-4 text-sm text-gray-600">
            <span>
              Showing {visibleItems.length ? 1 : 0} to {visibleItems.length} of {visibleItems.length}
            </span>
            <span className="rounded-lg bg-gray-950 px-3 py-1 text-white">1</span>
          </div>
        </div>
      </div>
    </div>
  );
}
