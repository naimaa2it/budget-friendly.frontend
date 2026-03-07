"use client";

import React, { useEffect, useState } from 'react';
import { useUser } from '@/components/context/UserContext';

export default function CustomersList() {
  const { user, refreshUser } = useUser();
  const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');

  useEffect(() => { if (!user) refreshUser(); }, [user, refreshUser]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const resp = await fetch(`${API}/api/admin/users?q=${encodeURIComponent(query || '')}`, { credentials: 'include' });
      const body = await resp.json();
      if (resp.ok) setItems(body.items || []);
      else throw new Error(body.error || 'Failed to load');
    } catch (err) {
      console.error(err);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  // fetch when query changes (debounce can be added later)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchUsers(); }, [query]);

  const handleDelete = async (id) => {
    if (!confirm('Delete this user account?')) return;
    try {
      const resp = await fetch(`${API}/api/admin/users/${id}`, { method: 'DELETE', credentials: 'include' });
      const body = await resp.json();
      if (!resp.ok) throw new Error(body.error || 'Delete failed');
      fetchUsers();
    } catch (err) {
      alert(err.message || 'Failed');
    }
  };

  return (
    <div className="max-w-6xl mx-auto bg-white p-6 rounded shadow">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Customers</h2>
        <div className="flex items-center gap-2">
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search users" className="border px-3 py-2 rounded" />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-500">Loading…</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-gray-600">
              <tr>
                <th className="py-2">Name</th>
                <th className="py-2">Email</th>
                <th className="py-2">Provider</th>
                <th className="py-2">Subscribed</th>
                <th className="py-2">Created</th>
                <th className="py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map(u => (
                <tr key={u._id} className="border-t">
                  <td className="py-3">{u.name || '-'}</td>
                  <td className="py-3">{u.email}</td>
                  <td className="py-3">{u.provider || '-'}</td>
                  <td className="py-3">
                    {u.newsletterSubscribed
                      ? <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">✓ Subscribed</span>
                      : <span className="inline-flex items-center gap-1 text-xs font-semibold text-gray-400 bg-gray-50 border border-gray-200 px-2 py-0.5 rounded-full">Not subscribed</span>
                    }
                  </td>
                  <td className="py-3">{new Date(u.createdAt).toLocaleString()}</td>
                  <td className="py-3">
                    <div className="flex gap-2">
                      <a className="px-2 py-1 border rounded text-sm" href={`/dashabord/customers/${u._id}`}>View</a>
                      <button className="px-2 py-1 border rounded text-sm text-red-600" onClick={() => handleDelete(u._id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
              {items.length === 0 && <tr><td colSpan={6} className="text-center py-8 text-gray-500">No customers found</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
