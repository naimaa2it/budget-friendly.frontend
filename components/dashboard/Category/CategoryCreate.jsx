"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/components/context/UserContext';
import MediaPicker from '@/components/dashboard/MediaPicker';

const findNode = (nodes, id) => {
  if (!id) return null;
  for (const n of nodes || []) {
    if (String(n._id) === String(id)) return n;
    if (n.children) {
      const res = findNode(n.children, id);
      if (res) return res;
    }
  }
  return null;
};

export default function CategoryCreate({ onSuccess }) {
  const router = useRouter();
  const { user, refreshUser } = useUser();
  const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [images, setImages] = useState([]);
  const [tree, setTree] = useState([]);
  const [selectedMain, setSelectedMain] = useState('');
  const [selectedSub, setSelectedSub] = useState('');
  const [selectedSubSub, setSelectedSubSub] = useState('');
  const [saving, setSaving] = useState(false);
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => { if (!user) refreshUser(); }, [user, refreshUser]);

  useEffect(() => {
    fetch(`${API}/api/products/categories`)
      .then(r => r.json())
      .then(b => setTree(b.categories || []))
      .catch(() => setTree([]));
  }, [API]);

  const handleFile = async (file) => {
    const preview = URL.createObjectURL(file);
    setImages(imgs => [...imgs, { url: preview, __local: true, uploading: true }]);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('folder', 'Pickob/categories');
      const resp = await fetch(`${API}/api/admin/upload`, { method: 'POST', body: fd, credentials: 'include' });
      const body = await resp.json();
      if (!resp.ok) throw new Error(body.error || 'Upload failed');
      const asset = { public_id: body.asset.public_id, url: body.asset.url, width: body.asset.width, height: body.asset.height, format: body.asset.format };
      setImages(imgs => imgs.map(img => img.__local && img.url === preview ? asset : img));
      try { URL.revokeObjectURL(preview); } catch { }
    } catch (err) {
      setImages(imgs => imgs.filter(i => !(i.__local && i.url === preview)));
      alert(err.message || 'Upload failed');
    }
  };

  const removeImageAt = (idx) => setImages(imgs => imgs.filter((_, i) => i !== idx));

  const handleSave = async () => {
    if (!name.trim()) return alert('Category name is required');
    setSaving(true);
    try {
      let parentId = '';
      if (selectedSubSub) parentId = selectedSubSub;
      else if (selectedSub) parentId = selectedSub;
      else if (selectedMain) parentId = selectedMain;

      const payload = {
        name: name.trim(),
        description: description.trim(),
        parentId: parentId || undefined,
        isActive: true,
      };
      if (images.length > 0) payload.images = images.filter(img => !img.__local);

      const resp = await fetch(`${API}/api/admin/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'Failed to create category');
      if (onSuccess) onSuccess(data.category);
      else router.push('/dashboard/categories');
    } catch (err) {
      alert(err.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-white p-6 rounded shadow">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <h2 className="text-lg font-semibold">Create category</h2>
        <button onClick={() => router.push('/dashboard/categories')} className="px-3 py-2 border rounded text-sm shrink-0">Back</button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium">Name</label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full border px-3 py-2 rounded"
            placeholder="e.g. Power Bank"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Description <span className="text-gray-400 font-normal">(shown on category page)</span></label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            className="w-full border px-3 py-2 rounded h-24 resize-none"
            placeholder={`e.g. Browse our best ${name || 'products'} with fast delivery across Bangladesh.`}
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Images</label>
          <div className="flex gap-3 flex-wrap mt-2">
            {images.map((img, idx) => (
              <div key={idx} className="relative w-24 h-24 bg-gray-50 border rounded overflow-hidden">
                <img src={img.url} alt={name || 'category'} className="w-full h-full object-cover" />
                <button type="button" onClick={() => removeImageAt(idx)} className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full w-6 h-6 text-xs">×</button>
              </div>
            ))}
            <label className="w-24 h-24 flex items-center justify-center border border-dashed rounded cursor-pointer text-sm text-gray-500 bg-white">
              <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
              Upload
            </label>
            <button type="button" onClick={() => setShowPicker(true)}
              className="w-24 h-24 flex flex-col items-center justify-center border border-dashed border-indigo-300 rounded cursor-pointer text-xs text-indigo-500 bg-indigo-50 hover:bg-indigo-100 gap-1">
              <span className="text-lg">🖼</span>Library
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">Recommended: square image (e.g. 800×800).</p>
          <MediaPicker
            open={showPicker}
            onSelect={asset => {
              setImages(imgs => [...imgs, { url: asset.url, public_id: asset.public_id }]);
              setShowPicker(false);
            }}
            onClose={() => setShowPicker(false)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Parent category (choose hierarchy)</label>
          <div className="flex flex-col gap-2">
            <select value={selectedMain} onChange={e => { setSelectedMain(e.target.value); setSelectedSub(''); setSelectedSubSub(''); }} className="w-full border px-3 py-2 rounded">
              <option value="">(no parent / top level)</option>
              {tree.filter(n => n.level === 0).map(n => <option key={n._id} value={n._id}>{n.name}</option>)}
            </select>
            {selectedMain && (
              <select value={selectedSub} onChange={e => { setSelectedSub(e.target.value); setSelectedSubSub(''); }} className="w-full border px-3 py-2 rounded">
                <option value="">(direct child of selected main)</option>
                {(findNode(tree, selectedMain)?.children || []).map(n => <option key={n._id} value={n._id}>{n.name}</option>)}
              </select>
            )}
            {selectedSub && (
              <select value={selectedSubSub} onChange={e => setSelectedSubSub(e.target.value)} className="w-full border px-3 py-2 rounded">
                <option value="">(direct child of selected sub)</option>
                {(findNode(tree, selectedSub)?.children || []).map(n => <option key={n._id} value={n._id}>{n.name}</option>)}
              </select>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <button onClick={handleSave} className="px-3 py-2 bg-indigo-600 text-white rounded" disabled={saving}>
            {saving ? 'Saving…' : 'Create Category'}
          </button>
          <button onClick={() => router.push('/dashboard/categories')} className="px-3 py-2 border rounded">Cancel</button>
        </div>
      </div>
    </div>
  );
}
