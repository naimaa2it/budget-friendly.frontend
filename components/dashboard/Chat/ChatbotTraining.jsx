"use client";

import React, { useCallback, useEffect, useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "https://api.pickob.com";

const emptyForm = { question: "", answer: "", tags: "", enabled: true };

export default function ChatbotTraining() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    fetch(`${API}/api/chat/training`, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        setItems(d.items || []);
      })
      .catch(() => setError("Load korte parini. Abar try korun."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setError("");
  };

  const submit = (e) => {
    e.preventDefault();
    if (!form.question.trim() || !form.answer.trim()) {
      setError("Question and answer both required.");
      return;
    }
    setSaving(true);
    setError("");
    const payload = {
      question: form.question.trim(),
      answer: form.answer.trim(),
      tags: form.tags
        ? form.tags.split(",").map((t) => t.trim()).filter(Boolean)
        : [],
      enabled: form.enabled,
    };
    const url = editingId
      ? `${API}/api/chat/training/${editingId}`
      : `${API}/api/chat/training`;
    fetch(url, {
      method: editingId ? "PUT" : "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.error) throw new Error(d.error);
        resetForm();
        load();
      })
      .catch((err) => setError(err.message || "Save failed"))
      .finally(() => setSaving(false));
  };

  const edit = (item) => {
    setEditingId(item._id);
    setForm({
      question: item.question,
      answer: item.answer,
      tags: (item.tags || []).join(", "),
      enabled: item.enabled !== false,
    });
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const toggleEnabled = (item) => {
    fetch(`${API}/api/chat/training/${item._id}`, {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled: !item.enabled }),
    })
      .then((r) => r.json())
      .then(() => load())
      .catch(() => {});
  };

  const remove = (item) => {
    if (!window.confirm("Ei Q&A ta delete korbo?")) return;
    fetch(`${API}/api/chat/training/${item._id}`, {
      method: "DELETE",
      credentials: "include",
    })
      .then((r) => r.json())
      .then(() => load())
      .catch(() => {});
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-800">Chatbot Training</h1>
        <p className="mt-1 text-sm text-gray-500">
          Support chatbot ke train korun — question ar answer add korun. Customer
          Bangla / English / Banglish je keyword likhbe, bot sei onujayi ei answer
          theke reply debe. Product khoja, price bola ar order neowa bot nijei
          DB theke kore — kono taka/API lage na (100% free).
        </p>
      </div>

      {/* Form */}
      <form
        onSubmit={submit}
        className="space-y-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700">
            {editingId ? "Q&A edit korun" : "Notun Q&A add korun"}
          </h2>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              Cancel
            </button>
          )}
        </div>

        <input
          value={form.question}
          onChange={(e) => setForm({ ...form, question: e.target.value })}
          placeholder="Question — jemon: Delivery charge koto?"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
        />
        <textarea
          value={form.answer}
          onChange={(e) => setForm({ ...form, answer: e.target.value })}
          placeholder="Answer — jemon: Dhaka'r moddhe 60-80৳, baire 120-150৳. COD available."
          rows={3}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
        />
        <input
          value={form.tags}
          onChange={(e) => setForm({ ...form, tags: e.target.value })}
          placeholder="Tags (optional, comma separated) — delivery, shipping"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
        />

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={form.enabled}
              onChange={(e) => setForm({ ...form, enabled: e.target.checked })}
            />
            Enabled
          </label>
          {error && <span className="text-xs text-red-600">{error}</span>}
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? "Saving…" : editingId ? "Update" : "Add Q&A"}
          </button>
        </div>
      </form>

      {/* List */}
      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-gray-700">
          Trained Q&A ({items.length})
        </h2>
        {loading ? (
          <p className="text-sm text-gray-400">Loading…</p>
        ) : items.length === 0 ? (
          <p className="rounded-lg border border-dashed border-gray-300 p-6 text-center text-sm text-gray-400">
            Ekhono kono Q&A add kora hoyni.
          </p>
        ) : (
          items.map((item) => (
            <div
              key={item._id}
              className={`rounded-xl border bg-white p-4 shadow-sm ${
                item.enabled ? "border-gray-200" : "border-gray-200 opacity-60"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-800">
                    {item.question}
                  </p>
                  <p className="mt-1 whitespace-pre-line text-sm text-gray-600">
                    {item.answer}
                  </p>
                  {item.tags?.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {item.tags.map((t) => (
                        <span
                          key={t}
                          className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] text-gray-500"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <button
                    onClick={() => toggleEnabled(item)}
                    className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                      item.enabled
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {item.enabled ? "On" : "Off"}
                  </button>
                  <div className="flex gap-2 text-xs">
                    <button
                      onClick={() => edit(item)}
                      className="text-blue-600 hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => remove(item)}
                      className="text-red-600 hover:underline"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
