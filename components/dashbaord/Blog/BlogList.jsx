"use client";

import React, { useEffect, useState } from 'react';
import { useUser } from '@/components/context/UserContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function BlogList() {
  const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
  const { user } = useUser();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);

  const load = async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API}/api/admin/blog?page=${page}&limit=20`, { credentials: 'include' });
      const b = await r.json();
      // remove any archived entries from the client list; backend may still keep them
      const filtered = (b.items || []).filter(i => i.status !== 'archived');
      setItems(filtered);
    } catch (err) {
      console.error(err);
      alert('Failed to load posts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [page]);

  const router = useRouter();
  const handleNew = () => router.push('/dashabord/blog/new');
  const handleEdit = (post) => router.push(`/dashabord/blog/${post._id}`);
  const handleSaved = () => { load(); };
  const handleDelete = async (id, force = true) => {
    // default to permanent removal – backend supports ?force=true like other endpoints
    const msg = force
      ? 'Permanently delete this post? This cannot be undone.'
      : 'Archive this post?';
    if (!confirm(msg)) return;

    const url = `${API}/api/admin/blog/${id}${force ? '?force=true' : ''}`;
    const options = { method: 'DELETE', credentials: 'include' };
    if (force) {
      options.headers = { 'Content-Type': 'application/json' };
      options.body = JSON.stringify({ force: true });
    }

    const r = await fetch(url, options);
    const b = await r.json();
    console.log('delete response', r.status, b);
    if (!r.ok) return alert(b.error || 'Failed');
    load();
  };

  // publishing toggle not needed, remove related UI

  return (
    <div>
      <div className="mb-4 flex justify-between items-center">
        <h2 className="text-lg font-semibold">Blog posts</h2>
        <div className="flex gap-2">
          <Link href="/dashabord/blog/new" className="px-3 py-2 bg-indigo-600 text-white rounded">New post</Link>
          <button onClick={load} className="px-3 py-2 border rounded">Refresh</button>
        </div>
      </div>

      {/* inline editor removed in favor of dedicated page */}

      <div className="bg-white rounded shadow overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-sm text-gray-600">
            <tr>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Published</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} className="p-4 text-center">Loading…</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={4} className="p-4 text-center">No posts yet</td></tr>
            ) : items.map(p => (
              <tr key={p._id} className="border-t hover:bg-gray-50">
                <td className="px-4 py-3 align-top">
                  <div className="font-medium">{p.title}</div>
                  <div className="text-xs text-gray-500">{p.excerpt}</div>
                </td>
                <td className="px-4 py-3 align-top"><span className={`px-2 py-1 rounded text-xs ${p.status==='published' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>{p.status}</span></td>
                <td className="px-4 py-3 align-top">{p.publishedAt ? new Date(p.publishedAt).toLocaleString() : '-'}</td>
                <td className="px-4 py-3 align-top">
                  <div className="flex gap-2">
                    <button onClick={() => handleEdit(p)} className="px-2 py-1 border rounded text-sm">Edit</button>
                    {user?.role==='admin' && (
                      <button onClick={() => handleDelete(p._id)} className="px-2 py-1 border rounded text-sm text-red-600">Delete</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
