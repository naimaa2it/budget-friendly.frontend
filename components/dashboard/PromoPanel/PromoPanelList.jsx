"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import PromoPanelEditor from './PromoPanelEditor';
import { useUser } from '@/components/context/UserContext';

function DealOfDayPicker({ API }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const debounceRef = useRef(null);

  useEffect(() => {
    fetch(`${API}/api/deal-of-day`)
      .then(r => r.json())
      .then(b => setSelected(b.product || null))
      .catch(() => setSelected(null))
      .finally(() => setLoading(false));
  }, [API]);

  const search = useCallback(async (q) => {
    if (!q.trim()) { setResults([]); return; }
    setSearching(true);
    try {
      const r = await fetch(`${API}/api/products?q=${encodeURIComponent(q)}&limit=10&status=published`, { credentials: 'include' });
      const json = await r.json();
      setResults(json.items || []);
    } catch { setResults([]); }
    finally { setSearching(false); }
  }, [API]);

  const handleInput = (e) => {
    const val = e.target.value;
    setQuery(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(val), 350);
  };

  const handleSelect = async (product) => {
    setSaving(true);
    setResults([]);
    setQuery('');
    try {
      const resp = await fetch(`${API}/api/admin/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ dealOfDayProductId: product._id || product.id }),
      });
      if (!resp.ok) throw new Error('Failed');
      setSelected(product);
    } catch {
      alert('Failed to save Deal of the Day');
    } finally {
      setSaving(false);
    }
  };

  const handleClear = async () => {
    setSaving(true);
    try {
      const resp = await fetch(`${API}/api/admin/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ dealOfDayProductId: null }),
      });
      if (!resp.ok) throw new Error('Failed');
      setSelected(null);
    } catch {
      alert('Failed to clear');
    } finally {
      setSaving(false);
    }
  };

  const img = selected?.images?.[0]?.url || '/assets/placeholder.svg';

  return (
    <div className="bg-white border-2 border-orange-200 rounded-2xl p-5 space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-xl">🔥</span>
        <h2 className="text-lg font-bold text-gray-800">Deal of the Day</h2>
        <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium">Home Page</span>
      </div>
      <p className="text-sm text-gray-500">Search and select one product to feature as the Deal of the Day on the homepage.</p>

      {loading ? (
        <div className="text-sm text-gray-400">Loading…</div>
      ) : selected ? (
        <div className="flex items-center gap-3 p-3 bg-orange-50 border border-orange-200 rounded-xl">
          <Image src={img} alt={selected.title} width={56} height={56} className="w-14 h-14 object-contain rounded-lg border bg-white shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-800 truncate">{selected.title}</p>
            <p className="text-sm text-orange-600 font-medium">Currently selected as Deal of the Day</p>
          </div>
          <button onClick={handleClear} disabled={saving}
            className="px-3 py-1.5 text-xs font-semibold border border-red-200 text-red-500 rounded-lg hover:bg-red-50 transition disabled:opacity-50 shrink-0">
            {saving ? '…' : 'Remove'}
          </button>
        </div>
      ) : (
        <p className="text-sm text-gray-400 italic">No product selected — search below to pick one.</p>
      )}

      <div className="relative">
        <input
          value={query}
          onChange={handleInput}
          placeholder="Search products by name…"
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 pr-8"
        />
        {searching && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2">
            <svg className="animate-spin w-4 h-4 text-orange-400" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
            </svg>
          </div>
        )}
        {results.length > 0 && (
          <div className="absolute left-0 right-0 top-full mt-1 border rounded-xl divide-y max-h-52 overflow-y-auto bg-white shadow-xl z-20">
            {results.map((p) => {
              const pImg = p.images?.[0]?.url || '/assets/placeholder.svg';
              return (
                <button key={p._id} onClick={() => handleSelect(p)} disabled={saving}
                  className="w-full flex items-center gap-3 px-3 py-2 hover:bg-orange-50 transition text-sm text-left">
                  <Image src={pImg} alt={p.title} width={32} height={32} className="w-8 h-8 object-contain rounded border shrink-0" />
                  <span className="flex-1 truncate text-gray-800">{p.title}</span>
                  <span className="text-orange-500 text-xs font-semibold shrink-0">Select</span>
                </button>
              );
            })}
          </div>
        )}
        {query && !searching && results.length === 0 && (
          <p className="text-xs text-gray-400 mt-1">No products found</p>
        )}
      </div>
    </div>
  );
}

export default function PromoPanelList() {
  const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
  const { user } = useUser();
  const [panels, setPanels]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [view, setView]         = useState('list');
  const [editId, setEditId]     = useState(null);
  const [deleting, setDeleting] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    fetch(`${API}/api/admin/promo-panels`, { credentials: 'include' })
      .then(r => r.json())
      .then(b => setPanels(b.items || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [API]);

  useEffect(() => { load(); }, [load]);

  const handleToggleActive = async (panel) => {
    try {
      const resp = await fetch(`${API}/api/admin/promo-panels/${panel._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ isActive: !panel.isActive }),
      });
      if (!resp.ok) throw new Error('Failed');
      setPanels(prev => prev.map(p => p._id === panel._id ? { ...p, isActive: !p.isActive } : p));
    } catch { alert('Failed to update'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this promo panel? This cannot be undone.')) return;
    setDeleting(id);
    try {
      const resp = await fetch(`${API}/api/admin/promo-panels/${id}`, { method: 'DELETE', credentials: 'include' });
      if (!resp.ok) throw new Error('Failed');
      setPanels(prev => prev.filter(p => p._id !== id));
    } catch { alert('Delete failed'); }
    finally { setDeleting(null); }
  };

  const handleMoveOrder = async (idx, dir) => {
    const next = [...panels];
    const swap = idx + dir;
    if (swap < 0 || swap >= next.length) return;
    [next[idx], next[swap]] = [next[swap], next[idx]];
    const updates = next.map((p, i) => ({ _id: p._id, order: i }));
    setPanels(next);
    try {
      await fetch(`${API}/api/admin/promo-panels-reorder`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(updates),
      });
    } catch { load(); }
  };

  if (view === 'create') return (
    <PromoPanelEditor
      onSuccess={() => { setView('list'); load(); }}
      onCancel={() => setView('list')}
    />
  );

  if (view === 'edit' && editId) return (
    <PromoPanelEditor
      panelId={editId}
      onSuccess={() => { setView('list'); setEditId(null); load(); }}
      onCancel={() => { setView('list'); setEditId(null); }}
    />
  );

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">

      {/* Deal of the Day */}
      <DealOfDayPicker API={API} />

      {/* Popular Picks Panels */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Popular Picks Promo Panel</h1>
            <p className="text-sm text-gray-500 mt-0.5">Left-side panel + product carousel for the Popular Picks section. The first active panel is shown.</p>
          </div>
          <button onClick={() => setView('create')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition text-sm shrink-0">
            + Add Panel
          </button>
        </div>

        {loading ? (
          <div className="text-center py-16 text-gray-400">Loading…</div>
        ) : panels.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-lg font-medium mb-2">No promo panels yet</p>
            <p className="text-sm">Click &quot;+ Add Panel&quot; to create one.</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {panels.map((p, idx) => (
              <li key={p._id} className="bg-white border rounded-2xl p-3 flex items-center gap-4 shadow-sm">
                <div className="flex flex-col gap-1">
                  <button disabled={idx === 0} onClick={() => handleMoveOrder(idx, -1)}
                    className="text-gray-400 hover:text-gray-700 disabled:opacity-30 text-xs leading-none">▲</button>
                  <button disabled={idx === panels.length - 1} onClick={() => handleMoveOrder(idx, 1)}
                    className="text-gray-400 hover:text-gray-700 disabled:opacity-30 text-xs leading-none">▼</button>
                </div>

                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.image?.url || '/assets/placeholder.svg'}
                  alt={p.title || 'Promo Panel'}
                  className="w-16 h-16 object-contain rounded-lg border shrink-0 bg-gray-50"
                  onError={e => { e.currentTarget.src = '/assets/placeholder.svg'; }}
                />

                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800 truncate">{p.title || <span className="text-gray-400 italic">No title</span>}</p>
                  {p.subtitle && <p className="text-xs text-gray-500 truncate">{p.subtitle}</p>}
                  <p className="text-xs text-gray-400 mt-0.5">
                    {p.productIds?.length > 0
                      ? `${p.productIds.length} product${p.productIds.length !== 1 ? 's' : ''} selected`
                      : 'No products selected'}
                  </p>
                  {p.buttonText && (
                    <a href={p.buttonLink || '#'} target="_blank" rel="noopener noreferrer"
                      className="text-xs text-blue-500 hover:underline truncate block" onClick={e => e.stopPropagation()}>
                      {p.buttonText} → {p.buttonLink}
                    </a>
                  )}
                </div>

                <button onClick={() => handleToggleActive(p)}
                  className={`relative w-10 h-5 rounded-full transition-colors shrink-0 ${p.isActive ? 'bg-blue-600' : 'bg-gray-300'}`}>
                  <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${p.isActive ? 'translate-x-5' : ''}`} />
                </button>

                <button onClick={() => { setEditId(p._id); setView('edit'); }}
                  className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-700 shrink-0">
                  Edit
                </button>

                {user?.role === 'admin' && (
                  <button onClick={() => handleDelete(p._id)} disabled={deleting === p._id}
                    className="px-3 py-1.5 text-sm border border-red-200 rounded-lg hover:bg-red-50 text-red-500 shrink-0 disabled:opacity-50">
                    {deleting === p._id ? '…' : 'Delete'}
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
