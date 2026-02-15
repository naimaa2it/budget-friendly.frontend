"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/components/context/UserContext';

export default function ProductsList() {
  const { user, refreshUser } = useUser();
  const router = useRouter();
  const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');

  const fetchItems = async () => {
    setLoading(true);
    try {
      const resp = await fetch(`${API}/api/admin/products?limit=50&q=${encodeURIComponent(query || '')}`, { credentials: 'include' });
      const body = await resp.json();
      if (resp.ok) setItems(body.items || []);
      else throw new Error(body.error || 'Failed to load');
    } catch (err) {
      console.error('Load products error', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (!user) refreshUser(); }, [user, refreshUser]);

  useEffect(() => {
    const load = () => { fetchItems(); };
    load();
  }, [query]);

  const handleDelete = async (id) => {
    if (!confirm('Archive this product?')) return;
    try {
      const resp = await fetch(`${API}/api/admin/products/${id}`, { method: 'DELETE', credentials: 'include' });
      const body = await resp.json();
      if (!resp.ok) throw new Error(body.error || 'Delete failed');
      fetchItems();
    } catch (err) {
      alert(err.message || 'Failed');
    }
  };

  return (
    <div className="max-w-6xl mx-auto mt-6 bg-white p-6 rounded shadow">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Products</h2>
        <div className="flex items-center gap-2">
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search products" className="border px-3 py-2 rounded" />
          <a href="/dashabord/products/new" className="px-3 py-2 bg-green-600 text-white rounded text-sm">Create product</a>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading…</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-gray-600">
              <tr>
                <th className="py-2">Title</th>
                <th className="py-2">Price</th>
                <th className="py-2">Inventory</th>
                <th className="py-2">Status</th>
                <th className="py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map(p => (
                <tr key={p._id} className="border-t">
                  <td className="py-3">
                    <div className="flex items-center gap-3">
                      {p.images?.[0]?.url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.images[0].url} alt="" className="w-12 h-12 object-cover rounded"/>
                      ) : (
                        <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center text-xs text-gray-400">No image</div>
                      )}
                      <div>
                        <div className="font-medium">{p.title}</div>
                        <div className="text-xs text-gray-500">{p.category} · {p.tags?.slice(0,3).join(', ')}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3">{p.price ? `₹${p.price}` : p.variants?.[0]?.price ? `₹${p.variants[0].price}` : '-'}</td>
                  <td className="py-3">{p.inventory ?? (p.variants?.reduce((s,v)=>s+ (v.inventory||0),0) || 0)}</td>
                  <td className="py-3"><span className={`px-2 py-1 text-xs rounded ${p.status==='published' ? 'bg-green-50 text-green-700' : p.status==='draft' ? 'bg-yellow-50 text-yellow-700' : 'bg-gray-50 text-gray-700'}`}>{p.status}</span></td>
                  <td className="py-3">
                    <div className="flex gap-2">
                      <a className="px-2 py-1 border rounded text-sm" href={`/dashabord/products/${p._id}`}>Edit</a>
                      <button className="px-2 py-1 border rounded text-sm text-red-600" onClick={() => handleDelete(p._id)}>Archive</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {items.length === 0 && <div className="text-center py-8 text-gray-500">No products found</div>}
        </div>
      )}
    </div>
  );
}
