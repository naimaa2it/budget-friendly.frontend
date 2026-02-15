"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/components/context/UserContext';

export default function CategoryEditor({ categoryId }) {
  const router = useRouter();
  const { user, refreshUser } = useUser();
  const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  const [category, setCategory] = useState({ name: '', parentId: '', order: 0, isActive: true });
  const [parents, setParents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (!user) refreshUser(); }, [user, refreshUser]);

  useEffect(() => {
    // load available parent categories (public)
    fetch(`${API}/api/products/categories`).then(r => r.json()).then(b => {
      const flat = [];
      const walk = (nodes, lvl=0) => {
        for (const n of nodes) {
          flat.push({ _id: n._id, name: '-'.repeat(lvl) + ' ' + n.name, level: n.level });
          if (n.children) walk(n.children, lvl+1);
        }
      };
      walk(b.categories || []);
      setParents(flat);
    }).catch(() => setParents([]));
  }, [API]);

  useEffect(() => {
    if (!categoryId || categoryId === 'new') return;
    setLoading(true);
    fetch(`${API}/api/admin/categories`, { credentials: 'include' })
      .then(r => r.json())
      .then(b => {
        const found = (b.items || []).find(x => String(x._id) === categoryId);
        if (found) setCategory({ name: found.name, parentId: found.parent || '', order: found.order || 0, isActive: found.isActive });
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [categoryId, API]);

  const handleSave = async () => {
    if (!category.name) return alert('Name is required');
    setSaving(true);
    try {
      const method = (categoryId && categoryId !== 'new') ? 'PUT' : 'POST';
      const url = (method === 'POST') ? `${API}/api/admin/categories` : `${API}/api/admin/categories/${categoryId}`;
      const resp = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ name: category.name, parentId: category.parentId || undefined, order: category.order, isActive: category.isActive }) });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'Save failed');
      router.push('/dashabord/categories');
    } catch (err) {
      alert(err.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-white p-6 rounded shadow">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">{categoryId === 'new' ? 'Create category' : 'Edit category'}</h2>
        <div>
          <button onClick={() => router.push('/dashabord/categories')} className="px-3 py-2 border rounded text-sm">Back</button>
        </div>
      </div>

      {loading ? <div className="text-center py-12">Loading…</div> : (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium">Name</label>
            <input value={category.name} onChange={e => setCategory(c=>({...c, name: e.target.value}))} className="w-full border px-3 py-2 rounded" />
          </div>

          <div>
            <label className="block text-sm font-medium">Parent category (optional)</label>
            <select value={category.parentId || ''} onChange={e => setCategory(c=>({...c, parentId: e.target.value}))} className="w-full border px-3 py-2 rounded">
              <option value="">(no parent)</option>
              {parents.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium">Order</label>
            <input type="number" value={category.order} onChange={e => setCategory(c=>({...c, order: Number(e.target.value)}))} className="w-40 border px-3 py-2 rounded" />
          </div>

          <div>
            <label className="inline-flex items-center gap-2">
              <input type="checkbox" checked={category.isActive} onChange={e => setCategory(c=>({...c, isActive: e.target.checked}))} />
              <span className="text-sm">Active</span>
            </label>
          </div>

          <div className="flex gap-2">
            <button onClick={handleSave} className="px-3 py-2 bg-indigo-600 text-white rounded" disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
            <button onClick={() => router.push('/dashabord/categories')} className="px-3 py-2 border rounded">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
