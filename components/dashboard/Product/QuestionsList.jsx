"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useUser } from "@/components/context/UserContext";
import { useSearchParams } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function QuestionsList() {
  const { user } = useUser();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const searchParams = useSearchParams();
  const productParam = searchParams?.get("productId") || null;
  const sortParam = searchParams?.get("sortBy") || null;

  // category filter state
  const [categories, setCategories] = useState([]);
  const [selectedMain, setSelectedMain] = useState(null);
  const [selectedSub, setSelectedSub] = useState(null);
  const [selectedChild, setSelectedChild] = useState(null);

  // sort: 'date_desc' | 'date_asc' | 'unanswered' | 'answered' | 'most_answers'
  const [sortBy, setSortBy] = useState(sortParam || "unanswered");

  useEffect(() => {
    if (sortParam) setSortBy(sortParam);
  }, [sortParam]);

  // per-row edit forms: { [key]: { open, question, officialAnswer, submitting } }
  const [editForms, setEditForms] = useState({});
  const setEditForm = (key, patch) =>
    setEditForms((prev) => ({ ...prev, [key]: { ...prev[key], ...patch } }));

  const collectIds = (node) => {
    if (!node) return [];
    let ids = [String(node._id)];
    (node.children || []).forEach((c) => {
      ids = ids.concat(collectIds(c));
    });
    return ids;
  };

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/products/admin-questions`, {
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok) setRows(data.rows || []);
      else alert(data.error || "Failed to load questions");
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, []);

  useEffect(() => {
    fetch(`${API}/api/products/categories`)
      .then((r) => r.json())
      .then((b) => setCategories(b.categories || []))
      .catch(() => setCategories([]));
  }, [API]);

  const handleDeleteQuestion = async (productId, index) => {
    if (!confirm("Delete this question and all its answers permanently?"))
      return;
    try {
      const res = await fetch(
        `${API}/api/products/admin-questions/${productId}/${index}`,
        {
          method: "DELETE",
          credentials: "include",
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Delete failed");
      fetchQuestions();
    } catch (err) {
      alert(err.message || "Failed");
    }
  };

  const handleDeleteAnswer = async (productId, qIdx, aIdx) => {
    if (!confirm("Delete this answer?")) return;
    try {
      const res = await fetch(
        `${API}/api/products/admin-questions/${productId}/${qIdx}/answers/${aIdx}`,
        {
          method: "DELETE",
          credentials: "include",
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Delete failed");
      fetchQuestions();
    } catch (err) {
      alert(err.message || "Failed");
    }
  };

  const startEdit = (row) => {
    const key = `${row.productId}-${row.index}`;
    const officialAns = (row.answers || []).find((a) => a.isOfficial);
    setEditForm(key, {
      open: true,
      question: row.question || "",
      officialAnswer: officialAns?.body || "",
    });
  };

  const cancelEdit = (key) => setEditForm(key, { open: false });

  const handleSave = async (productId, index) => {
    const key = `${productId}-${index}`;
    const form = editForms[key] || {};
    setEditForm(key, { submitting: true });
    try {
      const res = await fetch(
        `${API}/api/products/admin-questions/${productId}/${index}`,
        {
          method: "PUT",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            question: form.question,
            officialAnswer: form.officialAnswer,
          }),
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      setEditForm(key, { open: false, submitting: false });
      fetchQuestions();
    } catch (err) {
      alert(err.message || "Failed to save");
      setEditForm(key, { submitting: false });
    }
  };

  // build active category id set
  const activeCatIds = (() => {
    if (selectedChild) return new Set(collectIds(selectedChild).map(String));
    if (selectedSub) return new Set(collectIds(selectedSub).map(String));
    if (selectedMain) return new Set(collectIds(selectedMain).map(String));
    return null;
  })();

  const filtered = rows
    .filter((r) => {
      if (productParam) return String(r.productId) === String(productParam);
      if (filter) {
        const q = filter.toLowerCase();
        if (
          !r.productTitle?.toLowerCase().includes(q) &&
          !r.askerName?.toLowerCase().includes(q) &&
          !r.question?.toLowerCase().includes(q) &&
          !(r.answers || []).some((a) => a.body?.toLowerCase().includes(q))
        )
          return false;
      }
      if (activeCatIds && !activeCatIds.has(String(r.categoryId))) return false;
      return true;
    })
    .sort((a, b) => {
      const aAns = a.answers?.length || 0;
      const bAns = b.answers?.length || 0;
      if (sortBy === "date_asc")
        return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
      if (sortBy === "unanswered") {
        if ((aAns === 0) !== (bAns === 0)) return aAns === 0 ? -1 : 1;
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      }
      if (sortBy === "answered") {
        if (aAns > 0 !== bAns > 0) return aAns > 0 ? -1 : 1;
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      }
      if (sortBy === "most_answers") return bAns - aAns;
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    });

  const answeredCount = rows.filter((r) => (r.answers?.length || 0) > 0).length;
  const unansweredCount = rows.length - answeredCount;

  return (
    <div className="max-w-6xl mx-auto bg-white p-6 rounded shadow">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">
            Questions &amp; Answers
          </h2>
          <p className="text-sm text-gray-500 mt-0.5 flex flex-wrap gap-x-2 gap-y-1 items-center">
            <Link
              href="/dashboard/questions"
              className="hover:text-pink-700 hover:underline"
            >
              {rows.length} total
            </Link>
            <span>·</span>
            <Link
              href="/dashboard/questions?sortBy=answered"
              className="text-green-600 font-medium hover:underline"
            >
              {answeredCount} answered
            </Link>
            {unansweredCount > 0 && (
              <>
                <span>·</span>
                <Link
                  href="/dashboard/questions?sortBy=unanswered"
                  className="text-yellow-600 font-medium hover:underline"
                >
                  {unansweredCount} awaiting
                </Link>
              </>
            )}
          </p>
        </div>
        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Search by product, asker, question, or answer…"
          className="border px-3 py-2 rounded w-full sm:w-72 text-sm"
        />
      </div>

      {/* Category + sort filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <select
          value={selectedMain?._id || ""}
          onChange={(e) => {
            const main =
              categories.find((c) => String(c._id) === e.target.value) || null;
            setSelectedMain(main);
            setSelectedSub(null);
            setSelectedChild(null);
          }}
          className="border px-3 py-2 rounded text-sm bg-white"
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c._id} value={c._id}>
              {c.name}
            </option>
          ))}
        </select>

        <select
          value={selectedSub?._id || ""}
          onChange={(e) => {
            const sub =
              (selectedMain?.children || []).find(
                (c) => String(c._id) === e.target.value,
              ) || null;
            setSelectedSub(sub);
            setSelectedChild(null);
          }}
          className="border px-3 py-2 rounded text-sm bg-white"
          disabled={!selectedMain}
        >
          <option value="">Sub category</option>
          {(selectedMain?.children || []).map((c) => (
            <option key={c._id} value={c._id}>
              {c.name}
            </option>
          ))}
        </select>

        <select
          value={selectedChild?._id || ""}
          onChange={(e) => {
            const child =
              (selectedSub?.children || []).find(
                (c) => String(c._id) === e.target.value,
              ) || null;
            setSelectedChild(child);
          }}
          className="border px-3 py-2 rounded text-sm bg-white"
          disabled={!selectedSub}
        >
          <option value="">Sub‑sub category</option>
          {(selectedSub?.children || []).map((c) => (
            <option key={c._id} value={c._id}>
              {c.name}
            </option>
          ))}
        </select>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="border px-3 py-2 rounded text-sm bg-white ml-auto"
        >
          <option value="unanswered">Unanswered first</option>
          <option value="date_desc">Newest first</option>
          <option value="date_asc">Oldest first</option>
          <option value="answered">Answered first</option>
          <option value="most_answers">Most answers</option>
        </select>
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400">
          Loading questions…
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          {filter || activeCatIds
            ? "No questions match your filters."
            : "No questions yet."}
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((row) => {
            const key = `${row.productId}-${row.index}`;
            const form = editForms[key] || {};
            const answers = row.answers || [];
            const officialAnswer = answers.find((a) => a.isOfficial);
            const communityAnswers = answers.filter((a) => !a.isOfficial);
            const isAnswered = answers.length > 0;

            return (
              <div key={key} className="border rounded-xl overflow-hidden">
                {/* Question row */}
                <div className="flex items-start gap-3 p-4 bg-gray-50">
                  <div className="shrink-0 w-7 h-7 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-xs mt-0.5">
                    Q
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/product/${row.productId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-medium bg-green-50 text-green-700 px-2 py-0.5 rounded hover:bg-green-100 transition inline-block mb-1"
                    >
                      {row.productTitle || "Unknown Product"}
                    </Link>
                    {form.open ? (
                      <input
                        value={form.question || ""}
                        onChange={(e) =>
                          setEditForm(key, { question: e.target.value })
                        }
                        className="w-full border rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-300"
                      />
                    ) : (
                      <p className="text-gray-800 font-medium leading-snug">
                        {row.question}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-1 flex-wrap text-xs text-gray-400">
                      <span>{row.askerName || "Anonymous"}</span>
                      {row.createdAt && (
                        <span>
                          · {new Date(row.createdAt).toLocaleDateString()}
                        </span>
                      )}
                      {!isAnswered && (
                        <span className="bg-yellow-50 text-yellow-700 border border-yellow-200 rounded px-1.5 py-0.5 font-medium">
                          Awaiting answer
                        </span>
                      )}
                      {isAnswered && (
                        <span className="bg-green-50 text-green-700 border border-green-200 rounded px-1.5 py-0.5 font-medium">
                          {answers.length} answer
                          {answers.length !== 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                  </div>
                  {!form.open ? (
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => startEdit(row)}
                        className="text-xs px-3 py-1.5 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 font-medium transition"
                      >
                        {officialAnswer ? "Edit Answer" : "Answer"}
                      </button>
                      {user?.role === "admin" && (
                        <button
                          onClick={() =>
                            handleDeleteQuestion(row.productId, row.index)
                          }
                          className="text-xs px-3 py-1.5 rounded bg-red-50 text-red-600 hover:bg-red-100 font-medium transition"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => handleSave(row.productId, row.index)}
                        disabled={form.submitting}
                        className="text-xs px-3 py-1.5 rounded bg-green-600 text-white hover:bg-green-700 disabled:opacity-60 font-medium transition"
                      >
                        {form.submitting ? "Saving…" : "Save"}
                      </button>
                      <button
                        onClick={() => cancelEdit(key)}
                        className="text-xs px-3 py-1.5 rounded border text-gray-600 hover:bg-gray-50 transition"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>

                {/* Seller answer — edit textarea or view */}
                {form.open ? (
                  <div className="p-4 border-t border-green-100 bg-green-50/40">
                    <label className="text-xs font-medium text-gray-600 block mb-1">
                      Seller / Official Answer
                      <span className="ml-1 text-gray-400 font-normal">
                        (leave empty to remove)
                      </span>
                    </label>
                    <textarea
                      value={form.officialAnswer || ""}
                      onChange={(e) =>
                        setEditForm(key, { officialAnswer: e.target.value })
                      }
                      rows={4}
                      placeholder="Type the official answer here…"
                      className="w-full border rounded px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-green-300"
                    />
                  </div>
                ) : officialAnswer ? (
                  <div className="flex items-start gap-3 p-4 border-t border-green-100 bg-green-50/40">
                    <div className="shrink-0 w-7 h-7 rounded-full bg-green-600 flex items-center justify-center text-white font-bold text-xs mt-0.5">
                      A
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-xs font-semibold bg-green-600 text-white px-2 py-0.5 rounded">
                          Seller Answer
                        </span>
                        <span className="text-xs text-gray-500">
                          {officialAnswer.authorName || "Admin"}
                        </span>
                        {officialAnswer.createdAt && (
                          <span className="text-xs text-gray-400">
                            ·{" "}
                            {new Date(
                              officialAnswer.createdAt,
                            ).toLocaleDateString()}
                          </span>
                        )}
                        {officialAnswer.helpful > 0 && (
                          <span className="text-xs text-green-600">
                            · 👍 {officialAnswer.helpful}
                          </span>
                        )}
                      </div>
                      <p className="text-gray-700 text-sm leading-snug">
                        {officialAnswer.body}
                      </p>
                    </div>
                  </div>
                ) : null}

                {/* Community answers */}
                {communityAnswers.length > 0 && (
                  <div className="divide-y divide-gray-100 border-t border-gray-100">
                    <p className="px-4 py-2 text-xs font-medium text-gray-400 uppercase tracking-wide bg-white">
                      Community Answers ({communityAnswers.length})
                    </p>
                    {communityAnswers.map((ans) => {
                      const aIdx = answers.indexOf(ans);
                      return (
                        <div
                          key={aIdx}
                          className="flex items-start gap-3 p-4 bg-white"
                        >
                          <div className="shrink-0 w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs mt-0.5">
                            A
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-gray-700 text-sm leading-snug">
                              {ans.body}
                            </p>
                            <div className="flex items-center gap-2 mt-1 text-xs text-gray-400 flex-wrap">
                              <span>{ans.authorName || "Anonymous"}</span>
                              {ans.createdAt && (
                                <span>
                                  ·{" "}
                                  {new Date(ans.createdAt).toLocaleDateString()}
                                </span>
                              )}
                              {ans.helpful > 0 && (
                                <span className="text-green-600">
                                  · 👍 {ans.helpful} helpful
                                </span>
                              )}
                            </div>
                          </div>
                          {user?.role === "admin" && (
                            <button
                              onClick={() =>
                                handleDeleteAnswer(
                                  row.productId,
                                  row.index,
                                  aIdx,
                                )
                              }
                              className="shrink-0 text-xs px-2 py-1 rounded bg-red-50 text-red-500 hover:bg-red-100 transition"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
