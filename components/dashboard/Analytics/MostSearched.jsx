"use client";

import React, { useCallback, useEffect, useState } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

function timeAgo(date) {
  if (!date) return '—';
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function MostSearched() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [limit, setLimit] = useState(20);
  const [deletingId, setDeletingId] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API}/api/analytics/most-searched?limit=${limit}`, {
        credentials: 'include',
      });
      const body = await res.json();
      if (!res.ok) { setError(body?.error || 'Failed to load'); return; }
      setItems(body.items || []);
    } catch {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleDelete = async (item) => {
    if (!confirm(`Delete search term "${item.term}"? This cannot be undone.`)) return;
    setDeletingId(item._id);
    try {
      const res = await fetch(`${API}/api/analytics/most-searched/${item._id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const body = await res.json();
      if (!res.ok) { alert(body?.error || 'Failed to delete'); return; }
      setItems((prev) => prev.filter((p) => p._id !== item._id));
    } catch {
      alert('Failed to delete');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Most Searched</h1>
          <p className="mt-1 text-sm text-gray-500">Top search terms entered by visitors (guests &amp; logged-in users).</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            className="text-sm border rounded px-2 py-1.5"
          >
            <option value={10}>Top 10</option>
            <option value={20}>Top 20</option>
            <option value={50}>Top 50</option>
          </select>
          <button onClick={fetchData} className="px-3 py-1.5 text-sm border rounded">
            Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-xl border p-8 text-center text-gray-500">Loading…</div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-5 text-red-700 text-sm">{error}</div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-xl border p-8 text-center text-gray-400 text-sm">
          No search data yet. Searches made on the storefront will appear here.
        </div>
      ) : (
        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase text-gray-500 bg-gray-50 border-b">
                <th className="py-2.5 px-4 w-8">#</th>
                <th className="py-2.5 px-4">Search Term</th>
                <th className="py-2.5 px-4 text-right">Count</th>
                <th className="py-2.5 px-4 text-right">Last Searched</th>
                <th className="py-2.5 px-4"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr key={item._id} className="border-b last:border-0 hover:bg-gray-50 transition-colors">
                  <td className="py-2.5 px-4 text-gray-400 font-mono text-xs">{idx + 1}</td>
                  <td className="py-2.5 px-4 font-medium text-gray-800">{item.term}</td>
                  <td className="py-2.5 px-4 text-right">
                    <span className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 font-semibold text-xs px-2 py-0.5 rounded-full">
                      {item.count.toLocaleString('en-BD')}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-right text-xs text-gray-400">{timeAgo(item.lastSearchedAt)}</td>
                  <td className="py-2.5 px-4 text-right">
                    <button
                      onClick={() => handleDelete(item)}
                      disabled={deletingId === item._id}
                      className="text-xs px-2 py-1 border border-red-200 text-red-600 rounded hover:bg-red-50 disabled:opacity-50"
                    >
                      {deletingId === item._id ? '…' : 'Delete'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
