"use client";

import React, { useEffect, useState } from 'react';
import { useUser } from '@/components/context/UserContext';

export default function SettingsForm() {
  const { user, refreshUser } = useUser();
  const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (!user) refreshUser(); }, [user, refreshUser]);

  useEffect(() => {
    setLoading(true);
    fetch(`${API}/api/admin/settings`, { credentials: 'include' })
      .then(r => r.json())
      .then(b => setSettings(b.settings || null))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [API]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const resp = await fetch(`${API}/api/admin/settings`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(settings) });
      const body = await resp.json();
      if (!resp.ok) throw new Error(body.error || 'Save failed');
      alert('Settings saved');
    } catch (err) {
      alert(err.message || 'Failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !settings) return <div className="max-w-4xl mx-auto bg-white p-6 rounded shadow text-center">Loading settings…</div>;

  return (
    <div className="max-w-4xl mx-auto bg-white p-6 rounded shadow">
      <h2 className="text-lg font-semibold mb-4">Store settings</h2>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium">Store name</label>
          <input value={settings.storeName || ''} onChange={e => setSettings(s => ({ ...s, storeName: e.target.value }))} className="w-full border px-3 py-2 rounded" />
        </div>
        <div>
          <label className="block text-sm font-medium">Contact email</label>
          <input value={settings.storeEmail || ''} onChange={e => setSettings(s => ({ ...s, storeEmail: e.target.value }))} className="w-full border px-3 py-2 rounded" />
        </div>

        <div>
          <label className="block text-sm font-medium">Currency</label>
          <input value={settings.currency || 'INR'} onChange={e => setSettings(s => ({ ...s, currency: e.target.value }))} className="w-full border px-3 py-2 rounded" />
        </div>
        <div>
          <label className="block text-sm font-medium">Tax %</label>
          <input type="number" value={settings.taxPercent || 0} onChange={e => setSettings(s => ({ ...s, taxPercent: Number(e.target.value) }))} className="w-full border px-3 py-2 rounded" />
        </div>

        <div>
          <label className="block text-sm font-medium">Low stock threshold</label>
          <input type="number" value={settings.lowStockThreshold || 5} onChange={e => setSettings(s => ({ ...s, lowStockThreshold: Number(e.target.value) }))} className="w-full border px-3 py-2 rounded" />
        </div>
        <div>
          <label className="block text-sm font-medium">Default shipping (flat)</label>
          <input type="number" value={settings.defaultShipping || 0} onChange={e => setSettings(s => ({ ...s, defaultShipping: Number(e.target.value) }))} className="w-full border px-3 py-2 rounded" />
        </div>

        <div>
          <label className="block text-sm font-medium">Cloudinary folder</label>
          <input value={settings.cloudinaryFolder || ''} onChange={e => setSettings(s => ({ ...s, cloudinaryFolder: e.target.value }))} className="w-full border px-3 py-2 rounded" />
        </div>

        <div>
          <label className="block text-sm font-medium">Payment providers</label>
          <div className="mt-2 space-y-2">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={settings.paymentProviders?.stripe?.enabled || false} onChange={e => setSettings(s => ({ ...s, paymentProviders: { ...(s.paymentProviders||{}), stripe: { ...(s.paymentProviders?.stripe||{}), enabled: e.target.checked } } }))} />
              <span className="text-sm">Stripe (enabled)</span>
            </label>
            <input placeholder="Stripe public key" value={settings.paymentProviders?.stripe?.publicKey || ''} onChange={e => setSettings(s => ({ ...s, paymentProviders: { ...(s.paymentProviders||{}), stripe: { ...(s.paymentProviders?.stripe||{}), publicKey: e.target.value } } }))} className="w-full border px-3 py-2 rounded" />

            <label className="flex items-center gap-2 mt-2">
              <input type="checkbox" checked={settings.paymentProviders?.razorpay?.enabled || false} onChange={e => setSettings(s => ({ ...s, paymentProviders: { ...(s.paymentProviders||{}), razorpay: { ...(s.paymentProviders?.razorpay||{}), enabled: e.target.checked } } }))} />
              <span className="text-sm">Razorpay (enabled)</span>
            </label>
            <input placeholder="Razorpay key id" value={settings.paymentProviders?.razorpay?.keyId || ''} onChange={e => setSettings(s => ({ ...s, paymentProviders: { ...(s.paymentProviders||{}), razorpay: { ...(s.paymentProviders?.razorpay||{}), keyId: e.target.value } } }))} className="w-full border px-3 py-2 rounded" />
          </div>
        </div>
      </div>

      <div className="mt-6 flex gap-3">
        {user?.role === 'admin' ? (
          <button onClick={handleSave} className="px-4 py-2 bg-indigo-600 text-white rounded" disabled={saving}>{saving ? 'Saving…' : 'Save settings'}</button>
        ) : (
          <button className="px-4 py-2 border rounded bg-gray-50 text-gray-500" disabled>Read-only</button>
        )}
        <button onClick={() => window.location.reload()} className="px-4 py-2 border rounded">Reset</button>
      </div>

      <div className="mt-6 text-xs text-gray-500">Only admins can update store settings. Payment provider secrets should be stored in environment variables for production.</div>
    </div>
  );
}
