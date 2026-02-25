"use client";

import React, { useState, useEffect } from 'react';
import { useUser } from '@/components/context/UserContext';

export default function AddressManager() {
  const { user, refreshUser } = useUser();
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    city: '',
    zone: '',
    address: '',
    type: 'Home'
  });

  const [locationData, setLocationData] = useState({});
  const [cities, setCities] = useState([]);
  const [zones, setZones] = useState([]);

  const API = process.env.NEXT_PUBLIC_API_URL || '';

  const loadAddresses = async () => {
    try {
      const res = await fetch(`${API}/api/user/addresses`, { credentials: 'include' });
      const json = await res.json();
      setAddresses(json.addresses || []);
    } catch (err) {
      console.error('failed to load addresses', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLocations = async () => {
    try {
      const resp = await fetch('/api/locations');
      const json = await resp.json();
      setLocationData(json.locationData || {});
      const cityList = json.locationData ? Object.keys(json.locationData) : [];
      setCities(cityList);
    } catch (err) {
      console.error('Failed to load location data', err);
    }
  };

  useEffect(() => {
    // run once on mount - do not refer to outer helpers so lint is happy
    const init = async () => {
      const base = process.env.NEXT_PUBLIC_API_URL || '';
      try {
        const res = await fetch(`${base}/api/user/addresses`, { credentials: 'include' });
        const json = await res.json();
        setAddresses(json.addresses || []);
      } catch (err) {
        console.error('failed to load addresses', err);
      }

      try {
        const resp = await fetch('/api/locations');
        const json = await resp.json();
        setLocationData(json.locationData || {});
        const cityList = json.locationData ? Object.keys(json.locationData) : [];
        setCities(cityList);
      } catch (err) {
        console.error('Failed to load location data', err);
      }

      setLoading(false);
    };
    init();
  }, []);

  useEffect(() => {
    if (formData.city && locationData[formData.city]) {
      const availableZones = Object.keys(locationData[formData.city].zones || {});
      setZones(availableZones);
      setFormData(prev => ({ ...prev, zone: '' }));
    }
  }, [formData.city, locationData]);

  const openForm = (addr) => {
    if (addr) {
      setEditingId(addr._id);
      setFormData({
        fullName: addr.fullName || '',
        email: addr.email || '',
        phone: addr.phone || '',
        city: addr.city || '',
        zone: addr.zone || '',
        address: addr.address || '',
        type: addr.type || 'Home'
      });
    } else {
      setEditingId(null);
      setFormData({
        fullName: '',
        email: '',
        phone: '',
        city: '',
        zone: '',
        address: '',
        type: 'Home'
      });
    }
    setFormOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = editingId ? `${API}/api/user/addresses/${editingId}` : `${API}/api/user/addresses`;
      const method = editingId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const json = await res.json();
      if (json.ok) {
        loadAddresses();
        setFormOpen(false);
        refreshUser();
      } else {
        alert(json.error || 'Failed to save address');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to save address');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Remove this address?')) return;
    try {
      const res = await fetch(`${API}/api/user/addresses/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      const json = await res.json();
      if (json.ok) {
        loadAddresses();
        refreshUser();
      } else {
        alert(json.error || 'Failed to delete');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to delete');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold">My Addresses</h2>
        <button
          onClick={() => openForm(null)}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Add Address
        </button>
      </div>
      {/* inline form */}
      {formOpen && (
        <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-lg mb-6">
          <h3 className="text-2xl font-semibold mb-6 text-center">
            {editingId ? 'Edit Address' : 'Add Address'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Full Name</label>
                <input
                  type="text"
                  value={formData.fullName}
                  placeholder="John Doe"
                  onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full border px-3 py-2 rounded focus:ring focus:ring-indigo-200"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  placeholder="you@example.com"
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  className="w-full border px-3 py-2 rounded focus:ring focus:ring-indigo-200"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  placeholder="017XXXXXXXX"
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full border px-3 py-2 rounded focus:ring focus:ring-indigo-200"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">City</label>
                <select
                  value={formData.city}
                  onChange={e => setFormData({ ...formData, city: e.target.value })}
                  className="w-full border px-3 py-2 rounded focus:ring focus:ring-indigo-200"
                  required
                >
                  <option value="">Select city</option>
                  {cities.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Zone</label>
                <select
                  value={formData.zone}
                  onChange={e => setFormData({ ...formData, zone: e.target.value })}
                  className="w-full border px-3 py-2 rounded focus:ring focus:ring-indigo-200"
                  required
                >
                  <option value="">Select zone</option>
                  {zones.map(z => <option key={z} value={z}>{z}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Address</label>
              <input
                type="text"
                value={formData.address}
                placeholder="Street, house #, area"
                onChange={e => setFormData({ ...formData, address: e.target.value })}
                className="w-full border px-3 py-2 rounded focus:ring focus:ring-indigo-200"
                required
              />
            </div>
            <div className="flex gap-6 items-center">
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="type"
                  value="Home"
                  checked={formData.type === 'Home'}
                  onChange={() => setFormData({ ...formData, type: 'Home' })}
                  className="mr-2"
                />
                Home
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="type"
                  value="Office"
                  checked={formData.type === 'Office'}
                  onChange={() => setFormData({ ...formData, type: 'Office' })}
                  className="mr-2"
                />
                Office
              </label>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={() => setFormOpen(false)}
                className="px-4 py-2 border rounded hover:bg-gray-100 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition"
              >
                Save
              </button>
            </div>
          </form>
        </div>
      )}
      {loading && <p>Loading...</p>}
      {!loading && addresses.length === 0 && <p className="text-gray-600">No addresses saved yet.</p>}
      {!loading && addresses.length > 0 && (
        <div className="space-y-4">
          {addresses.map(addr => (
            <div key={addr._id} className="p-4 border rounded-lg bg-white">
              <div className="flex justify-between">
                <div>
                  <p className="font-semibold">{addr.fullName}</p>
                  <p className="text-sm">{addr.phone}</p>
                  <p className="text-sm">{addr.email}</p>
                  <p className="text-sm">{addr.address}, {addr.zone}, {addr.city}</p>
                  <p className="text-sm italic">{addr.type}</p>
                </div>
                <div className="flex flex-col gap-1">
                  <button onClick={() => openForm(addr)} className="text-blue-600 underline text-sm">Edit</button>
                  <button onClick={() => handleDelete(addr._id)} className="text-red-600 underline text-sm">Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
