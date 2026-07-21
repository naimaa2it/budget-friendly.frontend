"use client";

import React, { useEffect, useState } from "react";
import { useUser } from "@/components/context/UserContext";

const emptyForm = { label: "", value: "" };

export default function ChargeList({ title, description, apiPath, noun }) {
  const { user } = useUser();
  const API = process.env.NEXT_PUBLIC_API_URL || "https://api.pickob.com";
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadItems = async () => {
    setLoading(true);
    try {
      const resp = await fetch(`${API}/api/admin/${apiPath}`, {
        credentials: "include",
      });
      const body = await resp.json();
      if (!resp.ok) throw new Error(body.error || `Failed to load ${noun}s`);
      setItems(body.items || []);
    } catch (err) {
      alert(err.message || `Failed to load ${noun}s`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const saveItem = async (e) => {
    e.preventDefault();
    if (form.value === "" || isNaN(Number(form.value))) {
      alert("Please enter an amount");
      return;
    }
    const label = form.label.trim() || form.value;
    setSaving(true);
    try {
      const resp = await fetch(
        editingId
          ? `${API}/api/admin/${apiPath}/${editingId}`
          : `${API}/api/admin/${apiPath}`,
        {
          method: editingId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            label,
            value: Number(form.value),
          }),
        },
      );
      const body = await resp.json();
      if (!resp.ok) throw new Error(body.error || "Save failed");
      resetForm();
      loadItems();
    } catch (err) {
      alert(err.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const deleteItem = async (id) => {
    if (!confirm(`Delete this ${noun}?`)) return;
    try {
      const resp = await fetch(`${API}/api/admin/${apiPath}/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const body = await resp.json();
      if (!resp.ok) throw new Error(body.error || "Delete failed");
      loadItems();
    } catch (err) {
      alert(err.message || "Delete failed");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
        <p className="mt-1 text-sm text-gray-500">{description}</p>
      </div>

      <form
        onSubmit={saveItem}
        className="grid gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4 md:grid-cols-[1fr_10rem_auto]"
      >
        <input
          value={form.label}
          onChange={(e) => setForm((p) => ({ ...p, label: e.target.value }))}
          className="rounded border border-gray-300 px-3 py-2"
          placeholder="Label (e.g. Standard, Express)"
        />
        <input
          type="number"
          step="0.01"
          value={form.value}
          onChange={(e) => setForm((p) => ({ ...p, value: e.target.value }))}
          className="rounded border border-gray-300 px-3 py-2"
          placeholder="Amount"
        />
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={saving}
            className="rounded bg-indigo-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {saving ? "Saving..." : editingId ? "Update" : "Add"}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="rounded border border-gray-300 px-4 py-2 text-sm"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      {loading ? (
        <div className="py-8 text-center text-gray-500">Loading...</div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-4 py-3">Label</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {items.map((item) => (
                  <tr key={item._id}>
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {item.label}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {Number(item.value).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(item._id);
                          setForm({
                            label: item.label || "",
                            value: item.value ?? "",
                          });
                        }}
                        className="mr-2 rounded border border-gray-300 px-3 py-1.5 text-sm"
                      >
                        Edit
                      </button>
                      {user?.role === "admin" && (
                        <button
                          type="button"
                          onClick={() => deleteItem(item._id)}
                          className="rounded border border-red-300 px-3 py-1.5 text-sm text-red-600"
                        >
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {!items.length && (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-4 py-8 text-center text-gray-500"
                    >
                      No {noun}s yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
