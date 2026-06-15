"use client";

import React, { useState, useEffect } from 'react';

export default function CategorySelector({ selectedCategories = [], onChange }) {
  const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDesc, setNewCategoryDesc] = useState('');
  const [creating, setCreating] = useState(false);

  const fetchCategories = async () => {
    try {
      const r = await fetch(`${API}/api/admin/blog-categories`, {
        credentials: 'include'
      });
      const b = await r.json();
      if (r.ok) {
        setCategories(b.categories || []);
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleToggleCategory = (categoryId) => {
    const isSelected = selectedCategories.includes(categoryId);
    if (isSelected) {
      onChange(selectedCategories.filter(id => id !== categoryId));
    } else {
      onChange([...selectedCategories, categoryId]);
    }
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;

    setCreating(true);
    try {
      const r = await fetch(`${API}/api/admin/blog-categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: newCategoryName,
          description: newCategoryDesc
        })
      });

      const b = await r.json();
      if (r.ok) {
        setCategories([...categories, b.category]);
        onChange([...selectedCategories, b.category._id]);
        setNewCategoryName('');
        setNewCategoryDesc('');
        setShowCreateModal(false);
      } else {
        alert(b.error || 'Failed to create category');
      }
    } catch (err) {
      console.error('Error creating category:', err);
      alert('Failed to create category');
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return <div className="text-sm text-gray-500">Loading categories...</div>;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">
          Categories
        </label>
        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          + Create New
        </button>
      </div>

      {categories.length === 0 ? (
        <p className="text-sm text-gray-500 italic">No categories available. Create one!</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => {
            const isSelected = selectedCategories.includes(cat._id);
            return (
              <button
                key={cat._id}
                type="button"
                onClick={() => handleToggleCategory(cat._id)}
                className={`px-3 py-1.5 text-sm rounded-full border transition ${
                  isSelected
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
                }`}
              >
                {cat.name}
              </button>
            );
          })}
        </div>
      )}

      {/* Create Category Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <h3 className="text-lg font-semibold mb-4">Create New Category</h3>
            
            <form onSubmit={handleCreateCategory} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="e.g., Technology, Lifestyle"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description (optional)
                </label>
                <textarea
                  value={newCategoryDesc}
                  onChange={(e) => setNewCategoryDesc(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                  rows={3}
                  placeholder="Brief description of this category"
                />
              </div>

              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewCategoryName('');
                    setNewCategoryDesc('');
                  }}
                  className="px-4 py-2 text-gray-700 border rounded-md hover:bg-gray-50"
                  disabled={creating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  disabled={creating}
                >
                  {creating ? 'Creating...' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
