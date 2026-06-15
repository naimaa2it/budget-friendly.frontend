"use client";

import React, { useEffect, useState, useCallback } from 'react';
import PromoStripEditor from './PromoStripEditor';
import { useUser } from '@/components/context/UserContext';

export default function PromoStripList() {
  const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
  const { user } = useUser();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('list');
  const [editId, setEditId] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    fetch(`${API}/api/admin/promo-strip`, { credentials: 'include' })
      .then(r => r.json())
      .then(b => setItems(b.items || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [API]);

  useEffect(() => { load(); }, [load]);

  const handleToggleActive = async (item) => {
    try {
      const resp = await fetch(`${API}/api/admin/promo-strip/${item._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ isActive: !item.isActive }),
      });
      if (!resp.ok) throw new Error('Failed');
      setItems(prev => prev.map(s => s._id === item._id ? { ...s, isActive: !s.isActive } : s));
    } catch {
      alert('Failed to update');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this strip item? This cannot be undone.')) return;
    setDeleting(id);
    try {
      const resp = await fetch(`${API}/api/admin/promo-strip/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!resp.ok) throw new Error('Failed');
      setItems(prev => prev.filter(s => s._id !== id));
    } catch {
      alert('Delete failed');
    } finally {
      setDeleting(null);
    }
  };

  const handleMoveOrder = async (idx, dir) => {
    const next = [...items];
    const swap = idx + dir;
    if (swap < 0 || swap >= next.length) return;
    [next[idx], next[swap]] = [next[swap], next[idx]];
    setItems(next);
    try {
      await fetch(`${API}/api/admin/promo-strip-reorder`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(next.map((s, i) => ({ _id: s._id, order: i }))),
      });
    } catch {
      load();
    }
  };

  if (view === 'create') return (
    <PromoStripEditor
      onSuccess={() => { setView('list'); load(); }}
      onCancel={() => setView('list')}
    />
  );

  if (view === 'edit' && editId) return (
    <PromoStripEditor
      itemId={editId}
      onSuccess={() => { setView('list'); setEditId(null); load(); }}
      onCancel={() => { setView('list'); setEditId(null); }}
    />
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Promo Strip Items</h2>
          <p className="text-sm text-gray-500">Manage combo/offer cards shown right below banner.</p>
        </div>
        <button
          onClick={() => setView('create')}
          className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 shrink-0"
        >
          + New Item
        </button>
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400">Loading…</div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-xl">
          <p className="text-gray-500 mb-3">No promo strip items yet.</p>
          <button
            onClick={() => setView('create')}
            className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Create first item
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item, idx) => (
            <div key={item._id} className="flex items-center gap-4 bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
              <div className="flex flex-col gap-0.5">
                <button
                  onClick={() => handleMoveOrder(idx, -1)}
                  disabled={idx === 0}
                  className="text-gray-400 hover:text-gray-700 disabled:opacity-20 text-xs leading-none p-0.5"
                >▲</button>
                <button
                  onClick={() => handleMoveOrder(idx, 1)}
                  disabled={idx === items.length - 1}
                  className="text-gray-400 hover:text-gray-700 disabled:opacity-20 text-xs leading-none p-0.5"
                >▼</button>
              </div>

              <div className="w-14 h-14 rounded-lg overflow-hidden border border-gray-200 bg-gray-100 shrink-0">
                {item.image?.url
                  ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={item.image.url} alt="" className="w-full h-full object-cover" />
                  )
                  : <div className="w-full h-full flex items-center justify-center text-gray-300">🏷️</div>
                }
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-800 truncate">{item.title}</p>
                <p className="text-xs text-gray-500 truncate">{item.subtitle || '—'}</p>
                <p className="text-xs text-blue-500 truncate mt-0.5">{item.link || '/'}</p>
              </div>

              <button
                onClick={() => handleToggleActive(item)}
                className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${item.isActive ? 'bg-blue-600' : 'bg-gray-300'}`}
                title={item.isActive ? 'Click to hide' : 'Click to show'}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${item.isActive ? 'translate-x-5' : ''}`} />
              </button>

              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => { setEditId(item._id); setView('edit'); }}
                  className="text-blue-600 hover:text-blue-800 text-sm px-3 py-1.5 border border-blue-200 rounded-lg hover:bg-blue-50"
                >
                  Edit
                </button>
                {user?.role === 'admin' && (
                  <button
                    onClick={() => handleDelete(item._id)}
                    disabled={deleting === item._id}
                    className="text-red-500 hover:text-red-700 text-sm px-3 py-1.5 border border-red-200 rounded-lg hover:bg-red-50 disabled:opacity-50"
                  >
                    {deleting === item._id ? '…' : 'Delete'}
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
