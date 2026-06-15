"use client";

import React, { useState, useEffect, useCallback } from 'react';
import FeaturedSectionEditor from './FeaturedSectionEditor';
import { useUser } from '@/components/context/UserContext';

export default function FeaturedSectionsList() {
  const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
  const { user } = useUser();
  const [sections, setSections] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [view, setView]         = useState('list'); // 'list' | 'create' | 'edit'
  const [editId, setEditId]     = useState(null);
  const [deleting, setDeleting] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    fetch(`${API}/api/admin/featured`, { credentials: 'include' })
      .then(r => r.json())
      .then(b => setSections(b.items || []))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [API]);

  useEffect(() => { load(); }, [load]);

  const handleToggleActive = async (section) => {
    try {
      const resp = await fetch(`${API}/api/admin/featured/${section._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ isActive: !section.isActive }),
      });
      if (!resp.ok) throw new Error('Failed');
      setSections(prev => prev.map(s => s._id === section._id ? { ...s, isActive: !s.isActive } : s));
    } catch {
      alert('Failed to update');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this featured section? This cannot be undone.')) return;
    setDeleting(id);
    try {
      const resp = await fetch(`${API}/api/admin/featured/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!resp.ok) throw new Error('Failed');
      setSections(prev => prev.filter(s => s._id !== id));
    } catch {
      alert('Delete failed');
    } finally {
      setDeleting(null);
    }
  };

  const handleMoveOrder = async (idx, dir) => {
    const next = [...sections];
    const swap = idx + dir;
    if (swap < 0 || swap >= next.length) return;
    [next[idx], next[swap]] = [next[swap], next[idx]];
    const updates = next.map((s, i) => ({ _id: s._id, order: i }));
    setSections(next);
    try {
      await fetch(`${API}/api/admin/featured-reorder`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(updates),
      });
    } catch {
      load(); // rollback on error
    }
  };

  if (view === 'create') return (
    <FeaturedSectionEditor
      onSuccess={() => { setView('list'); load(); }}
      onCancel={() => setView('list')}
    />
  );

  if (view === 'edit' && editId) return (
    <FeaturedSectionEditor
      sectionId={editId}
      onSuccess={() => { setView('list'); setEditId(null); load(); }}
      onCancel={() => { setView('list'); setEditId(null); }}
    />
  );

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Featured Sections</h1>
          <p className="text-sm text-gray-500 mt-0.5">Product carousels displayed on the homepage</p>
        </div>
        <button
          onClick={() => setView('create')}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition text-sm shrink-0"
        >
          + New Section
        </button>
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400">Loading…</div>
      ) : sections.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg font-medium mb-2">No featured sections yet</p>
          <p className="text-sm">Click &quot;+ New Section&quot; to create your first product carousel.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {sections.map((sec, idx) => (
            <li key={sec._id} className="bg-white border rounded-2xl p-4 flex items-center gap-4 shadow-sm">
              {/* Order buttons */}
              <div className="flex flex-col gap-1">
                <button
                  disabled={idx === 0}
                  onClick={() => handleMoveOrder(idx, -1)}
                  className="text-gray-400 hover:text-gray-700 disabled:opacity-30 text-xs leading-none"
                >▲</button>
                <button
                  disabled={idx === sections.length - 1}
                  onClick={() => handleMoveOrder(idx, 1)}
                  className="text-gray-400 hover:text-gray-700 disabled:opacity-30 text-xs leading-none"
                >▼</button>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-800 truncate">{sec.title}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {sec.productIds?.length
                    ? `${sec.productIds.length} product${sec.productIds.length !== 1 ? 's' : ''} selected manually`
                    : sec.categoryId
                    ? `Auto-fill from category · limit ${sec.limit}`
                    : 'No products configured'}
                  {' · '}
                  <a href={sec.viewAllLink} className="text-blue-400 hover:underline" target="_blank" rel="noreferrer">
                    {sec.viewAllLink}
                  </a>
                </p>
              </div>

              {/* Active toggle */}
              <button
                onClick={() => handleToggleActive(sec)}
                className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${sec.isActive ? 'bg-blue-600' : 'bg-gray-300'}`}
                title={sec.isActive ? 'Click to hide' : 'Click to show'}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${sec.isActive ? 'translate-x-5' : ''}`} />
              </button>

              {/* Edit / Delete */}
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => { setEditId(sec._id); setView('edit'); }}
                  className="px-3 py-1.5 text-xs font-semibold bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition"
                >
                  Edit
                </button>
                {user?.role === 'admin' && (
                  <button
                    onClick={() => handleDelete(sec._id)}
                    disabled={deleting === sec._id}
                    className="px-3 py-1.5 text-xs font-semibold bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition disabled:opacity-50"
                  >
                    {deleting === sec._id ? '…' : 'Delete'}
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
