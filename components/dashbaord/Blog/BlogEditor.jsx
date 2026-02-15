"use client";

import React, { useEffect, useRef, useState } from 'react';
import { useUser } from '@/components/context/UserContext';

export default function BlogEditor({ post: initial = null, onCancel = () => {}, onSaved = () => {} }) {
  const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
  const { user } = useUser();

  const [title, setTitle] = useState(initial?.title || '');
  const [excerpt, setExcerpt] = useState(initial?.excerpt || '');
  const [content, setContent] = useState(initial?.content || '<p></p>');
  const [tags, setTags] = useState((initial?.tags || []).join(','));
  const [featuredImage, setFeaturedImage] = useState(initial?.featuredImage || '');
  const [status, setStatus] = useState(initial?.status || 'draft');
  const [saving, setSaving] = useState(false);
  const editorRef = useRef(null);

  useEffect(() => {
    setTitle(initial?.title || '');
    setExcerpt(initial?.excerpt || '');
    setContent(initial?.content || '<p></p>');
    setTags((initial?.tags || []).join(','));
    setFeaturedImage(initial?.featuredImage || '');
    setStatus(initial?.status || 'draft');
  }, [initial]);

  const exec = (cmd, val = null) => {
    if (!editorRef.current) return;
    document.execCommand(cmd, false, val);
    setContent(editorRef.current.innerHTML);
  };

  const insertImageFile = async (file) => {
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file);
    const r = await fetch(`${API}/api/admin/upload`, { method: 'POST', body: fd, credentials: 'include' });
    const b = await r.json();
    if (!r.ok) throw new Error(b.error || 'Upload failed');
    const url = b.asset.url;
    exec('insertImage', url);
  };

  const handleImageChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    insertImageFile(f).catch(err => alert(err.message || 'Upload failed'));
  };

  const handleSave = async (publish = false) => {
    if (!title.trim()) return alert('Title is required');
    setSaving(true);
    try {
      const payload = {
        title: title.trim(),
        excerpt: excerpt.trim(),
        content: content,
        tags: tags.split(',').map(t => t.trim()).filter(Boolean),
        featuredImage: featuredImage || undefined,
        status: publish ? 'published' : status || 'draft'
      };

      const method = initial?._id ? 'PUT' : 'POST';
      const url = initial?._id ? `${API}/api/admin/blog/${initial._id}` : `${API}/api/admin/blog`;
      const resp = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(payload) });
      const body = await resp.json();
      if (!resp.ok) throw new Error(body.error || 'Save failed');
      onSaved(body.post || body.post || body);
    } catch (err) {
      alert(err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white p-4 rounded shadow">
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1">
          <input className="w-full text-2xl font-semibold border-b pb-2 mb-3" value={title} onChange={e => setTitle(e.target.value)} placeholder="Post title" />
          <input className="w-full border px-3 py-2 mb-4" value={excerpt} onChange={e => setExcerpt(e.target.value)} placeholder="Short excerpt (shows in listing)" />
        </div>
        <div className="w-48 text-right">
          <div className="text-sm text-gray-600 mb-2">Status</div>
          <select value={status} onChange={e => setStatus(e.target.value)} className="w-full border rounded px-2 py-1">
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
          <div className="mt-3 text-xs text-gray-500">Author: {user?.name || user?.email}</div>
        </div>
      </div>

      <div className="mt-4">
        <div className="flex gap-2 mb-2">
          <button type="button" onClick={() => exec('bold')} className="px-2 py-1 border rounded">B</button>
          <button type="button" onClick={() => exec('italic')} className="px-2 py-1 border rounded">I</button>
          <button type="button" onClick={() => exec('underline')} className="px-2 py-1 border rounded">U</button>
          <button type="button" onClick={() => exec('formatBlock','<h2>')} className="px-2 py-1 border rounded">H2</button>
          <button type="button" onClick={() => exec('formatBlock','<p>')} className="px-2 py-1 border rounded">P</button>
          <button type="button" onClick={() => exec('insertUnorderedList')} className="px-2 py-1 border rounded">• List</button>
          <button type="button" onClick={() => exec('insertOrderedList')} className="px-2 py-1 border rounded">1. List</button>
          <button type="button" onClick={() => {
            const url = prompt('Enter link URL');
            if (url) exec('createLink', url);
          }} className="px-2 py-1 border rounded">Link</button>
          <label className="px-2 py-1 border rounded cursor-pointer">
            Img<input onChange={handleImageChange} type="file" accept="image/*" className="hidden" />
          </label>
          <button type="button" onClick={() => exec('undo')} className="px-2 py-1 border rounded">↶</button>
          <button type="button" onClick={() => exec('redo')} className="px-2 py-1 border rounded">↷</button>
        </div>

        <div ref={editorRef} contentEditable className="min-h-[240px] border p-4 rounded prose max-w-none" onInput={e => setContent(e.currentTarget.innerHTML)} dangerouslySetInnerHTML={{ __html: content }} />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4">
        <input placeholder="Comma separated tags" value={tags} onChange={e => setTags(e.target.value)} className="w-full border px-3 py-2 rounded" />
        <input placeholder="Featured image URL" value={featuredImage} onChange={e => setFeaturedImage(e.target.value)} className="w-full border px-3 py-2 rounded" />
      </div>

      <div className="mt-4 flex gap-3">
        <button onClick={() => handleSave(false)} className="px-4 py-2 bg-gray-800 text-white rounded" disabled={saving}>{saving ? 'Saving…' : 'Save draft'}</button>
        <button onClick={() => handleSave(true)} className="px-4 py-2 bg-green-600 text-white rounded" disabled={saving}>Publish</button>
        <button onClick={onCancel} className="px-4 py-2 border rounded">Cancel</button>
      </div>
    </div>
  );
}
