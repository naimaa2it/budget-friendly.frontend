"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useUser } from '@/components/context/UserContext';
import { FaChevronRight, FaChevronDown, FaEdit, FaTrash, FaPlus } from 'react-icons/fa';

export default function CategoryManager() {
  const { user, refreshUser } = useUser();
  const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
  
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal states
  const [showCreateMain, setShowCreateMain] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [expandedIds, setExpandedIds] = useState(new Set());

  useEffect(() => { if (!user) refreshUser(); }, [user, refreshUser]);
  
  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const resp = await fetch(`${API}/api/products/categories`);
      const body = await resp.json();
      if (resp.ok) setCategories(body.categories || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [API]);
  
  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  const toggleExpand = (id) => {
    const newSet = new Set(expandedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setExpandedIds(newSet);
  };

  const handleDelete = async (cat) => {
    if (!user || user.role !== 'admin') return alert('Only admin can delete');
    if (!confirm(`Delete "${cat.name}"? This will fail if it has children or products.`)) return;
    
    try {
      const resp = await fetch(`${API}/api/admin/categories/${cat._id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      const body = await resp.json();
      if (!resp.ok) throw new Error(body.error || 'Delete failed');
      fetchCategories();
    } catch (err) {
      alert(err.message);
    }
  };

  const filterCategories = (cats) => {
    if (!searchTerm) return cats;
    const term = searchTerm.toLowerCase();
    return cats.filter(cat => {
      if (cat.name.toLowerCase().includes(term)) return true;
      if (cat.children && cat.children.length) {
        return filterCategories(cat.children).length > 0;
      }
      return false;
    });
  };

  const renderCategory = (cat, depth = 0) => {
    const hasChildren = cat.children && cat.children.length > 0;
    const isExpanded = expandedIds.has(cat._id);
    const levelLabel = cat.level === 0 ? 'Main' : cat.level === 1 ? 'Sub' : 'Sub-Sub';
    
    return (
      <div key={cat._id} style={{ paddingLeft: depth * 20 }}>
        <div className="flex items-center justify-between py-3 px-4 border-b hover:bg-gray-50">
          <div className="flex items-center gap-4 flex-1">
            <button
              onClick={() => hasChildren && toggleExpand(cat._id)}
              className="w-6 h-6 flex items-center justify-center"
            >
              {hasChildren ? (
                isExpanded ? <FaChevronDown className="text-gray-600" /> : <FaChevronRight className="text-gray-600" />
              ) : <span className="w-2 h-2 bg-gray-300 rounded-full"></span>}
            </button>
            
            <div className="w-12 h-12 bg-gray-100 rounded overflow-hidden flex items-center justify-center">
              {cat.images && cat.images[0] ? (
                <img src={cat.images[0].url} alt={cat.name} className="w-full h-full object-cover" />
              ) : (
                <div className="text-gray-400 text-xs">No img</div>
              )}
            </div>
            
            <div>
              <div className="font-medium">{cat.name}</div>
              <div className="text-xs text-gray-500">ID: {String(cat._id).slice(0, 8)}</div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <span className="text-xs bg-slate-900 text-white px-2 py-1 rounded-full">{levelLabel}</span>
            {hasChildren && <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full">{cat.children.length}</span>}
            
            <button
              onClick={() => setEditingCategory(cat)}
              className="p-2 text-indigo-600 hover:bg-indigo-50 rounded"
              title="Edit & manage children"
            >
              <FaEdit />
            </button>
            
            {user?.role === 'admin' && (
              <button
                onClick={() => handleDelete(cat)}
                className="p-2 text-red-600 hover:bg-red-50 rounded"
                title="Delete"
              >
                <FaTrash />
              </button>
            )}
          </div>
        </div>
        
        {isExpanded && hasChildren && (
          <div>
            {cat.children.map(child => renderCategory(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto bg-white rounded shadow">
      <div className="p-6 border-b">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold">Categories</h2>
          <button
            onClick={() => setShowCreateMain(true)}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-2"
          >
            <FaPlus /> Create Main Category
          </button>
        </div>
        
        <input
          type="text"
          placeholder="Search categories by name..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full border px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-indigo-100"
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-purple-50">
            <tr>
              <th className="text-left px-4 py-3 text-sm font-medium">#</th>
              <th className="text-left px-4 py-3 text-sm font-medium">Category</th>
              <th className="text-left px-4 py-3 text-sm font-medium">Level</th>
              <th className="text-left px-4 py-3 text-sm font-medium">Parent Category</th>
              <th className="text-left px-4 py-3 text-sm font-medium">Children</th>
              <th className="text-left px-4 py-3 text-sm font-medium">Actions</th>
            </tr>
          </thead>
        </table>

        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading...</div>
        ) : (
          <div>
            {filterCategories(categories).length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                {searchTerm ? 'No categories match your search' : 'No categories yet'}
              </div>
            ) : (
              filterCategories(categories).map(cat => renderCategory(cat))
            )}
          </div>
        )}
      </div>

      {/* Create Main Category Modal */}
      {showCreateMain && (
        <CreateMainModal
          API={API}
          onClose={() => setShowCreateMain(false)}
          onSuccess={() => {
            setShowCreateMain(false);
            fetchCategories();
          }}
        />
      )}

      {/* Edit Category & Manage Children Modal */}
      {editingCategory && (
        <EditCategoryModal
          API={API}
          category={editingCategory}
          userRole={user?.role}
          onClose={() => setEditingCategory(null)}
          onSuccess={() => {
            setEditingCategory(null);
            fetchCategories();
          }}
        />
      )}
    </div>
  );
}

// Create Main Category Modal
function CreateMainModal({ API, onClose, onSuccess }) {
  const [name, setName] = useState('');
  const [images, setImages] = useState([]);
  const [saving, setSaving] = useState(false);

  const handleFile = async (file) => {
    const preview = URL.createObjectURL(file);
    const tempId = Date.now() + Math.random();
    setImages(imgs => [...imgs, { url: preview, __local: true, __tempId: tempId }]);

    try {
      const fd = new FormData();
      fd.append('file', file);
      const resp = await fetch(`${API}/api/admin/upload`, {
        method: 'POST',
        body: fd,
        credentials: 'include'
      });
      const body = await resp.json();
      if (!resp.ok) throw new Error(body.error || 'Upload failed');
      
      const asset = {
        public_id: body.asset.public_id,
        url: body.asset.url,
        width: body.asset.width,
        height: body.asset.height,
        format: body.asset.format
      };
      
      setImages(imgs => imgs.map(img => (img.__tempId === tempId ? asset : img)));
      try { URL.revokeObjectURL(preview); } catch (e) {}
    } catch (err) {
      setImages(imgs => imgs.filter(i => i.__tempId !== tempId));
      alert(err.message || 'Upload failed');
    }
  };

  const handleSave = async () => {
    if (!name.trim()) return alert('Category name is required');
    setSaving(true);
    try {
      const payload = { name: name.trim(), isActive: true };
      const uploadedImages = images.filter(i => !i.__local && !i.__tempId && i.public_id);
      if (uploadedImages.length > 0) {
        payload.images = uploadedImages;
      }
      
      const resp = await fetch(`${API}/api/admin/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'Failed to create');
      onSuccess(data.category);
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h3 className="text-xl font-semibold mb-4">Create Main Category</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Category Name</label>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Enter category name"
                className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-indigo-100"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Images</label>
              <div className="flex gap-3 flex-wrap">
                {images.map((img, idx) => (
                  <div key={img.public_id || img.__tempId || `img-${idx}`} className="relative w-20 h-20 bg-gray-50 border rounded overflow-hidden">
                    <img src={img.url} alt="" className="w-full h-full object-cover" />
                    {img.__local && (
                      <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent"></div>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => setImages(imgs => imgs.filter((_, i) => i !== idx))}
                      disabled={img.__local}
                      className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center hover:bg-red-700 disabled:opacity-50"
                    >
                      ×
                    </button>
                  </div>
                ))}
                <label className="w-20 h-20 flex items-center justify-center border border-dashed rounded cursor-pointer hover:bg-gray-50">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
                  />
                  <span className="text-2xl text-gray-400">+</span>
                </label>
              </div>
            </div>
          </div>

          <div className="flex gap-2 mt-6">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
            >
              {saving ? 'Creating...' : 'Create'}
            </button>
            <button onClick={onClose} className="px-4 py-2 border rounded hover:bg-gray-50">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Edit Category & Manage Children Modal
function EditCategoryModal({ API, category, userRole, onClose, onSuccess }) {
  const [name, setName] = useState(category.name);
  const [images, setImages] = useState(category.images || []);
  const [originalImages, setOriginalImages] = useState(category.images || []);
  const [children, setChildren] = useState(category.children || []);
  const [saving, setSaving] = useState(false);
  
  // Batch add children
  const [newChildren, setNewChildren] = useState([{ name: '', images: [] }]);

  const canAddChildren = category.level < 2; // Main (0) and Sub (1) can add children

  const handleFile = async (file, isParent = true, childIndex = null) => {
    const preview = URL.createObjectURL(file);
    const tempId = Date.now() + Math.random();
    
    if (isParent) {
      setImages(imgs => [...imgs, { url: preview, __local: true, __tempId: tempId }]);
    } else {
      setNewChildren(kids => kids.map((k, i) => 
        i === childIndex ? { ...k, images: [...k.images, { url: preview, __local: true, __tempId: tempId }] } : k
      ));
    }

    try {
      const fd = new FormData();
      fd.append('file', file);
      const resp = await fetch(`${API}/api/admin/upload`, {
        method: 'POST',
        body: fd,
        credentials: 'include'
      });
      const body = await resp.json();
      if (!resp.ok) throw new Error(body.error);
      
      const asset = {
        public_id: body.asset.public_id,
        url: body.asset.url,
        width: body.asset.width,
        height: body.asset.height,
        format: body.asset.format
      };
      
      if (isParent) {
        setImages(imgs => imgs.map(img => (img.__tempId === tempId ? asset : img)));
      } else {
        setNewChildren(kids => kids.map((k, i) => 
          i === childIndex ? { ...k, images: k.images.map(img => (img.__tempId === tempId ? asset : img)) } : k
        ));
      }
      
      try { URL.revokeObjectURL(preview); } catch (e) {}
    } catch (err) {
      if (isParent) {
        setImages(imgs => imgs.filter(i => i.__tempId !== tempId));
      } else {
        setNewChildren(kids => kids.map((k, i) => 
          i === childIndex ? { ...k, images: k.images.filter(img => img.__tempId !== tempId) } : k
        ));
      }
      alert(err.message);
    }
  };

  const handleUpdate = async () => {
    if (!name.trim()) return alert('Category name is required');
    setSaving(true);
    try {
      // Detect removed images to delete from Cloudinary
      const originalImageIds = originalImages.map(img => img.public_id).filter(Boolean);
      const currentImageIds = images.map(img => img.public_id).filter(Boolean);
      const removedImageIds = originalImageIds.filter(id => !currentImageIds.includes(id));
      
      // Update parent category
      const payload = { name: name.trim(), isActive: true };
      const uploadedImages = images.filter(i => !i.__local && !i.__tempId && i.public_id);
      payload.images = uploadedImages;
      
      // Include removed images for Cloudinary cleanup
      if (removedImageIds.length > 0) {
        payload.removedImages = removedImageIds;
      }
      
      const resp = await fetch(`${API}/api/admin/categories/${category._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error);

      // Create new children if any
      for (const child of newChildren) {
        if (child.name.trim()) {
          const childPayload = {
            name: child.name.trim(),
            parentId: category._id,
            isActive: true
          };
          const childImages = child.images.filter(i => !i.__local && !i.__tempId && i.public_id);
          if (childImages.length > 0) {
            childPayload.images = childImages;
          }
          
          const childResp = await fetch(`${API}/api/admin/categories`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(childPayload)
          });
          if (!childResp.ok) {
            const err = await childResp.json();
            throw new Error(err.error || 'Failed to create child');
          }
        }
      }
      
      onSuccess();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h3 className="text-xl font-semibold mb-4">
            Edit {category.level === 0 ? 'Main' : category.level === 1 ? 'Sub' : 'Sub-Sub'} Category
          </h3>
          
          <div className="space-y-6">
            {/* Parent category info */}
            <div className="border rounded p-4">
              <h4 className="font-medium mb-3">Category Details</h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Name</label>
                  <input
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full border px-3 py-2 rounded"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Images</label>
                  <div className="flex gap-3 flex-wrap">
                    {images.map((img, idx) => (
                      <div key={img.public_id || img.__tempId || `img-${idx}`} className="relative w-20 h-20 bg-gray-50 border rounded overflow-hidden">
                        <img src={img.url} alt="" className="w-full h-full object-cover" />
                        {img.__local && (
                          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                            <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent"></div>
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => setImages(imgs => imgs.filter((_, i) => i !== idx))}
                          disabled={img.__local}
                          className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center hover:bg-red-700 disabled:opacity-50"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                    <label className="w-20 h-20 flex items-center justify-center border border-dashed rounded cursor-pointer hover:bg-gray-50">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={e => e.target.files?.[0] && handleFile(e.target.files[0], true)}
                      />
                      <span className="text-2xl text-gray-400">+</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Add children section */}
            {canAddChildren && (
              <div className="border rounded p-4 bg-blue-50">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium">
                    Add {category.level === 0 ? 'Subcategories' : 'Sub-Subcategories'}
                  </h4>
                  <button
                    onClick={() => setNewChildren([...newChildren, { name: '', images: [] }])}
                    className="text-sm px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    + Add Row
                  </button>
                </div>

                <div className="space-y-3">
                  {newChildren.map((child, idx) => (
                    <div key={idx} className="bg-white p-3 rounded border">
                      <div className="flex gap-3">
                        <div className="flex-1">
                          <input
                            value={child.name}
                            onChange={e => setNewChildren(kids => kids.map((k, i) => 
                              i === idx ? { ...k, name: e.target.value } : k
                            ))}
                            placeholder={`${category.level === 0 ? 'Subcategory' : 'Sub-subcategory'} name`}
                            className="w-full border px-3 py-2 rounded"
                          />
                        </div>
                        
                        <div className="flex gap-2">
                          {child.images.map((img, imgIdx) => (
                            <div key={img.public_id || img.__tempId || `child-${idx}-img-${imgIdx}`} className="relative w-16 h-16 bg-gray-50 border rounded overflow-hidden">
                              <img src={img.url} alt="" className="w-full h-full object-cover" />
                              {img.__local && (
                                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                </div>
                              )}
                              <button
                                type="button"
                                onClick={() => setNewChildren(kids => kids.map((k, i) => 
                                  i === idx ? { ...k, images: k.images.filter((_, ii) => ii !== imgIdx) } : k
                                ))}
                                disabled={img.__local}
                                className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full w-4 h-4 text-xs flex items-center justify-center hover:bg-red-700 disabled:opacity-50"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                          <label className="w-16 h-16 flex items-center justify-center border border-dashed rounded cursor-pointer hover:bg-gray-50">
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={e => e.target.files?.[0] && handleFile(e.target.files[0], false, idx)}
                            />
                            <span className="text-xl text-gray-400">+</span>
                          </label>
                        </div>

                        <button
                          onClick={() => setNewChildren(kids => kids.filter((_, i) => i !== idx))}
                          className="px-2 text-red-600 hover:bg-red-50 rounded"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Existing children list */}
            {children.length > 0 && (
              <div className="border rounded p-4">
                <h4 className="font-medium mb-3">
                  Existing {category.level === 0 ? 'Subcategories' : 'Sub-Subcategories'} ({children.length})
                </h4>
                <div className="text-sm text-gray-600">
                  Click on child categories in the main list to edit them individually.
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-2 mt-6">
            <button
              onClick={handleUpdate}
              disabled={saving}
              className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save All Changes'}
            </button>
            <button onClick={onClose} className="px-4 py-2 border rounded hover:bg-gray-50">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
