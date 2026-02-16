"use client";

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useUser } from '@/components/context/UserContext';

export default function ProductsList() {
  const { user, refreshUser } = useUser();
  const router = useRouter();
  const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [categories, setCategories] = useState([]);
  const [selectedMain, setSelectedMain] = useState(null);
  const [selectedSub, setSelectedSub] = useState(null);
  const [selectedChild, setSelectedChild] = useState(null);
  const [sort, setSort] = useState('newest');

  const applySort = (list, sortKey) => {
    const copy = [...(list || [])];
    switch (sortKey) {
      case 'price_asc':
        return copy.sort((a, b) => (Number(a.price || a.variants?.[0]?.price || 0) - Number(b.price || b.variants?.[0]?.price || 0)));
      case 'price_desc':
        return copy.sort((a, b) => (Number(b.price || b.variants?.[0]?.price || 0) - Number(a.price || a.variants?.[0]?.price || 0)));
      case 'sold_desc':
        return copy.sort((a, b) => (Number(b.monthlySold || 0) - Number(a.monthlySold || 0)));
      case 'newest':
      default:
        return copy.sort((a, b) => (new Date(b.createdAt || 0) - new Date(a.createdAt || 0)));
    }
  };

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const catId = selectedChild?._id || selectedSub?._id || selectedMain?._id || '';
      const q = `${API}/api/admin/products?limit=50&q=${encodeURIComponent(query || '')}${catId ? `&categoryId=${encodeURIComponent(catId)}` : ''}`;
      const resp = await fetch(q, { credentials: 'include' });
      const body = await resp.json();
      if (resp.ok) setItems(applySort(body.items || [], sort));
      else throw new Error(body.error || 'Failed to load');
    } catch (err) {
      console.error('Load products error', err);
    } finally {
      setLoading(false);
    }
  }, [API, query, selectedMain, selectedSub, selectedChild, sort]);

  useEffect(() => { if (!user) refreshUser(); }, [user, refreshUser]);

  useEffect(() => {
    // load categories for filter
    fetch(`${API}/api/products/categories`).then(r => r.json()).then(b => setCategories(b.categories || [])).catch(() => setCategories([]));
  }, [API]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const handleDelete = async (id, force = false) => {
    const msg = force ? 'Permanently delete this product? This cannot be undone.' : 'Archive this product?';
    if (!confirm(msg)) return;
    try {
      const url = `${API}/api/admin/products/${id}${force ? '?force=true' : ''}`;
      const resp = await fetch(url, { method: 'DELETE', credentials: 'include' });
      const body = await resp.json();
      if (!resp.ok) throw new Error(body.error || 'Delete failed');
      fetchItems();
    } catch (err) {
      alert(err.message || 'Failed');
    }
  };

  return (
    <div className="max-w-6xl mx-auto mt-6 bg-white p-6 rounded shadow">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-lg font-semibold">Products</h2>
        <Link href="/dashabord/products/new" className="px-3 py-2 bg-green-600 text-white rounded text-sm">Create product</Link>
      </div>

      {/* filters / search / sorting — placed on the next line */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <select value={selectedMain?._id || ''} onChange={e => { const id = e.target.value; const main = categories.find(c=>String(c._id)===id)||null; setSelectedMain(main); setSelectedSub(null); setSelectedChild(null); }} className="border px-3 py-2 rounded">
          <option value="">All categories</option>
          {categories.map(c=> <option key={c._id} value={c._id}>{c.name}</option>)}
        </select>

        <select value={selectedSub?._id || ''} onChange={e => { const id = e.target.value; const sub = (selectedMain?.children||[]).find(c=>String(c._id)===id)||null; setSelectedSub(sub); setSelectedChild(null); }} className="border px-3 py-2 rounded">
          <option value="">Sub category</option>
          {(selectedMain?.children||[]).map(c=> <option key={c._id} value={c._id}>{c.name}</option>)}
        </select>

        <select value={selectedChild?._id || ''} onChange={e => { const id = e.target.value; const child = (selectedSub?.children||[]).find(c=>String(c._id)===id)||null; setSelectedChild(child); }} className="border px-3 py-2 rounded">
          <option value="">Sub‑sub category</option>
          {(selectedSub?.children||[]).map(c=> <option key={c._id} value={c._id}>{c.name}</option>)}
        </select>

        <input aria-label="Search products" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search products" className="border px-3 py-2 rounded flex-1 min-w-45" />

        <select value={sort} onChange={e => setSort(e.target.value)} className="border px-3 py-2 rounded w-48">
          <option value="newest">Sort: Newest</option>
          <option value="price_asc">Price: Low → High</option>
          <option value="price_desc">Price: High → Low</option>
          <option value="sold_desc">Best selling</option>
        </select>
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
                      <Link className="px-2 py-1 border rounded text-sm" href={`/dashabord/products/${p._id}`}>Edit</Link>
                      <button className="px-2 py-1 border rounded text-sm text-gray-700" onClick={() => handleDelete(p._id)}>Archive</button>
                      <button className="px-2 py-1 border rounded text-sm text-white bg-red-600 hover:bg-red-700" onClick={() => handleDelete(p._id, true)}>Delete</button>
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
