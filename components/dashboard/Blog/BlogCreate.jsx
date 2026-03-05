"use client";

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/components/context/UserContext';
import MediaPicker from '@/components/dashboard/MediaPicker';

export default function BlogCreate() {
  const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
  const router = useRouter();
  const { user } = useUser();

  const [title, setTitle] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('<p></p>');
  const [tags, setTags] = useState('');
  const [featuredImage, setFeaturedImage] = useState('');
  const [status, setStatus] = useState('draft');
  const [saving, setSaving] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const editorRef = useRef(null);
  const lastRange = useRef(null);

  const saveSelection = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      lastRange.current = sel.getRangeAt(0).cloneRange();
    }
  };
  const restoreSelection = () => {
    const sel = window.getSelection();
    sel.removeAllRanges();
    if (lastRange.current) sel.addRange(lastRange.current);
  };

  const exec = (cmd, val = null) => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    restoreSelection();
    document.execCommand(cmd, false, val);

    // when inserting a link, ensure it opens in new tab and gets a blue style
    if (cmd === 'createLink' && val) {
      const sel = window.getSelection();
      if (sel && sel.rangeCount) {
        // the new <a> is usually the parent of the anchorNode or focusNode
        let node = sel.anchorNode;
        while (node && node.nodeType === 3) node = node.parentElement;
        if (node && node.tagName === 'A') {
          node.setAttribute('target', '_blank');
          node.style.color = '#2563eb';
          node.style.textDecoration = 'underline';
        }
      }
    }

    setContent(editorRef.current.innerHTML);
  };

  useEffect(() => {
    document.execCommand('enableObjectResizing', false, true);
    document.execCommand('enableInlineTableEditing', false, true);
  }, []);

  const insertImageFile = async (file) => {
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file);
    const r = await fetch(`${API}/api/admin/upload`, { method: 'POST', body: fd, credentials: 'include' });
    const b = await r.json();
    if (!r.ok) throw new Error(b.error || 'Upload failed');
    const url = b.asset.url;
    exec('insertImage', url);
    setTimeout(() => {
      const imgs = editorRef.current?.querySelectorAll('img');
      if (imgs && imgs.length) {
        const img = imgs[imgs.length - 1];
        img.style.maxHeight = '200px';
        img.style.height = 'auto';
        img.style.cursor = 'pointer';
        img.addEventListener('click', () => {
          const action = prompt('Enter new max-height in px, or type "remove" to delete the image:');
          if (!action) return;
          if (action.toLowerCase().trim() === 'remove') {
            img.remove();
          } else {
            const h = parseInt(action, 10);
            if (!isNaN(h) && h > 0) {
              img.style.maxHeight = h + 'px';
            }
          }
        });
      }
    }, 100);
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
        content,
        tags: tags.split(',').map(t => t.trim()).filter(Boolean),
        featuredImage: featuredImage || undefined,
        status: publish ? 'published' : status || 'draft'
      };
      const resp = await fetch(`${API}/api/admin/blog`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(payload) });
      const body = await resp.json();
      if (!resp.ok) throw new Error(body.error || 'Save failed');
      router.push('/dashbaord/blog');
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
        <div className="text-xs text-gray-500 mb-1">Select some text and click the link icon to turn it into a hyperlink (blue).</div>
        <div className="flex gap-2 mb-2 sticky top-0 bg-white z-10">
          <button type="button" onClick={() => exec('bold')} className="px-2 py-1 border rounded">B</button>
          <button type="button" onClick={() => exec('italic')} className="px-2 py-1 border rounded">I</button>
          <button type="button" onClick={() => exec('underline')} className="px-2 py-1 border rounded">U</button>
          <button type="button" onClick={() => exec('formatBlock','<h2>')} className="px-2 py-1 border rounded">H2</button>
          <button type="button" onClick={() => exec('formatBlock','<p>')} className="px-2 py-1 border rounded">P</button>
          <button type="button" onClick={() => exec('insertUnorderedList')} className="px-2 py-1 border rounded">• List</button>
          <button type="button" onClick={() => exec('insertOrderedList')} className="px-2 py-1 border rounded">1. List</button>
          <button onMouseDown={saveSelection} type="button" onClick={() => {
            const url = prompt('Enter link URL');
            if (url) exec('createLink', url);
          }} className="px-2 py-1 border rounded">Link</button>
          <label onMouseDown={saveSelection} className="px-2 py-1 border rounded cursor-pointer">
            Img<input onChange={handleImageChange} type="file" accept="image/*" className="hidden" />
          </label>
          <button type="button" onMouseDown={saveSelection} onClick={() => setShowPicker(true)}
            className="px-2 py-1 border rounded text-blue-600 hover:bg-blue-50">Library</button>
          <button type="button" onClick={() => exec('undo')} className="px-2 py-1 border rounded">↶</button>
          <button type="button" onClick={() => exec('redo')} className="px-2 py-1 border rounded">↷</button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto">
          <div
            ref={editorRef}
            contentEditable
            className="min-h-[240px] border p-4 rounded prose max-w-none"
            onInput={e => setContent(e.currentTarget.innerHTML)}
          />
        </div>
      </div>

      <style jsx>{`
        .editor-area img { max-height: 300px; max-width:100%; width:auto; display:block; margin:auto; }
      `}</style>
      <div className="mt-4 grid grid-cols-2 gap-4">
        <input placeholder="Comma separated tags" value={tags} onChange={e => setTags(e.target.value)} className="w-full border px-3 py-2 rounded" />
        <input placeholder="Featured image URL" value={featuredImage} onChange={e => setFeaturedImage(e.target.value)} className="w-full border px-3 py-2 rounded" />
      </div>

      <div className="mt-4 flex gap-3">
        <button onClick={() => handleSave(false)} className="px-4 py-2 bg-gray-800 text-white rounded" disabled={saving}>{saving ? 'Saving…' : 'Save draft'}</button>
        <button onClick={() => handleSave(true)} className="px-4 py-2 bg-green-600 text-white rounded" disabled={saving}>Publish</button>
        <button onClick={() => router.push('/dashbaord/blog')} className="px-4 py-2 border rounded">Cancel</button>
      </div>

      <MediaPicker
        open={showPicker}
        onClose={() => setShowPicker(false)}
        onSelect={asset => {
          restoreSelection();
          exec('insertImage', asset.url);
          setShowPicker(false);
        }}
      />
    </div>
  );
}
