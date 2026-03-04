"use client";

import React, { useState, useEffect, useRef } from 'react';
import MediaPicker from '@/components/dashbaord/MediaPicker';

export default function BannerEditor({ bannerId = null, onSuccess, onCancel }) {
  const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
  const isEdit = !!bannerId;

  const [image, setImage]           = useState({ url: '', public_id: '' });
  const [title, setTitle]           = useState('');
  const [subtitle, setSubtitle]     = useState('');
  const [buttonText, setButtonText] = useState('Order Now');
  const [buttonLink, setButtonLink] = useState('/');
  const [badge, setBadge]           = useState('');
  const [isActive, setIsActive]     = useState(true);
  const [uploading, setUploading]   = useState(false);
  const [saving, setSaving]         = useState(false);
  const [loading, setLoading]       = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    if (!isEdit) return;
    setLoading(true);
    fetch(`${API}/api/admin/banners/${bannerId}`, { credentials: 'include' })
      .then(r => r.json())
      .then(b => {
        const s = b.banner || {};
        setImage(s.image || { url: '', public_id: '' });
        setTitle(s.title || '');
        setSubtitle(s.subtitle || '');
        setButtonText(s.buttonText || 'Order Now');
        setButtonLink(s.buttonLink || '/');
        setBadge(s.badge || '');
        setIsActive(s.isActive !== false);
      })
      .catch(err => alert('Failed to load: ' + err.message))
      .finally(() => setLoading(false));
  }, [bannerId, isEdit, API]);

  const handleImageUpload = async (file) => {
    if (!file) return;
    const preview = URL.createObjectURL(file);
    setImage({ url: preview, public_id: '', __uploading: true });
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const resp = await fetch(`${API}/api/admin/upload`, { method: 'POST', credentials: 'include', body: fd });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'Upload failed');
      setImage({ url: data.asset.url, public_id: data.asset.public_id });
    } catch (err) {
      alert('Image upload failed: ' + err.message);
      setImage({ url: '', public_id: '' });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!image.url) { alert('Please upload a banner image'); return; }
    setSaving(true);
    try {
      const body = { image, title, subtitle, buttonText, buttonLink, badge, isActive };
      const url = isEdit
        ? `${API}/api/admin/banners/${bannerId}`
        : `${API}/api/admin/banners`;
      const resp = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'Failed');
      onSuccess && onSuccess(data.banner);
    } catch (err) {
      alert('Save failed: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="py-16 text-center text-gray-400">Loading…</div>;

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-2xl shadow space-y-5">
      <h2 className="text-2xl font-bold text-gray-800">{isEdit ? 'Edit Banner Slide' : 'New Banner Slide'}</h2>

      {/* Image upload */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Banner Image *</label>
        <div
          className="relative border-2 border-dashed border-gray-300 rounded-xl overflow-hidden cursor-pointer hover:border-blue-400 transition"
          style={{ height: '200px' }}
          onClick={() => fileRef.current?.click()}
        >
          {image.url ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={image.url} alt="Banner preview" className="w-full h-full object-cover" />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-2">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4-4 4 4 4-6 4 6M4 20h16M4 4h16" />
              </svg>
              <span className="text-sm">Click to upload banner image</span>
              <span className="text-xs text-gray-300">Recommended: 1600 × 600 px</span>
            </div>
          )}
          {uploading && (
            <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
              <span className="text-blue-600 font-semibold text-sm">Uploading…</span>
            </div>
          )}
          {image.url && !uploading && (
            <div className="absolute bottom-2 right-2">
              <span className="bg-black/50 text-white text-xs px-2 py-1 rounded">Click to change</span>
            </div>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/*" className="hidden"
          onChange={e => handleImageUpload(e.target.files[0])} />
        <div className="mt-2 flex items-center gap-2">
          <button type="button" onClick={() => setShowPicker(true)}
            className="text-xs px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-600 flex items-center gap-1">
            <span>🖼</span> Select from Media Library
          </button>
          {image.url && (
            <button type="button" onClick={() => setImage({ url: '', public_id: '' })}
              className="text-xs px-3 py-1.5 border border-red-200 rounded-lg hover:bg-red-50 text-red-500">
              Remove
            </button>
          )}
        </div>
      </div>

      <MediaPicker
        open={showPicker}
        onSelect={asset => { setImage({ url: asset.url, public_id: asset.public_id }); setShowPicker(false); }}
        onClose={() => setShowPicker(false)}
      />

      {/* Text fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Title</label>
          <input value={title} onChange={e => setTitle(e.target.value)}
            placeholder="e.g. 35% Cashback !!"
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Badge Text</label>
          <input value={badge} onChange={e => setBadge(e.target.value)}
            placeholder="e.g. FREE DELIVERY"
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">Subtitle</label>
        <input value={subtitle} onChange={e => setSubtitle(e.target.value)}
          placeholder="e.g. Start your daily shopping diversity!"
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Button Text</label>
          <input value={buttonText} onChange={e => setButtonText(e.target.value)}
            placeholder="Order Now"
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Button Link</label>
          <input value={buttonLink} onChange={e => setButtonLink(e.target.value)}
            placeholder="/products"
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
      </div>

      {/* Active toggle */}
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => setIsActive(v => !v)}
          className={`relative w-12 h-6 rounded-full transition-colors ${isActive ? 'bg-blue-600' : 'bg-gray-300'}`}>
          <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${isActive ? 'translate-x-6' : ''}`} />
        </button>
        <span className="text-sm text-gray-700">{isActive ? 'Active (shown on homepage)' : 'Inactive (hidden)'}</span>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button onClick={handleSave} disabled={saving || uploading}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 transition">
          {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Banner'}
        </button>
        {onCancel && (
          <button onClick={onCancel}
            className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition">
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}
