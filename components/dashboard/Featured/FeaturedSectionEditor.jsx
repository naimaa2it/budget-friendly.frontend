"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';

export default function FeaturedSectionEditor({ sectionId = null, onSuccess, onCancel }) {
  const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
  const isEdit = !!sectionId;

  const [title, setTitle]             = useState('');
  const [viewAllLink, setViewAllLink] = useState('/');
  const [isActive, setIsActive]       = useState(true);
  const [categoryId, setCategoryId]   = useState('');
  const [limit, setLimit]             = useState(10);
  const [selectedProducts, setSelectedProducts] = useState([]); // [{_id, title, images, price}]
  const [loading, setLoading]         = useState(false);
  const [saving, setSaving]           = useState(false);

  // product search
  const [query, setQuery]             = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching]     = useState(false);
  const searchTimer = useRef(null);

  // Load section on edit
  useEffect(() => {
    if (!isEdit) return;
    setLoading(true);
    fetch(`${API}/api/admin/featured/${sectionId}`, { credentials: 'include' })
      .then(r => r.json())
      .then(async b => {
        const s = b.section || {};
        setTitle(s.title || '');
        setViewAllLink(s.viewAllLink || '/');
        setIsActive(s.isActive !== false);
        setCategoryId(s.categoryId || '');
        setLimit(s.limit || 10);
        // load product details for selected ids
        if (s.productIds && s.productIds.length > 0) {
          const details = await Promise.all(
            s.productIds.map(id =>
              fetch(`${API}/api/admin/products/${id}`, { credentials: 'include' })
                .then(r => r.json())
                .then(b => b.product)
                .catch(() => null)
            )
          );
          setSelectedProducts(details.filter(Boolean));
        }
      })
      .catch(err => alert('Failed to load: ' + err.message))
      .finally(() => setLoading(false));
  }, [sectionId, isEdit, API]);

  // Product search with debounce
  const searchProducts = useCallback(async (q) => {
    if (!q.trim()) { setSearchResults([]); return; }
    setSearching(true);
    try {
      const r = await fetch(`${API}/api/admin/products?q=${encodeURIComponent(q)}&limit=8`, { credentials: 'include' });
      const b = await r.json();
      setSearchResults(b.items || []);
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }, [API]);

  useEffect(() => {
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => searchProducts(query), 350);
    return () => clearTimeout(searchTimer.current);
  }, [query, searchProducts]);

  const addProduct = (p) => {
    if (selectedProducts.find(s => s._id === p._id)) return;
    setSelectedProducts(prev => [...prev, p]);
    setQuery('');
    setSearchResults([]);
  };

  const removeProduct = (id) => setSelectedProducts(prev => prev.filter(p => p._id !== id));

  const moveProduct = (idx, dir) => {
    setSelectedProducts(prev => {
      const next = [...prev];
      const swap = idx + dir;
      if (swap < 0 || swap >= next.length) return next;
      [next[idx], next[swap]] = [next[swap], next[idx]];
      return next;
    });
  };

  const handleSave = async () => {
    if (!title.trim()) { alert('Title is required'); return; }
    setSaving(true);
    try {
      const body = {
        title: title.trim(),
        viewAllLink: viewAllLink.trim() || '/',
        isActive,
        categoryId: categoryId.trim(),
        limit: Number(limit) || 10,
        productIds: selectedProducts.map(p => p._id),
      };
      const url = isEdit
        ? `${API}/api/admin/featured/${sectionId}`
        : `${API}/api/admin/featured`;
      const method = isEdit ? 'PUT' : 'POST';
      const resp = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'Failed');
      onSuccess && onSuccess(data.section);
    } catch (err) {
      alert('Save failed: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const getProductThumb = (p) =>
    p?.images?.[0]?.url || '/assets/placeholder.svg';

  const getProductPrice = (p) =>
    p?.price ?? p?.variants?.[0]?.price ?? 0;

  if (loading) return (
    <div className="flex items-center justify-center py-16 text-gray-400">Loading…</div>
  );

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-2xl shadow space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">
        {isEdit ? 'Edit Featured Section' : 'New Featured Section'}
      </h2>

      {/* Title */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">Section Title *</label>
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="e.g. Eid Fest on Smart Televisions!"
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* View All Link */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">View All Link</label>
        <input
          value={viewAllLink}
          onChange={e => setViewAllLink(e.target.value)}
          placeholder="/category/electronics"
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Is Active toggle */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setIsActive(v => !v)}
          className={`relative w-12 h-6 rounded-full transition-colors ${isActive ? 'bg-blue-600' : 'bg-gray-300'}`}
        >
          <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${isActive ? 'translate-x-6' : ''}`} />
        </button>
        <span className="text-sm text-gray-700">{isActive ? 'Active (visible on homepage)' : 'Inactive (hidden)'}</span>
      </div>

      <hr />

      {/* Product Search */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          Add Products <span className="font-normal text-gray-400">(search &amp; pick)</span>
        </label>
        <div className="relative">
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search product by name…"
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {searching && (
            <span className="absolute right-3 top-2.5 text-xs text-gray-400">Searching…</span>
          )}
        </div>
        {searchResults.length > 0 && (
          <ul className="mt-1 border rounded-lg bg-white shadow-lg max-h-56 overflow-y-auto divide-y text-sm z-10">
            {searchResults.map(p => (
              <li
                key={p._id}
                className="flex items-center gap-3 px-3 py-2 hover:bg-blue-50 cursor-pointer"
                onClick={() => addProduct(p)}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={getProductThumb(p)}
                  alt={p.title}
                  className="w-10 h-10 object-cover rounded border shrink-0"
                  onError={e => { e.currentTarget.src = '/assets/placeholder.svg'; }}
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{p.title}</p>
                  <p className="text-gray-400 text-xs">৳{getProductPrice(p)}</p>
                </div>
                <span className="text-blue-500 font-semibold text-xs">+ Add</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Selected Products */}
      {selectedProducts.length > 0 && (
        <div>
          <p className="text-sm font-semibold text-gray-700 mb-2">
            Selected Products ({selectedProducts.length})
          </p>
          <ul className="space-y-2">
            {selectedProducts.map((p, idx) => (
              <li key={p._id} className="flex items-center gap-3 bg-gray-50 rounded-lg px-3 py-2 border">
                <div className="flex flex-col gap-1 mr-1">
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => moveProduct(idx, -1)}
                    className="text-gray-400 hover:text-gray-700 disabled:opacity-30 text-xs leading-none"
                  >▲</button>
                  <button
                    type="button"
                    disabled={idx === selectedProducts.length - 1}
                    onClick={() => moveProduct(idx, 1)}
                    className="text-gray-400 hover:text-gray-700 disabled:opacity-30 text-xs leading-none"
                  >▼</button>
                </div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={getProductThumb(p)}
                  alt={p.title}
                  className="w-12 h-12 object-cover rounded border shrink-0"
                  onError={e => { e.currentTarget.src = '/assets/placeholder.svg'; }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{p.title}</p>
                  <p className="text-xs text-gray-400">৳{getProductPrice(p)}</p>
                </div>
                <button
                  type="button"
                  onClick={() => removeProduct(p._id)}
                  className="text-red-400 hover:text-red-600 text-xs font-bold px-2"
                >Remove</button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <hr />

      {/* Category fallback */}
      <div>
        <p className="text-sm font-semibold text-gray-700 mb-1">
          Auto-fill from Category <span className="font-normal text-gray-400">(used only if no products are selected above)</span>
        </p>
        <div className="flex gap-3 items-center">
          <input
            value={categoryId}
            onChange={e => setCategoryId(e.target.value)}
            placeholder="Category ID (optional)"
            className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Limit</label>
            <input
              type="number"
              value={limit}
              min={1}
              max={50}
              onChange={e => setLimit(e.target.value)}
              className="w-16 border rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 transition"
        >
          {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Section'}
        </button>
        {onCancel && (
          <button
            onClick={onCancel}
            className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}
