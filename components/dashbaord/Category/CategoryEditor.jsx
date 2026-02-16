"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/components/context/UserContext';

export default function CategoryEditor({ categoryId }) {
  const router = useRouter();
  const { user, refreshUser } = useUser();
  const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  const [category, setCategory] = useState({ name: '', parentId: '', order: 0, isActive: true, images: [] });
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
        if (found) setCategory({ name: found.name, parentId: found.parent || '', order: found.order || 0, isActive: found.isActive, images: found.images || [] });
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [categoryId, API]);

  const handleFile = async (file) => {
    const preview = URL.createObjectURL(file);
    setCategory(c => ({ ...c, images: [...(c.images||[]), { url: preview, __local: true, uploading: true }] }));

    try {
      const fd = new FormData();
      fd.append('file', file);
      const resp = await fetch(`${API}/api/admin/upload`, { method: 'POST', body: fd, credentials: 'include' });
      const body = await resp.json();
      if (!resp.ok) throw new Error(body.error || 'Upload failed');

      const asset = { public_id: body.asset.public_id, url: body.asset.url, width: body.asset.width, height: body.asset.height, format: body.asset.format };

      // replace the local preview entry with the uploaded asset
      setCategory(c => {
        const imgs = (c.images || []).map(img => {
          if (img.__local && img.url === preview) return asset;
          return img;
        });
        return { ...c, images: imgs };
      });

      try { URL.revokeObjectURL(preview); } catch (e) { /* ignore */ }
    } catch (err) {
      setCategory(c => ({ ...c, images: (c.images || []).filter(i => !(i.__local && i.url === preview)) }));
      alert(err.message || 'Upload failed');
    }
  };

  const removeImageAt = (idx) => setCategory(c => ({ ...c, images: (c.images || []).filter((_,i) => i !== idx) }));

  const handleSave = async () => {
    if (!category.name) return alert('Name is required');
    setSaving(true);
    try {
      const method = (categoryId && categoryId !== 'new') ? 'PUT' : 'POST';
      const url = (method === 'POST') ? `${API}/api/admin/categories` : `${API}/api/admin/categories/${categoryId}`;
      const payload = { name: category.name, parentId: category.parentId || undefined, order: category.order, isActive: category.isActive };
      if (Array.isArray(category.images) && category.images.length > 0) payload.images = category.images;
      const resp = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(payload) });
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
            <label className="block text-sm font-medium">Images</label>
            <div className="flex gap-3 flex-wrap mt-2">
              {(category.images || []).map((img, idx) => (
                <div key={idx} className="relative w-24 h-24 bg-gray-50 border rounded overflow-hidden">
                  <img src={img.url} alt={img.alt || category.name || 'category'} className="w-full h-full object-cover" />
                  <button type="button" onClick={() => removeImageAt(idx)} className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full w-6 h-6 text-xs">×</button>
                </div>
              ))}

              <label className="w-24 h-24 flex items-center justify-center border border-dashed rounded cursor-pointer text-sm text-gray-500 bg-white">
                <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files && e.target.files[0] && handleFile(e.target.files[0])} />
                Upload
              </label>
            </div>
            <div className="text-xs text-gray-500 mt-2">Recommended: square image (e.g. 800×800). Uploads are optimized automatically.</div>
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
