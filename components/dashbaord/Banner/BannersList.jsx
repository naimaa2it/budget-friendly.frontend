"use client";

import React, { useState, useEffect, useCallback } from 'react';
import BannerEditor from './BannerEditor';

export default function BannersList() {
  const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
  const [banners, setBanners]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [view, setView]         = useState('list'); // 'list' | 'create' | 'edit'
  const [editId, setEditId]     = useState(null);
  const [deleting, setDeleting] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    fetch(`${API}/api/admin/banners`, { credentials: 'include' })
      .then(r => r.json())
      .then(b => setBanners(b.items || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [API]);

  useEffect(() => { load(); }, [load]);

  const handleToggleActive = async (banner) => {
    try {
      const resp = await fetch(`${API}/api/admin/banners/${banner._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ isActive: !banner.isActive }),
      });
      if (!resp.ok) throw new Error('Failed');
      setBanners(prev => prev.map(b => b._id === banner._id ? { ...b, isActive: !b.isActive } : b));
    } catch { alert('Failed to update'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this banner slide? This cannot be undone.')) return;
    setDeleting(id);
    try {
      const resp = await fetch(`${API}/api/admin/banners/${id}`, { method: 'DELETE', credentials: 'include' });
      if (!resp.ok) throw new Error('Failed');
      setBanners(prev => prev.filter(b => b._id !== id));
    } catch { alert('Delete failed'); }
    finally { setDeleting(null); }
  };

  const handleMoveOrder = async (idx, dir) => {
    const next = [...banners];
    const swap = idx + dir;
    if (swap < 0 || swap >= next.length) return;
    [next[idx], next[swap]] = [next[swap], next[idx]];
    const updates = next.map((b, i) => ({ _id: b._id, order: i }));
    setBanners(next);
    try {
      await fetch(`${API}/api/admin/banners-reorder`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(updates),
      });
    } catch { load(); }
  };

  if (view === 'create') return (
    <BannerEditor
      onSuccess={() => { setView('list'); load(); }}
      onCancel={() => setView('list')}
    />
  );

  if (view === 'edit' && editId) return (
    <BannerEditor
      bannerId={editId}
      onSuccess={() => { setView('list'); setEditId(null); load(); }}
      onCancel={() => { setView('list'); setEditId(null); }}
    />
  );

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Banner Slides</h1>
          <p className="text-sm text-gray-500 mt-0.5">Slides shown in the homepage banner carousel</p>
        </div>
        <button onClick={() => setView('create')}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition text-sm">
          + Add Slide
        </button>
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400">Loading…</div>
      ) : banners.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg font-medium mb-2">No banner slides yet</p>
          <p className="text-sm">Click &quot;+ Add Slide&quot; to upload your first banner.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {banners.map((b, idx) => (
            <li key={b._id} className="bg-white border rounded-2xl p-3 flex items-center gap-4 shadow-sm">
              {/* Reorder */}
              <div className="flex flex-col gap-1">
                <button disabled={idx === 0} onClick={() => handleMoveOrder(idx, -1)}
                  className="text-gray-400 hover:text-gray-700 disabled:opacity-30 text-xs leading-none">▲</button>
                <button disabled={idx === banners.length - 1} onClick={() => handleMoveOrder(idx, 1)}
                  className="text-gray-400 hover:text-gray-700 disabled:opacity-30 text-xs leading-none">▼</button>
              </div>

              {/* Thumbnail */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={b.image?.url || '/assets/placeholder.svg'}
                alt={b.title || 'Banner'}
                className="w-28 h-16 object-cover rounded-lg border flex-shrink-0 bg-gray-100"
                onError={e => { e.currentTarget.src = '/assets/placeholder.svg'; }}
              />

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-800 truncate">{b.title || <span className="text-gray-400 italic">No title</span>}</p>
                <p className="text-xs text-gray-400 mt-0.5 truncate">
                  {b.subtitle || '—'}
                  {b.badge && <span className="ml-2 bg-blue-100 text-blue-700 rounded px-1.5 py-0.5">{b.badge}</span>}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Link: <span className="text-blue-500">{b.buttonLink}</span>
                </p>
              </div>

              {/* Active toggle */}
              <button onClick={() => handleToggleActive(b)}
                className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${b.isActive ? 'bg-blue-600' : 'bg-gray-300'}`}
                title={b.isActive ? 'Click to hide' : 'Click to show'}>
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${b.isActive ? 'translate-x-5' : ''}`} />
              </button>

              {/* Edit / Delete */}
              <div className="flex gap-2 flex-shrink-0">
                <button onClick={() => { setEditId(b._id); setView('edit'); }}
                  className="px-3 py-1.5 text-xs font-semibold bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition">
                  Edit
                </button>
                <button onClick={() => handleDelete(b._id)} disabled={deleting === b._id}
                  className="px-3 py-1.5 text-xs font-semibold bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition disabled:opacity-50">
                  {deleting === b._id ? '…' : 'Delete'}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
