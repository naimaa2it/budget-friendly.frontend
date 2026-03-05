"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/components/context/UserContext';

export default function CustomerEditor({ userId }) {
  const router = useRouter();
  const { user, refreshUser } = useUser();
  const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (!user) refreshUser(); }, [user, refreshUser]);

  useEffect(() => {
    if (!userId || userId === 'new') return;
    setLoading(true);
    fetch(`${API}/api/admin/users/${userId}`, { credentials: 'include' })
      .then(r => r.json())
      .then(b => { if (b.user) setCustomer(b.user); })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [userId, API]);

  const handleSave = async () => {
    if (!customer) return;
    setSaving(true);
    try {
      const resp = await fetch(`${API}/api/admin/users/${userId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ name: customer.name, isVerified: customer.isVerified }) });
      const body = await resp.json();
      if (!resp.ok) throw new Error(body.error || 'Save failed');
      router.push('/dashabord/customers');
    } catch (err) {
      alert(err.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  if (!customer && loading) return <div className="text-center py-12">Loading…</div>;
  if (!customer) return <div className="max-w-4xl mx-auto bg-white p-6 rounded shadow">No user selected</div>;

  return (
    <div className="max-w-4xl mx-auto bg-white p-6 rounded shadow">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">{userId === 'new' ? 'Create user' : 'Edit customer'}</h2>
        <div>
          <button onClick={() => router.push('/dashabord/customers')} className="px-3 py-2 border rounded text-sm">Back</button>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium">Email</label>
          <input value={customer.email || ''} readOnly className="w-full border px-3 py-2 rounded bg-gray-50" />
        </div>

        <div>
          <label className="block text-sm font-medium">Full name</label>
          <input value={customer.name || ''} onChange={e => setCustomer(c => ({ ...c, name: e.target.value }))} className="w-full border px-3 py-2 rounded" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium">Provider</label>
            <input value={customer.provider || ''} readOnly className="w-full border px-3 py-2 rounded bg-gray-50" />
          </div>
          <div>
            <label className="block text-sm font-medium">Created</label>
            <input value={new Date(customer.createdAt).toLocaleString()} readOnly className="w-full border px-3 py-2 rounded bg-gray-50" />
          </div>
        </div>

        <div>
          <label className="inline-flex items-center gap-2">
            <input type="checkbox" checked={!!customer.isVerified} onChange={e => setCustomer(c => ({ ...c, isVerified: e.target.checked }))} />
            <span className="text-sm">Verified</span>
          </label>
        </div>

        <div className="flex gap-2">
          <button onClick={handleSave} className="px-3 py-2 bg-indigo-600 text-white rounded" disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
          <button onClick={() => router.push('/dashabord/customers')} className="px-3 py-2 border rounded">Cancel</button>
        </div>
      </div>
    </div>
  );
}
