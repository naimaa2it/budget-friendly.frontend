"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default function QuestionsList() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  // category filter state
  const [categories, setCategories] = useState([]);
  const [selectedMain, setSelectedMain] = useState(null);
  const [selectedSub, setSelectedSub] = useState(null);
  const [selectedChild, setSelectedChild] = useState(null);

  // sort: 'date_desc' | 'date_asc' | 'unanswered' | 'answered' | 'helpful_desc'
  const [sortBy, setSortBy] = useState('date_desc');

  // editing state
  const [editingKey, setEditingKey] = useState(null); // "productId-index"
  const [editForm, setEditForm] = useState({ question: '', answer: '' });
  const [saving, setSaving] = useState(false);

  const collectIds = node => {
    if (!node) return [];
    let ids = [String(node._id)];
    (node.children || []).forEach(c => { ids = ids.concat(collectIds(c)); });
    return ids;
  };

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/products/admin-questions`, { credentials: 'include' });
      const data = await res.json();
      if (res.ok) setRows(data.rows || []);
      else alert(data.error || 'Failed to load questions');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchQuestions(); }, []);

  useEffect(() => {
    fetch(`${API}/api/products/categories`)
      .then(r => r.json())
      .then(b => setCategories(b.categories || []))
      .catch(() => setCategories([]));
  }, [API]);

  const handleDelete = async (productId, index) => {
    if (!confirm('Delete this question permanently?')) return;
    try {
      const res = await fetch(`${API}/api/products/admin-questions/${productId}/${index}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Delete failed');
      fetchQuestions();
    } catch (err) {
      alert(err.message || 'Failed');
    }
  };

  const startEdit = (row) => {
    setEditingKey(`${row.productId}-${row.index}`);
    setEditForm({ question: row.question || '', answer: row.answer || '' });
  };

  const cancelEdit = () => {
    setEditingKey(null);
    setEditForm({ question: '', answer: '' });
  };

  const handleSave = async (productId, index) => {
    setSaving(true);
    try {
      const res = await fetch(`${API}/api/products/admin-questions/${productId}/${index}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Save failed');
      setEditingKey(null);
      fetchQuestions();
    } catch (err) {
      alert(err.message || 'Failed to save');
    } finally {
      setSaving(false);
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
    .filter(r => {
      if (filter) {
        const q = filter.toLowerCase();
        if (
          !r.productTitle?.toLowerCase().includes(q) &&
          !r.askerName?.toLowerCase().includes(q) &&
          !r.question?.toLowerCase().includes(q) &&
          !r.answer?.toLowerCase().includes(q)
        ) return false;
      }
      if (activeCatIds && !activeCatIds.has(String(r.categoryId))) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'date_asc') return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
      if (sortBy === 'unanswered') {
        if (!!a.answer !== !!b.answer) return a.answer ? 1 : -1;
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      }
      if (sortBy === 'answered') {
        if (!!a.answer !== !!b.answer) return a.answer ? -1 : 1;
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      }
      if (sortBy === 'helpful_desc') return (b.helpful || 0) - (a.helpful || 0);
      // date_desc (default)
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    });

  const answeredCount = rows.filter(r => r.answer).length;
  const unansweredCount = rows.length - answeredCount;

  return (
    <div className="max-w-6xl mx-auto bg-white p-6 rounded shadow">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">Questions &amp; Answers</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {rows.length} total &nbsp;·&nbsp;
            <span className="text-green-600 font-medium">{answeredCount} answered</span>
            {unansweredCount > 0 && (
              <span className="ml-1 text-yellow-600 font-medium">&nbsp;·&nbsp; {unansweredCount} awaiting</span>
            )}
          </p>
        </div>
        <input
          value={filter}
          onChange={e => setFilter(e.target.value)}
          placeholder="Search by product, asker, or question…"
          className="border px-3 py-2 rounded w-full sm:w-72 text-sm"
        />
      </div>

      {/* Category + sort filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <select
          value={selectedMain?._id || ''}
          onChange={e => {
            const main = categories.find(c => String(c._id) === e.target.value) || null;
            setSelectedMain(main); setSelectedSub(null); setSelectedChild(null);
          }}
          className="border px-3 py-2 rounded text-sm bg-white"
        >
          <option value="">All categories</option>
          {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
        </select>

        <select
          value={selectedSub?._id || ''}
          onChange={e => {
            const sub = (selectedMain?.children || []).find(c => String(c._id) === e.target.value) || null;
            setSelectedSub(sub); setSelectedChild(null);
          }}
          className="border px-3 py-2 rounded text-sm bg-white"
          disabled={!selectedMain}
        >
          <option value="">Sub category</option>
          {(selectedMain?.children || []).map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
        </select>

        <select
          value={selectedChild?._id || ''}
          onChange={e => {
            const child = (selectedSub?.children || []).find(c => String(c._id) === e.target.value) || null;
            setSelectedChild(child);
          }}
          className="border px-3 py-2 rounded text-sm bg-white"
          disabled={!selectedSub}
        >
          <option value="">Sub‑sub category</option>
          {(selectedSub?.children || []).map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
        </select>

        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value)}
          className="border px-3 py-2 rounded text-sm bg-white ml-auto"
        >
          <option value="date_desc">Newest first</option>
          <option value="date_asc">Oldest first</option>
          <option value="unanswered">Unanswered first</option>
          <option value="answered">Answered first</option>
          <option value="helpful_desc">Most helpful</option>
        </select>
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400">Loading questions…</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          {filter || activeCatIds ? 'No questions match your filters.' : 'No questions yet.'}
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(row => {
            const key = `${row.productId}-${row.index}`;
            const isEditing = editingKey === key;
            const isAnswered = !!row.answer;
            return (
              <div key={key} className="border rounded-xl overflow-hidden">

                {/* Question row */}
                <div className="flex items-start gap-3 p-4 bg-gray-50">
                  <div className="flex-shrink-0 w-7 h-7 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-xs mt-0.5">Q</div>
                  <div className="flex-1 min-w-0">
                    {/* Product link */}
                    <Link
                      href={`/product/${row.productId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-medium bg-green-50 text-green-700 px-2 py-0.5 rounded hover:bg-green-100 transition inline-block mb-1"
                    >
                      {row.productTitle || 'Unknown Product'}
                    </Link>
                    {!isEditing && (
                      <p className="text-gray-800 font-medium leading-snug">{row.question}</p>
                    )}
                    <div className="flex items-center gap-2 mt-1 flex-wrap text-xs text-gray-400">
                      <span>{row.askerName || 'Anonymous'}</span>
                      {row.createdAt && <span>· {new Date(row.createdAt).toLocaleDateString()}</span>}
                      {row.helpful > 0 && (
                        <span className="text-green-600">· 👍 {row.helpful} helpful</span>
                      )}
                      {!isAnswered && (
                        <span className="bg-yellow-50 text-yellow-700 border border-yellow-200 rounded px-1.5 py-0.5 font-medium">Awaiting answer</span>
                      )}
                      {isAnswered && (
                        <span className="bg-green-50 text-green-700 border border-green-200 rounded px-1.5 py-0.5 font-medium">Answered</span>
                      )}
                    </div>
                  </div>
                  {!isEditing && (
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => startEdit(row)}
                        className="text-xs px-3 py-1.5 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 font-medium transition"
                      >
                        {isAnswered ? 'Edit' : 'Answer'}
                      </button>
                      <button
                        onClick={() => handleDelete(row.productId, row.index)}
                        className="text-xs px-3 py-1.5 rounded bg-red-50 text-red-600 hover:bg-red-100 font-medium transition"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>

                {/* Answer row (view or edit form) */}
                {isEditing ? (
                  <div className="p-4 border-t border-gray-100 bg-white space-y-3">
                    <div>
                      <label className="text-xs font-medium text-gray-600 block mb-1">Question</label>
                      <input
                        type="text"
                        value={editForm.question}
                        onChange={e => setEditForm(f => ({ ...f, question: e.target.value }))}
                        className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-300"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-600 block mb-1">Answer</label>
                      <textarea
                        value={editForm.answer}
                        onChange={e => setEditForm(f => ({ ...f, answer: e.target.value }))}
                        rows={4}
                        placeholder="Type your answer here…"
                        className="w-full border rounded px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-green-300"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSave(row.productId, row.index)}
                        disabled={saving}
                        className="text-sm px-4 py-1.5 rounded bg-green-600 text-white hover:bg-green-700 disabled:opacity-60 font-medium transition"
                      >
                        {saving ? 'Saving…' : 'Save'}
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="text-sm px-4 py-1.5 rounded border text-gray-600 hover:bg-gray-50 transition"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : isAnswered ? (
                  <div className="flex items-start gap-3 p-4 border-t border-gray-100 bg-white">
                    <div className="flex-shrink-0 w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs mt-0.5">A</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-700 leading-snug text-sm">{row.answer}</p>
                      {(row.answeredBy || row.answeredAt) && (
                        <p className="text-xs text-gray-400 mt-1">
                          by <span className="font-medium text-gray-600">{row.answeredBy || 'Admin'}</span>
                          {row.answeredAt && <span> · {new Date(row.answeredAt).toLocaleDateString()}</span>}
                        </p>
                      )}
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
