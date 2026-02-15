"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/components/context/UserContext';

export default function AdminEditor({ adminId }) {
  const router = useRouter();
  const { user, refreshUser } = useUser();
  const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  const [admin, setAdmin] = useState({ name: '', email: '', role: 'moderator', isActive: true });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [password, setPassword] = useState('');

  useEffect(() => { if (!user) refreshUser(); }, [user, refreshUser]);

  useEffect(() => {
    if (!adminId || adminId === 'new') return;
    setLoading(true);
    fetch(`${API}/api/admin/admins/${adminId}`, { credentials: 'include' })
      .then(r => r.json())
      .then(b => { if (b.admin) setAdmin(b.admin); })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [adminId, API]);

  const handleSave = async () => {
    if (!admin.name || !admin.email) return alert('Name and email are required');
    setSaving(true);
    try {
      const method = (adminId && adminId !== 'new') ? 'PUT' : 'POST';
      const url = (method === 'POST') ? `${API}/api/admin/admins` : `${API}/api/admin/admins/${adminId}`;
      const body = method === 'POST' ? { ...admin, password } : { name: admin.name, email: admin.email, role: admin.role, isActive: admin.isActive, newPassword: password || undefined };
      const resp = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(body) });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'Save failed');
      router.push('/dashabord/authorized');
    } catch (err) {
      alert(err.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-white p-6 rounded shadow">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">{adminId === 'new' ? 'Create admin / moderator' : 'Edit account'}</h2>
        <div>
          <button onClick={() => router.push('/dashabord/authorized')} className="px-3 py-2 border rounded text-sm">Back</button>
        </div>
      </div>

      {loading ? <div className="text-center py-12">Loading…</div> : (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium">Full name</label>
            <input value={admin.name || ''} onChange={e => setAdmin(a=>({...a, name: e.target.value}))} className="w-full border px-3 py-2 rounded" />
          </div>
          <div>
            <label className="block text-sm font-medium">Email</label>
            <input value={admin.email || ''} onChange={e => setAdmin(a=>({...a, email: e.target.value}))} className="w-full border px-3 py-2 rounded" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium">Role</label>
              <select value={admin.role} onChange={e => setAdmin(a=>({...a, role: e.target.value}))} className="w-full border px-3 py-2 rounded">
                <option value="admin">Admin</option>
                <option value="moderator">Moderator</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium">Status</label>
              <select value={admin.isActive ? 'active' : 'disabled'} onChange={e => setAdmin(a=>({...a, isActive: e.target.value === 'active'}))} className="w-full border px-3 py-2 rounded">
                <option value="active">Active</option>
                <option value="disabled">Disabled</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium">Set new password (leave blank to keep current)</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full border px-3 py-2 rounded" />
          </div>

          <div className="flex gap-2">
            <button onClick={handleSave} className="px-3 py-2 bg-indigo-600 text-white rounded" disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
            <button onClick={() => router.push('/dashabord/authorized')} className="px-3 py-2 border rounded">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
