"use client";

import React, { useEffect, useState } from 'react';
import { useUser } from '@/components/context/UserContext';
import { FaChevronRight, FaChevronDown } from 'react-icons/fa';

function CategoryNode({ node, depth = 0, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div className="border-b py-4" style={{ paddingLeft: depth * 12 }}>
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button onClick={() => hasChildren && setExpanded(!expanded)} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100">
            {hasChildren ? (expanded ? <FaChevronDown className="text-gray-700" /> : <FaChevronRight className="text-gray-700" />) : <div className="w-2 h-2" />}
          </button>

          <div className="w-12 h-12 bg-gray-50 rounded flex items-center justify-center overflow-hidden">
            <img src={(node.images && node.images[0] && node.images[0].url) ? node.images[0].url : '/assets/placeholder.svg'} alt={node.name} className="w-full h-full object-contain" />
          </div>

          <div>
            <div className="font-medium">{node.name}</div>
            <div className="text-xs text-gray-500">ID: {String(node._id).slice(0,8)}</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-xs bg-slate-900 text-white px-2 py-1 rounded-full">{node.level === 0 ? 'Main' : `L${node.level}`}</div>
          <div className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full">{node.children?.length || 0}</div>
          <a className="px-2 py-1 border rounded text-sm" href={`/dashabord/categories/${node._id}`}>Edit</a>
          {onDelete && <button onClick={() => onDelete(node._id)} className="px-2 py-1 border rounded text-sm text-red-600">Delete</button>}
        </div>
      </div>

      {expanded && hasChildren && (
        <div className="mt-3 space-y-2">
          {node.children.map(child => <CategoryNode key={child._id} node={child} depth={depth + 1} onDelete={onDelete} />)}
        </div>
      )}
    </div>
  );
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

  // load once on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { const load = () => { fetchCategories(); }; load(); }, []);

  const handleDelete = async (id) => {
    if (!confirm('Delete this category? This will fail if category has children or products.')) return;
    try {
      const resp = await fetch(`${API}/api/admin/categories/${id}`, { method: 'DELETE', credentials: 'include' });
      const body = await resp.json();
      if (!resp.ok) throw new Error(body.error || 'Delete failed');
      fetchCategories();
    } catch (err) {
      alert(err.message || 'Delete failed');
    }
  };

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
            <div className="space-y-3">{items.map(n => <CategoryNode key={n._id} node={n} onDelete={user?.role === 'admin' ? handleDelete : undefined} />)}</div>
          )}
        </div>
      )}
    </div>
  );
}
