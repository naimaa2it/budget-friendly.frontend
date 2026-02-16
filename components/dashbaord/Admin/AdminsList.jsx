"use client";

import React, { useEffect, useState } from 'react';
import { useUser } from '@/components/context/UserContext';

export default function AdminsList() {
  const { user, refreshUser } = useUser();
  const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => { if (!user) refreshUser(); }, [user, refreshUser]);

  const fetchAdmins = async () => {
    setLoading(true);
    try {
      const resp = await fetch(`${API}/api/admin/admins`, { credentials: 'include' });
      const body = await resp.json();
      if (resp.ok) setItems(body.items || []);
      else throw new Error(body.error || 'Failed to load');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { const load = () => { fetchAdmins(); }; load(); }, [/* fetchAdmins intentionally stable */]);

  const handleDeactivate = async (id) => {
    if (!confirm('Deactivate this account?')) return;
    try {
      const resp = await fetch(`${API}/api/admin/admins/${id}`, { method: 'DELETE', credentials: 'include' });
      const body = await resp.json();
      if (!resp.ok) throw new Error(body.error || 'Failed');
      fetchAdmins();
    } catch (err) {
      alert(err.message || 'Failed');
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-white p-6 rounded shadow">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Authorized accounts</h2>
        <div>
          <a href="/dashabord/authorized/new" className="px-3 py-2 bg-green-600 text-white rounded text-sm">Create admin</a>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-500">Loading…</div>
      ) : (
        <table className="w-full text-left text-sm">
          <thead className="text-gray-600">
            <tr>
              <th className="py-2">Name</th>
              <th className="py-2">Email</th>
              <th className="py-2">Role</th>
              <th className="py-2">Status</th>
              <th className="py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map(a => (
              <tr key={a._id} className="border-t">
                <td className="py-3">{a.name}</td>
                <td className="py-3">{a.email}</td>
                <td className="py-3">{a.role}</td>
                <td className="py-3">{a.isActive ? <span className="text-green-600">Active</span> : <span className="text-red-600">Disabled</span>}</td>
                <td className="py-3">
                  <div className="flex gap-2">
                    <a className="px-2 py-1 border rounded text-sm" href={`/dashabord/authorized/${a._id}`}>Edit</a>
                    {a.isActive && <button className="px-2 py-1 border rounded text-sm text-red-600" onClick={() => handleDeactivate(a._id)}>Deactivate</button>}
                    <a className="px-2 py-1 border rounded text-sm" href={`/dashabord/authorized/${a._id}`}>Delete</a>
                  </div>
                </td>
              </tr>
            ))}
            {items.length === 0 && <tr><td colSpan={5} className="text-center py-8 text-gray-500">No admin accounts found</td></tr>}
          </tbody>
        </table>
      )}
    </div>
  );
}
