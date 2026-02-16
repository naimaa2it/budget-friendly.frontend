"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/components/context/UserContext';

export default function CategoryCreate({ categoryId = 'new' }) {
  const router = useRouter();
  const { user, refreshUser } = useUser();
  const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  const [category, setCategory] = useState({ name: '', parentId: '', order: 0, isActive: true, images: [] });
  const [parents, setParents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // subcategory management (edit page)
  const [children, setChildren] = useState([]);
  const [adding, setAdding] = useState(false);
  const [newChild, setNewChild] = useState({ name: '', file: null });
  const [addingFor, setAddingFor] = useState(null);
  const [newChildFor, setNewChildFor] = useState({ name: '', file: null });


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
    // load single-category data for edit. prefer admin endpoint (contains full fields),
    // but fall back to the public category tree if admin call fails or doesn't contain the node.
    if (!categoryId || categoryId === 'new') return;

    const load = async () => {
      setLoading(true);
      try {
        // try admin list (requires admin role)
        try {
          const r = await fetch(`${API}/api/admin/categories`, { credentials: 'include' });
          if (r.ok) {
            const b = await r.json();
            const found = (b.items || []).find(x => String(x._id) === categoryId);
            if (found) {
              setCategory({ name: found.name, parentId: found.parent || '', order: found.order || 0, isActive: found.isActive, images: found.images || [] });
              setLoading(false);
              return;
            }
          }
        } catch (e) {
          // admin fetch failed (e.g. not authorized) — we'll fall back below
          console.debug('Admin categories fetch failed, will try public tree:', e?.message || e);
        }

        // fallback: public categories tree
        try {
          const r2 = await fetch(`${API}/api/products/categories`);
          if (r2.ok) {
            const j = await r2.json();
            const find = (nodes, id) => {
              for (const n of (nodes || [])) {
                if (String(n._id) === String(id)) return n;
                if (n.children && n.children.length) {
                  const res = find(n.children, id);
                  if (res) return res;
                }
              }
              return null;
            };
            const node = find(j.categories || [], categoryId);
            if (node) {
              setCategory({ name: node.name || '', parentId: node.parent || '', order: node.order || 0, isActive: true, images: node.images || [] });
              setLoading(false);
              return;
            }
          }
        } catch (e2) {
          console.debug('Public categories fetch failed', e2?.message || e2);
        }

        // not found — keep defaults
        console.warn('Category not found for id:', categoryId);
      } catch (topErr) {
        console.error('Error loading category for edit:', topErr);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [categoryId, API]);

  // --- subcategory helpers ---
  const refreshChildren = useCallback(async () => {
    if (!categoryId || categoryId === 'new') return;
    const findNode = (nodes, id) => {
      for (const n of (nodes || [])) {
        if (String(n._id) === String(id)) return n;
        if (n.children && n.children.length) {
          const res = findNode(n.children, id);
          if (res) return res;
        }
      }
      return null;
    };

    try {
      const r = await fetch(`${API}/api/products/categories`);
      const json = await r.json();
      const node = findNode(json.categories || [], categoryId);
      setChildren(node && node.children ? node.children : []);
    } catch (err) {
      console.error('Failed to refresh children', err);
      setChildren([]);
    }
  }, [API, categoryId]);

  useEffect(() => { if (categoryId && categoryId !== 'new') refreshChildren(); }, [categoryId, refreshChildren]);

  const startAddFor = (id) => { setAddingFor(String(id)); setNewChildFor({ name: '', file: null }); };
  const cancelAddFor = () => { setAddingFor(null); setNewChildFor({ name: '', file: null }); };

  const uploadImageFile = async (file) => {
    const fd = new FormData();
    fd.append('file', file);
    const resp = await fetch(`${API}/api/admin/upload`, { method: 'POST', body: fd, credentials: 'include' });
    const body = await resp.json();
    if (!resp.ok) throw new Error(body.error || 'Upload failed');
    return { public_id: body.asset.public_id, url: body.asset.url, width: body.asset.width, height: body.asset.height, format: body.asset.format };
  };

  const createSubcategory = async (parentId, which = 'root') => {
    const payloadName = which === 'root' ? (newChild.name || '').trim() : (newChildFor.name || '').trim();
    const file = which === 'root' ? newChild.file : newChildFor.file;
    if (!payloadName) return alert('Subcategory name is required');

    try {
      let asset = null;
      if (file) {
        asset = await uploadImageFile(file);
      }
      const payload = { name: payloadName, parentId };
      if (asset) payload.images = [asset];

      const r = await fetch(`${API}/api/admin/categories`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(payload) });
      const body = await r.json();
      if (!r.ok) throw new Error(body.error || 'Create failed');

      // reset and refresh
      if (which === 'root') { setNewChild({ name: '', file: null }); setAdding(false); }
      else { setNewChildFor({ name: '', file: null }); setAddingFor(null); }
      await refreshChildren();
    } catch (err) {
      alert(err.message || 'Create subcategory failed');
    }
  };

  const handleDeleteChild = async (id) => {
    if (!confirm('Delete this category? This will fail if the category has children or products.')) return;
    try {
      const r = await fetch(`${API}/api/admin/categories/${id}`, { method: 'DELETE', credentials: 'include' });
      const body = await r.json();
      if (!r.ok) throw new Error(body.error || 'Delete failed');
      await refreshChildren();
    } catch (err) {
      alert(err.message || 'Delete failed');
    }
  };

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
      // If we created a new category, go directly to its edit page so the admin can add subcategories/images immediately.
      if (method === 'POST' && data && data.category && data.category._id) {
        router.push(`/dashabord/categories/${data.category._id}`);
      } else {
        router.push('/dashabord/categories');
      }
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

          {/* Subcategories (only when editing an existing category) */}
          {categoryId && categoryId !== 'new' && (
            <section className="bg-white border rounded p-4 mt-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-md font-semibold">Subcategories</h3>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setAdding(true)} className="px-3 py-1 bg-blue-600 text-white rounded text-sm">+ Add Subcategory</button>
                  <button type="button" onClick={refreshChildren} className="px-3 py-1 border rounded text-sm">Refresh</button>
                </div>
              </div>

              {/* add new subcategory inline */}
              {adding && (
                <div className="border p-3 rounded mb-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                    <input value={newChild.name} onChange={e => setNewChild(x => ({ ...x, name: e.target.value }))} placeholder="Subcategory name" className="w-full border px-3 py-2 rounded" />
                    <input type="file" accept="image/*" onChange={e => setNewChild(x => ({ ...x, file: e.target.files?.[0] || null }))} className="w-full" />
                    <div className="flex items-center gap-2">
                      <button onClick={() => createSubcategory(categoryId, 'root')} className="px-3 py-2 bg-green-600 text-white rounded">Create</button>
                      <button onClick={() => setAdding(false)} className="px-3 py-2 border rounded">Cancel</button>
                    </div>
                  </div>
                </div>
              )}

              {/* existing children */}
              <div className="space-y-3">
                {(children || []).length === 0 ? (
                  <div className="text-sm text-gray-500">No subcategories yet.</div>
                ) : (
                  children.map(child => (
                    <div key={child._id} className="border p-3 rounded">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-gray-50 rounded overflow-hidden flex items-center justify-center">
                            <img src={(child.images && child.images[0] && child.images[0].url) ? child.images[0].url : '/assets/placeholder.svg'} alt={child.name} className="w-full h-full object-contain" />
                          </div>
                          <div>
                            <div className="font-medium">{child.name}</div>
                            <div className="text-xs text-gray-500">ID: {String(child._id).slice(0,8)}</div>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <a className="px-2 py-1 border rounded text-sm text-indigo-600" href={`/dashabord/categories/${child._id}`}>Edit</a>
                          <button onClick={() => handleDeleteChild(child._id)} className="px-2 py-1 border rounded text-sm text-red-600">Delete</button>
                          <button onClick={() => startAddFor(child._id)} className="px-2 py-1 border rounded text-sm">+ Add</button>
                        </div>
                      </div>

                      {/* add sub-sub inline */}
                      {addingFor === String(child._id) && (
                        <div className="mt-3 border-l pl-4">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                            <input value={newChildFor.name} onChange={e => setNewChildFor(x => ({ ...x, name: e.target.value }))} placeholder="Sub‑subcategory name" className="w-full border px-3 py-2 rounded" />
                            <input type="file" accept="image/*" onChange={e => setNewChildFor(x => ({ ...x, file: e.target.files?.[0] || null }))} className="w-full" />
                            <div className="flex items-center gap-2">
                              <button onClick={() => createSubcategory(child._id, 'for')} className="px-3 py-2 bg-green-600 text-white rounded">Create</button>
                              <button onClick={() => cancelAddFor()} className="px-3 py-2 border rounded">Cancel</button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* show grandchildren (one level deep) */}
                      {child.children && child.children.length > 0 && (
                        <div className="mt-3 pl-6 space-y-2">
                          {child.children.map(gc => (
                            <div key={gc._id} className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gray-50 rounded overflow-hidden"><img src={(gc.images && gc.images[0] && gc.images[0].url) ? gc.images[0].url : '/assets/placeholder.svg'} alt={gc.name} className="w-full h-full object-contain" /></div>
                                <div className="text-sm">{gc.name}</div>
                              </div>
                              <div className="flex gap-2">
                                <a className="text-xs text-indigo-600" href={`/dashabord/categories/${gc._id}`}>Edit</a>
                                <button onClick={() => handleDeleteChild(gc._id)} className="text-xs text-red-600">Delete</button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </section>
          )}

          <div className="flex gap-2">
            <button onClick={handleSave} className="px-3 py-2 bg-indigo-600 text-white rounded" disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
            <button onClick={() => router.push('/dashabord/categories')} className="px-3 py-2 border rounded">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
