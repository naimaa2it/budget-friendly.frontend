"use client";

import React, { useEffect, useState } from 'react';
import { useUser } from '@/components/context/UserContext';

function renderTree(nodes, onEdit, depth = 0) {
  return nodes.map(n => (
    <div key={n._id} className="border p-3 rounded mb-2 ml-" style={{ marginLeft: depth * 12 }}>
      <div className="flex justify-between items-center">
        <div>
          <div className="font-medium">{n.name}</div>
          <div className="text-xs text-gray-500">Level {n.level}{n.children?.length ? ` · ${n.children.length} sub` : ''}</div>
        </div>
        <div className="flex gap-2">
          <a className="px-2 py-1 border rounded text-sm" href={`/dashabord/categories/${n._id}`}>Edit</a>
        </div>
      </div>
      {n.children && n.children.length > 0 && (
        <div className="mt-3">{renderTree(n.children, onEdit, depth + 1)}</div>
      )}
    </div>
  ));
}

export default function CategoriesList() {
  const { user, refreshUser } = useUser();
  const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => { if (!user) refreshUser(); }, [user, refreshUser]);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const resp = await fetch(`${API}/api/products/categories`);
      const body = await resp.json();
      if (resp.ok) setItems(body.categories || []);
      else throw new Error(body.error || 'Failed');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { const load = () => { fetchCategories(); }; load(); }, []);

  return (
    <div className="max-w-6xl mx-auto bg-white p-6 rounded shadow">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Categories</h2>
        <div>
          <a href="/dashabord/categories/new" className="px-3 py-2 bg-green-600 text-white rounded text-sm">Create category</a>
        </div>
      </div>

      {loading ? <div className="text-center py-8 text-gray-500">Loading…</div> : (
        <div className="space-y-3">
          {items.length === 0 ? (
            <div className="text-center text-gray-500">No categories defined yet.</div>
          ) : (
            <div>{renderTree(items)}</div>
          )}
        </div>
      )}
    </div>
  );
}
