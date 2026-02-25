"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/components/context/UserContext';

export default function ProductEdit({ productId }) {
  const router = useRouter();
  const { user, refreshUser } = useUser();
  const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  const [product, setProduct] = useState({
    title: '',
    description: '',
    detailedDescription: '',
    category: '',
    department: '',
    tags: [],
    images: [],
    variants: [],
    price: undefined,
    compareAtPrice: undefined,
    sku: '',
    currency: 'USD',
    inventory: undefined,
    availability: 'in_stock',
    colors: [],
    sizes: [],
    guidelines: '',
    monthlySold: undefined,
    rewardPoints: undefined,
    keyAttributes: [], // { level: '', attributes: [{ key: '', value: '' }] }
    customization: { customizable: false, options: [] },
    warranty: { period: '', details: '', provider: '' },
    returnPolicy: { days: undefined, refundable: true, details: '' },
    faqs: [],
    reviews: [],
    averageRating: 0,
    reviewCount: 0,
    status: 'draft',
    specs: {},
    seo: { title: '', description: '', keywords: '' },
    featured: false,
    coupon: false,
    flashSale: false,
    clearance: false,
    badges: []
  });

  // strings for comma-separated inputs (tags, sizes)
  const [tagStr, setTagStr] = useState('');
  const [sizeStr, setSizeStr] = useState('');


  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newReview, setNewReview] = useState({ authorName: '', rating: '', title: '', body: '' });

  // Department autocomplete
  const [departmentSuggestions, setDepartmentSuggestions] = useState([]);
  const [showDepartmentSuggestions, setShowDepartmentSuggestions] = useState(false);
  const [allDepartments, setAllDepartments] = useState([
    'ryans', 'asus', 'cosrx', 'samsung', 'apple', 'sony', 'lg', 'dell', 'hp', 'lenovo',
    'xiaomi', 'realme', 'vivo', 'oppo', 'huawei', 'oneplus', 'google', 'microsoft',
    'canon', 'nikon', 'logitech', 'razer', 'corsair', 'asus rog', 'msi', 'gigabyte',
    'amd', 'intel', 'nvidia', 'seagate', 'western digital', 'sandisk', 'toshiba'
  ]);

  const inputClass = "w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all";
  const labelClass = "block text-sm font-semibold text-gray-700 mb-2";

  useEffect(() => { if (!user) refreshUser(); }, [user, refreshUser]);

  // sync string inputs when product data changes
  useEffect(() => {
    setTagStr((product.tags || []).join(', '));
  }, [product.tags]);
  useEffect(() => {
    setSizeStr((product.sizes || []).join(', '));
  }, [product.sizes]);

  const [categories, setCategories] = useState([]);
  const [selectedMain, setSelectedMain] = useState(null);
  const [selectedSub, setSelectedSub] = useState(null);
  const [selectedChild, setSelectedChild] = useState(null);

  useEffect(() => {
    fetch(`${API}/api/products/categories`).then(r => r.json()).then(b => {
      setCategories(b.categories || []);
    }).catch(() => setCategories([]));
  }, [API]);

  // Department autocomplete handler
  const handleDepartmentChange = (value) => {
    setProduct(p => ({ ...p, department: value }));
    if (value.trim()) {
      const filtered = allDepartments.filter(dept => 
        dept.toLowerCase().includes(value.toLowerCase())
      );
      setDepartmentSuggestions(filtered);
      setShowDepartmentSuggestions(true);
    } else {
      setShowDepartmentSuggestions(false);
    }
  };

  const selectDepartment = (dept) => {
    setProduct(p => ({ ...p, department: dept }));
    setShowDepartmentSuggestions(false);
    if (!allDepartments.includes(dept)) {
      setAllDepartments([...allDepartments, dept]);
    }
  };

  // Load product data
  useEffect(() => {
    if (!productId) {
      console.log('ProductEdit: No productId provided');
      return;
    }
    
    console.log('ProductEdit: Loading product with ID:', productId);
    console.log('ProductEdit: Fetching from URL:', `${API}/api/admin/products/${productId}`);
    
    setLoading(true);
    fetch(`${API}/api/admin/products/${productId}`, { credentials: 'include' })
      .then(r => {
        console.log('ProductEdit: Response status:', r.status);
        if (!r.ok) {
          throw new Error(`HTTP ${r.status}: ${r.statusText}`);
        }
        return r.json();
      })
      .then(async b => {
        console.log('ProductEdit: Received data:', b);
        
        if (b.error) {
          throw new Error(b.error);
        }
        
        if (b.product) {
          const p = b.product;
          console.log('ProductEdit: Product data:', p);
          
          // normalize fields for editor (backward compatibility)
          p.sizes = p.sizes || p.specs?.sizes || [];
          p.specs = { ...(p.specs || {}), sizes: p.sizes };
          p.currency = p.currency || 'USD';
          p.availability = p.availability || (p.inventory > 0 ? 'in_stock' : 'out_of_stock');
          p.colors = p.colors || [];
          p.department = p.department || '';
          p.keyAttributes = p.keyAttributes || [];
          p.customization = p.customization || { customizable: false, options: [] };
          p.warranty = p.warranty || { period: '', details: '', provider: '' };
          p.returnPolicy = p.returnPolicy || { days: undefined, refundable: true, details: '' };
          p.faqs = p.faqs || [];
          p.reviews = p.reviews || [];
          p.seo = p.seo || { title: '', description: '', keywords: '' };
          // if backend sent keywords array, convert to string for editing
          if (Array.isArray(p.seo.keywords)) {
            p.seo.keywords = p.seo.keywords.join(', ');
          }
          p.featured = !!p.featured;
          p.coupon = !!p.coupon;
          p.flashSale = !!p.flashSale;
          p.clearance = !!p.clearance;
          p.badges = p.badges || [];

          console.log('ProductEdit: Setting product state with normalized data');
          setProduct(p);
        } else {
          console.error('ProductEdit: No product in response');
        }
      })
      .catch(err => {
        console.error('ProductEdit: Error loading product:', err);
        alert(`Failed to load product: ${err.message}`);
      })
      .finally(() => {
        console.log('ProductEdit: Loading complete');
        setLoading(false);
      });
  }, [productId, API]);

  // Set selected categories after both product and categories are loaded
  useEffect(() => {
    if (!product.categoryId && !product.category) {
      console.log('ProductEdit: No category info in product');
      return;
    }
    if (categories.length === 0) {
      console.log('ProductEdit: Categories not loaded yet');
      return;
    }

    console.log('ProductEdit: Setting up category selection. Product category:', product.category, 'Product categoryId:', product.categoryId);

    // Helper function to find category path by ID
    const findPath = (nodes, id, path = []) => {
      for (const n of nodes) {
        if (String(n._id) === String(id)) return [...path, n];
        if (n.children && n.children.length) {
          const res = findPath(n.children, id, [...path, n]);
          if (res) return res;
        }
      }
      return null;
    };

    // Helper function to find category path by name
    const matchByName = (nodes, name) => {
      for (const n of nodes) {
        if (n.name === name) return [n];
        if (n.children && n.children.length) {
          const sub = matchByName(n.children, name);
          if (sub) return [n, ...sub];
        }
      }
      return null;
    };

    // Try to set selected category from categoryId first
    if (product.categoryId) {
      const path = findPath(categories, product.categoryId);
      if (path) {
        console.log('ProductEdit: Found category path by ID:', path.map(p => p.name));
        setSelectedMain(path[0] || null);
        setSelectedSub(path[1] || null);
        setSelectedChild(path[2] || null);
      } else {
        console.log('ProductEdit: Category ID not found in tree:', product.categoryId);
      }
    } else if (product.category) {
      // Try match by name if categoryId not available
      const path = matchByName(categories, product.category);
      if (path) {
        console.log('ProductEdit: Found category path by name:', path.map(p => p.name));
        setSelectedMain(path[0] || null);
        setSelectedSub(path[1] || null);
        setSelectedChild(path[2] || null);
        // Update product with the found categoryId
        if (path[path.length-1]) {
          setProduct(prev => ({ ...prev, categoryId: path[path.length-1]._id }));
        }
      } else {
        console.log('ProductEdit: Category name not found in tree:', product.category);
      }
    }
  }, [product.categoryId, product.category, categories]);

  const handleFile = async (file) => {
    const preview = URL.createObjectURL(file);
    setProduct(p => ({ ...p, images: [...(p.images||[]), { url: preview, __local: true, uploading: true }] }));

    try {
      const fd = new FormData();
      fd.append('file', file);
      const resp = await fetch(`${API}/api/admin/upload`, { method: 'POST', body: fd, credentials: 'include' });
      const body = await resp.json();
      if (!resp.ok) throw new Error(body.error || 'Upload failed');

      const asset = { public_id: body.asset.public_id, url: body.asset.url, width: body.asset.width, height: body.asset.height, format: body.asset.format };

      setProduct(p => {
        const imgs = (p.images || []).map(img => {
          if (img.__local && img.url === preview) return asset;
          return img;
        });
        return { ...p, images: imgs };
      });

      try { URL.revokeObjectURL(preview); } catch (e) { /* ignore */ }
    } catch (err) {
      setProduct(p => ({ ...p, images: (p.images || []).filter(i => !(i.__local && i.url === preview)) }));
      alert(err.message || 'Upload failed');
    }
  };

  const onAddVariant = () => {
    setProduct(p => ({ ...p, variants: [...(p.variants||[]), { title: '', sku: '', price: undefined, inventory: undefined, attributes: {} }] }));
  };
  const onRemoveVariant = (idx) => setProduct(p => ({ ...p, variants: p.variants.filter((_,i)=>i!==idx) }));
  const onChangeVariant = (idx, patch) => setProduct(p => { const arr = [...(p.variants||[])]; arr[idx] = { ...(arr[idx]||{}), ...patch }; return { ...p, variants: arr }; });

  const recalcReviews = (reviews) => {
    const list = reviews || [];
    const count = list.length;
    const sum = list.reduce((s, r) => s + (Number(r.rating) || 0), 0);
    const avg = count ? Math.round((sum / count) * 10) / 10 : 0;
    return { count, avg };
  };

  const addReview = () => {
    const rating = parseFloat(newReview.rating);
    if (isNaN(rating) || rating < 1 || rating > 5) return alert('Rating must be a number between 1 and 5');
    const review = { authorName: newReview.authorName || undefined, rating, title: newReview.title || '', body: newReview.body || '', helpful: 0, createdAt: new Date().toISOString() };
    setProduct(p => {
      const reviews = [...(p.reviews||[]), review];
      const { count, avg } = recalcReviews(reviews);
      return { ...p, reviews, reviewCount: count, averageRating: avg };
    });
    setNewReview({ authorName: '', rating: '', title: '', body: '' });
  };

  const removeReviewAt = (idx) => {
    setProduct(p => {
      const reviews = (p.reviews || []).filter((_, i) => i !== idx);
      const { count, avg } = recalcReviews(reviews);
      return { ...p, reviews, reviewCount: count, averageRating: avg };
    });
  };

  const handleSave = async () => {
    if (!product.title) return alert('Title is required');
    if (Array.isArray(product.variants) && product.variants.some(v => v.price == null)) {
      return alert('Please enter a price for every variant or remove empty variants.');
    }
    setSaving(true);
    try {
      // convert keyword string to array
      const seoCopy = { ...(product.seo || {}) };
      if (typeof seoCopy.keywords === 'string') {
        seoCopy.keywords = seoCopy.keywords.split(',').map(s=>s.trim()).filter(Boolean);
      }
      // ensure tags/sizes sync with input strings
      const finalTags = tagStr.split(',').map(s=>s.trim()).filter(Boolean);
      const finalSizes = sizeStr.split(',').map(s=>s.trim()).filter(Boolean);
      const payload = { 
        ...product,
        tags: finalTags,
        sizes: finalSizes,
        seo: seoCopy,
        specs: { ...(product.specs || {}), sizes: finalSizes || product.sizes || product.specs?.sizes || [] }
      };
      const resp = await fetch(`${API}/api/admin/products/${productId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(payload) });
      const body = await resp.json();
      if (!resp.ok) throw new Error(body.error || 'Save failed');
      router.push('/dashabord/products');
    } catch (err) {
      alert(err.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };



  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <div className="text-xl font-semibold text-gray-700">Loading product...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Edit Product</h1>
              <p className="text-gray-600 mt-1">Update product information in your catalog</p>
            </div>
            <button 
              onClick={() => router.push('/dashabord/products')}
              className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              ✕ Cancel
            </button>
          </div>
        </div>



        {/* Tab Content */}
        <div className="bg-white rounded-xl shadow-md p-8 space-y-12">
          {/* Basic Info Tab */}
          <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Basic Information</h2>
              
              <div className="grid grid-cols-1 gap-6">
                {/* Title */}
                <div>
                  <label className={labelClass}>
                    Product Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={product.title}
                    onChange={e => setProduct(p => ({ ...p, title: e.target.value }))}
                    className={inputClass}
                    placeholder="Enter product title"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className={labelClass}>Description</label>
                  <textarea
                    value={product.description || ''}
                    onChange={e => setProduct(p => ({ ...p, description: e.target.value }))}
                    className={`${inputClass} h-32`}
                    placeholder="Detailed product description"
                  />
                </div>

                {/* Detailed Description */}
                <div>
                  <label className={labelClass}>Detailed Description</label>
                  <p className="text-sm text-gray-600 mb-2">Rich detailed description for the product details page</p>
                  <textarea
                    value={product.detailedDescription || ''}
                    onChange={e => setProduct(p => ({ ...p, detailedDescription: e.target.value }))}
                    className={`${inputClass} h-48`}
                    placeholder="Enter comprehensive product details, features, specifications, etc..."
                  />
                </div>

                {/* Department with Autocomplete */}
                <div className="relative">
                  <label className={labelClass}>Department / Brand</label>
                  <input
                    type="text"
                    value={product.department || ''}
                    onChange={e => handleDepartmentChange(e.target.value)}
                    onFocus={() => product.department && setShowDepartmentSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowDepartmentSuggestions(false), 200)}
                    className={inputClass}
                    placeholder="e.g., ryans, asus, cosrx..."
                  />
                  {showDepartmentSuggestions && departmentSuggestions.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {departmentSuggestions.map((dept, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onMouseDown={() => selectDepartment(dept)}
                          className="w-full text-left px-4 py-2 hover:bg-indigo-50 transition-colors"
                        >
                          {dept}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Category Selection */}
                <div>
                  <label className={labelClass}>Category</label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <select
                      value={selectedMain?._id || ''}
                      onChange={e => {
                        const id = e.target.value;
                        const main = categories.find(c => String(c._id) === id) || null;
                        setSelectedMain(main);
                        setSelectedSub(null);
                        setSelectedChild(null);
                        setProduct(p => ({ ...p, categoryId: id || undefined, category: main?.name || '' }));
                      }}
                      className={inputClass}
                    >
                      <option value="">Select Main Category</option>
                      {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                    </select>

                    <select
                      value={selectedSub?._id || ''}
                      onChange={e => {
                        const id = e.target.value;
                        const sub = (selectedMain?.children || []).find(c => String(c._id) === id) || null;
                        setSelectedSub(sub);
                        setSelectedChild(null);
                        setProduct(p => ({ ...p, categoryId: id || p.categoryId }));
                      }}
                      className={inputClass}
                      disabled={!selectedMain}
                    >
                      <option value="">Sub Category</option>
                      {(selectedMain?.children || []).map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                    </select>

                    <select
                      value={selectedChild?._id || ''}
                      onChange={e => {
                        const id = e.target.value;
                        const child = (selectedSub?.children || []).find(c => String(c._id) === id) || null;
                        setSelectedChild(child);
                        setProduct(p => ({ ...p, categoryId: id || p.categoryId }));
                      }}
                      className={inputClass}
                      disabled={!selectedSub}
                    >
                      <option value="">Child Category</option>
                      {(selectedSub?.children || []).map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                    </select>
                  </div>
                </div>

                {/* Status */}
                <div>
                  <label className={labelClass}>Product Status</label>
                  <select
                    value={product.status}
                    onChange={e => setProduct(p => ({ ...p, status: e.target.value }))}
                    className={inputClass}
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>

                {/* Tags */}
                <div>
                  <label className={labelClass}>Tags (comma-separated)</label>
                  <input
                    type="text"
                    placeholder="e.g., wireless, bluetooth, sale"
                    value={tagStr}
                    onChange={e => setTagStr(e.target.value)}
                    onBlur={() => setProduct(p => ({
                      ...p,
                      tags: tagStr.split(',').map(s=>s.trim()).filter(Boolean)
                    }))}
                    className={inputClass}
                  />
                </div>

                {/* Promotion Flags */}
                <div>
                  <label className={labelClass}>Promotion Flags</label>
                  <div className="flex flex-wrap gap-4 mt-2">
                    <label className="inline-flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={product.featured || false}
                        onChange={e => setProduct(p => ({ ...p, featured: e.target.checked }))}
                        className="w-4 h-4"
                      />
                      <span>Featured</span>
                    </label>
                    <label className="inline-flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={product.coupon || false}
                        onChange={e => setProduct(p => ({ ...p, coupon: e.target.checked }))}
                        className="w-4 h-4"
                      />
                      <span>Coupon</span>
                    </label>
                    <label className="inline-flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={product.flashSale || false}
                        onChange={e => setProduct(p => ({ ...p, flashSale: e.target.checked }))}
                        className="w-4 h-4"
                      />
                      <span>Flash Sale</span>
                    </label>
                    <label className="inline-flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={product.clearance || false}
                        onChange={e => setProduct(p => ({ ...p, clearance: e.target.checked }))}
                        className="w-4 h-4"
                      />
                      <span>Clearance</span>
                    </label>
                  </div>
                </div>

                {/* Badges */}
                <div>
                  <label className={labelClass}>Product Badges</label>
                  <div className="flex flex-wrap gap-3 mt-2">
                    {[
                      { key: 'best_seller', label: 'Best Seller', color: 'bg-yellow-100 text-yellow-800' },
                      { key: 'hot', label: 'Hot', color: 'bg-red-100 text-red-800' },
                      { key: 'new_arrival', label: 'New Arrival', color: 'bg-green-100 text-green-800' },
                      { key: 'popular_pics', label: 'Popular Pics', color: 'bg-pink-100 text-pink-800' },
                      { key: 'trending', label: 'Trending', color: 'bg-blue-100 text-blue-800' },
                      { key: 'limited', label: 'Limited Edition', color: 'bg-purple-100 text-purple-800' },
                      { key: 'deals_of_the_day', label: 'Deals of the Day', color: 'bg-orange-100 text-orange-800' },
                    ].map(b => (
                      <label
                        key={b.key}
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border-2 cursor-pointer transition-all ${
                          (product.badges || []).includes(b.key)
                            ? `${b.color} border-current font-semibold`
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={(product.badges || []).includes(b.key)}
                          onChange={() => setProduct(p => ({
                            ...p,
                            badges: (p.badges || []).includes(b.key)
                              ? p.badges.filter(x => x !== b.key)
                              : [...(p.badges || []), b.key]
                          }))}
                          className="w-4 h-4"
                        />
                        {b.label}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

          {/* Pricing Tab */}
          <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Pricing & Inventory</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Price */}
                <div>
                  <label className={labelClass}>Regular Price <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    value={product.price ?? ''}
                    onChange={e => setProduct(p => ({ ...p, price: e.target.value === '' ? undefined : Number(e.target.value) }))}
                    className={inputClass}
                    placeholder="0.00"
                    step="0.01"
                  />
                </div>

                {/* Compare at Price */}
                <div>
                  <label className={labelClass}>Compare at Price (Optional)</label>
                  <input
                    type="number"
                    value={product.compareAtPrice ?? ''}
                    onChange={e => setProduct(p => ({ ...p, compareAtPrice: e.target.value === '' ? undefined : Number(e.target.value) }))}
                    className={inputClass}
                    placeholder="0.00"
                    step="0.01"
                  />
                  <p className="text-xs text-gray-500 mt-1">Show a "was" price to indicate a discount</p>
                </div>

                {/* Inventory */}
                <div>
                  <label className={labelClass}>Stock Quantity</label>
                  <input
                    type="number"
                    value={product.inventory ?? ''}
                    onChange={e => setProduct(p => ({ ...p, inventory: e.target.value === '' ? undefined : Number(e.target.value) }))}
                    className={inputClass}
                    placeholder="0"
                  />
                </div>

                {/* SKU */}
                <div>
                  <label className={labelClass}>SKU (tracking code)</label>
                  <input
                    type="text"
                    value={product.sku || ''}
                    onChange={e => setProduct(p => ({ ...p, sku: e.target.value }))}
                    className={inputClass}
                    placeholder="ABC-123"
                  />
                </div>

                {/* Currency */}
                <div>
                  <label className={labelClass}>Currency</label>
                  <input
                    type="text"
                    value={product.currency ?? ''}
                    onChange={e => setProduct(p => ({ ...p, currency: e.target.value }))}
                    className={inputClass}
                    placeholder="USD"
                  />
                </div>

                {/* Availability */}
                <div>
                  <label className={labelClass}>Availability Status</label>
                  <select
                    value={product.availability || 'in_stock'}
                    onChange={e => setProduct(p => ({ ...p, availability: e.target.value }))}
                    className={inputClass}
                  >
                    <option value="in_stock">In Stock</option>
                    <option value="pre_order">Pre-Order</option>
                    <option value="upcoming">Coming Soon</option>
                    <option value="out_of_stock">Out of Stock</option>
                  </select>
                </div>

                {/* Monthly Sold */}
                <div>
                  <label className={labelClass}>Units Sold (Last 30 Days)</label>
                  <input
                    type="number"
                    value={product.monthlySold ?? ''}
                    onChange={e => setProduct(p => ({ ...p, monthlySold: e.target.value === '' ? undefined : Number(e.target.value) }))}
                    className={inputClass}
                    placeholder="0"
                  />
                  <p className="text-xs text-gray-500 mt-1">Display popularity on product page</p>
                </div>

                {/* Reward Points */}
                <div>
                  <label className={labelClass}>Reward Points</label>
                  <input
                    type="number"
                    value={product.rewardPoints ?? ''}
                    onChange={e => setProduct(p => ({ ...p, rewardPoints: e.target.value === '' ? undefined : Number(e.target.value) }))}
                    className={inputClass}
                    placeholder="0"
                  />
                  <p className="text-xs text-gray-500 mt-1">Points customers earn for purchasing</p>
                </div>
              </div>
            </div>

          {/* Images Tab */}
          <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Product Images</h2>
              
              <div>
                <label className={labelClass}>Upload Images</label>
                <p className="text-sm text-gray-600 mb-4">Add high-quality images of your product. First image will be the main product image.</p>
                
                <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-indigo-500 hover:bg-indigo-50 transition-all">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={e => Array.from(e.target.files || []).forEach(f => f && handleFile(f))}
                  />
                  <div className="text-center">
                    <svg className="w-16 h-16 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="mt-2 text-sm text-gray-600">Click to upload or drag and drop</p>
                    <p className="text-xs text-gray-500">PNG, JPG, WebP up to 10MB</p>
                  </div>
                </label>

                {/* Image Preview Grid */}
                {(product.images || []).length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                    {(product.images || []).map((img, i) => (
                      <div key={i} className="relative group">
                        <div className="aspect-square rounded-lg overflow-hidden border-2 border-gray-200 shadow-sm">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={img.url}
                            alt={img.alt || `Product ${i + 1}`}
                            className="w-full h-full object-cover"
                          />
                          {(img.uploading || img.__local) && (
                            <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
                              <div className="text-sm font-medium text-gray-700">Uploading...</div>
                            </div>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => setProduct(p => ({ ...p, images: p.images.filter((_, idx) => idx !== i) }))}
                          className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
                          aria-label="Remove image"
                        >
                          ✕
                        </button>
                        {i === 0 && (
                          <div className="absolute top-2 left-2 bg-indigo-600 text-white text-xs px-2 py-1 rounded">
                            Main
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

          {/* Variants Tab */}
          <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Product Variants</h2>
                  <p className="text-sm text-gray-600 mt-1">Add different options like sizes, colors, or styles</p>
                </div>
                <button
                  type="button"
                  onClick={onAddVariant}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-md"
                >
                  + Add Variant
                </button>
              </div>

              {(product.variants || []).length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-xl">
                  <p className="text-gray-600">No variants yet. Click "Add Variant" to create one.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {(product.variants || []).map((v, idx) => (
                    <div key={idx} className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-2">Variant Name</label>
                          <input
                            type="text"
                            value={v.title || ''}
                            onChange={e => onChangeVariant(idx, { title: e.target.value })}
                            className={inputClass}
                            placeholder="e.g., Red - Large"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">SKU</label>
                          <input
                            type="text"
                            value={v.sku || ''}
                            onChange={e => onChangeVariant(idx, { sku: e.target.value })}
                            className={inputClass}
                            placeholder="ABC-123-RED-L"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Price</label>
                          <input
                            type="number"
                            value={v.price ?? ''}
                            onChange={e => onChangeVariant(idx, { price: e.target.value === '' ? undefined : Number(e.target.value) })}
                            className={inputClass}
                            placeholder="0.00"
                            step="0.01"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Inventory(Available piece in stock)</label>
                          <input
                            type="number"
                            value={v.inventory ?? ''}
                            onChange={e => onChangeVariant(idx, { inventory: e.target.value === '' ? undefined : Number(e.target.value) })}
                            className={inputClass}
                            placeholder="0"
                          />
                        </div>
                        <div className="flex items-end">
                          <button
                            type="button"
                            onClick={() => onRemoveVariant(idx)}
                            className="w-full px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                          >
                            Remove Variant
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          {/* Attributes Tab */}
          <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Product Attributes</h2>
              
              {/* Key Attributes */}
              <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                <label className={labelClass}>Key Attributes</label>
                <p className="text-sm text-gray-600 mb-4">Add product specifications grouped by levels (e.g., Connectivity, Display, etc.)</p>
                
                <div className="space-y-6">
                  {(product.keyAttributes || []).map((levelGroup, levelIdx) => (
                    <div key={levelIdx} className="bg-white p-4 rounded-lg border-2 border-gray-300">
                      {/* Level Header */}
                      <div className="flex gap-3 items-center mb-3">
                        <input
                          type="text"
                          value={levelGroup.level || ''}
                          onChange={e => setProduct(p => {
                            const arr = [...(p.keyAttributes || [])];
                            arr[levelIdx] = { ...(arr[levelIdx] || {}), level: e.target.value, attributes: arr[levelIdx]?.attributes || [] };
                            return { ...p, keyAttributes: arr };
                          })}
                          placeholder="Level (e.g., General, Connectivity, Display)"
                          className="flex-1 px-4 py-2 border-2 border-indigo-400 rounded-lg font-semibold text-indigo-700 text-base"
                        />
                        <button
                          type="button"
                          onClick={() => setProduct(p => ({
                            ...p,
                            keyAttributes: p.keyAttributes.filter((_, idx) => idx !== levelIdx)
                          }))}
                          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium"
                        >
                          Remove Level
                        </button>
                      </div>

                      {/* Attributes under this level */}
                      <div className="space-y-2 ml-4">
                        {(levelGroup.attributes || []).map((attr, attrIdx) => (
                          <div key={attrIdx} className="flex gap-2 items-center">
                            <input
                              type="text"
                              value={attr.key || ''}
                              onChange={e => setProduct(p => {
                                const arr = [...(p.keyAttributes || [])];
                                const attrs = [...(arr[levelIdx]?.attributes || [])];
                                attrs[attrIdx] = { ...(attrs[attrIdx] || {}), key: e.target.value };
                                arr[levelIdx] = { ...arr[levelIdx], attributes: attrs };
                                return { ...p, keyAttributes: arr };
                              })}
                              placeholder="Key (e.g., Brand, Bluetooth)"
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            />
                            <input
                              type="text"
                              value={attr.value || ''}
                              onChange={e => setProduct(p => {
                                const arr = [...(p.keyAttributes || [])];
                                const attrs = [...(arr[levelIdx]?.attributes || [])];
                                attrs[attrIdx] = { ...(attrs[attrIdx] || {}), value: e.target.value };
                                arr[levelIdx] = { ...arr[levelIdx], attributes: attrs };
                                return { ...p, keyAttributes: arr };
                              })}
                              placeholder="Value (e.g., Samsung, V5.3)"
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            />
                            <button
                              type="button"
                              onClick={() => setProduct(p => {
                                const arr = [...(p.keyAttributes || [])];
                                const attrs = (arr[levelIdx]?.attributes || []).filter((_, idx) => idx !== attrIdx);
                                arr[levelIdx] = { ...arr[levelIdx], attributes: attrs };
                                return { ...p, keyAttributes: arr };
                              })}
                              className="px-3 py-2 bg-red-400 text-white rounded-lg hover:bg-red-500 transition-colors text-sm"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => setProduct(p => {
                            const arr = [...(p.keyAttributes || [])];
                            const attrs = [...(arr[levelIdx]?.attributes || []), { key: '', value: '' }];
                            arr[levelIdx] = { ...arr[levelIdx], attributes: attrs };
                            return { ...p, keyAttributes: arr };
                          })}
                          className="px-3 py-1.5 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-colors text-sm"
                        >
                          + Add Attribute
                        </button>
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => setProduct(p => ({ 
                      ...p, 
                      keyAttributes: [...(p.keyAttributes || []), { level: '', attributes: [] }] 
                    }))}
                    className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors font-medium"
                  >
                    + Add New Level
                  </button>
                </div>
              </div>

              {/* Colors */}
              <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                <label className={labelClass}>Available Colors</label>
                <p className="text-sm text-gray-600 mb-4">Add colors this product is available in</p>
                
                <div className="space-y-3">
                  {(product.colors || []).map((c, i) => (
                    <div key={i} className="flex gap-3 items-center">
                      <input
                        type="text"
                        value={c.name || ''}
                        onChange={e => setProduct(p => {
                          const arr = [...(p.colors || [])];
                          arr[i] = { ...(arr[i] || {}), name: e.target.value };
                          return { ...p, colors: arr };
                        })}
                        placeholder="Color name (e.g., Navy)"
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
                      />
                      <input
                        type="text"
                        value={c.label || ''}
                        onChange={e => setProduct(p => {
                          const arr = [...(p.colors || [])];
                          arr[i] = { ...(arr[i] || {}), label: e.target.value };
                          return { ...p, colors: arr };
                        })}
                        placeholder="Display label (e.g., Midnight Blue)"
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => setProduct(p => ({ ...p, colors: p.colors.filter((_, idx) => idx !== i) }))}
                        className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => setProduct(p => ({ ...p, colors: [...(p.colors || []), { name: '', hex: '#000000' }] }))}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    + Add Color
                  </button>
                </div>
              </div>

              {/* Sizes */}
              <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                <label className={labelClass}>Available Sizes</label>
                <p className="text-sm text-gray-600 mb-4">Enter sizes separated by commas (e.g., S, M, L, XL)</p>
                <input
                  type="text"
                  value={sizeStr}
                  onChange={e => setSizeStr(e.target.value)}
                  onBlur={() => {
                    const arr = sizeStr.split(',').map(s => s.trim()).filter(Boolean);
                    setProduct(p => ({ ...p, sizes: arr, specs: { ...(p.specs || {}), sizes: arr } }));
                  }}
                  className={inputClass}
                  placeholder="S, M, L, XL"
                />
              </div>

              {/* Care Guidelines */}
              <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                <label className={labelClass}>Care & Handling Instructions</label>
                <p className="text-sm text-gray-600 mb-4">Washing, care, or usage instructions</p>
                <textarea
                  value={product.guidelines || ''}
                  onChange={e => setProduct(p => ({ ...p, guidelines: e.target.value }))}
                  className={`${inputClass} h-32`}
                  placeholder="Machine wash cold, tumble dry low..."
                />
              </div>

              {/* Customization */}
              <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                <div className="flex items-center gap-3 mb-4">
                  <input
                    type="checkbox"
                    id="customizable"
                    checked={product.customization?.customizable || false}
                    onChange={e => setProduct(p => ({ ...p, customization: { ...(p.customization || {}), customizable: e.target.checked } }))}
                    className="w-5 h-5"
                  />
                  <label htmlFor="customizable" className="text-lg font-semibold text-gray-900">
                    Allow Product Customization
                  </label>
                </div>

                {product.customization?.customizable && (
                  <div className="space-y-3">
                    {(product.customization.options || []).map((opt, i) => (
                      <div key={i} className="flex gap-3 items-center">
                        <input
                          type="text"
                          value={opt.name || ''}
                          onChange={e => setProduct(p => {
                            const arr = [...(p.customization.options || [])];
                            arr[i] = { ...(arr[i] || {}), name: e.target.value };
                            return { ...p, customization: { ...p.customization, options: arr } };
                          })}
                          placeholder="Option name (e.g., Engraving)"
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
                        />
                        <input
                          type="text"
                          value={opt.type || ''}
                          onChange={e => setProduct(p => {
                            const arr = [...(p.customization.options || [])];
                            arr[i] = { ...(arr[i] || {}), type: e.target.value };
                            return { ...p, customization: { ...p.customization, options: arr } };
                          })}
                          placeholder="Type (e.g. text, select)"
                          className="w-32 px-4 py-2 border border-gray-300 rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => setProduct(p => ({
                            ...p,
                            customization: {
                              ...p.customization,
                              options: p.customization.options.filter((_, idx) => idx !== i)
                            }
                          }))}
                          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => setProduct(p => ({
                        ...p,
                        customization: {
                          ...p.customization,
                          options: [...(p.customization.options || []), { name: '', type: 'text', values: [] }]
                        }
                      }))}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      + Add Customization Option
                    </button>
                  </div>
                )}
              </div>
            </div>

          {/* Policies Tab */}
          <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Policies & Guarantees</h2>
              
              {/* Warranty */}
              <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                <label className="text-lg font-semibold text-gray-900 mb-4 block">Product Warranty</label>
                <p className="text-sm text-gray-600 mb-4">Provide warranty information to build customer trust</p>
                
                <div className="space-y-4">
                  <div>
                    <label className={labelClass}>Warranty Period</label>
                    <input
                      type="text"
                      value={product.warranty?.period || ''}
                      onChange={e => setProduct(p => ({ ...p, warranty: { ...(p.warranty || {}), period: e.target.value } }))}
                      className={inputClass}
                      placeholder="e.g., 12 months, 2 years"
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Warranty Provider</label>
                    <input
                      type="text"
                      value={product.warranty?.provider || ''}
                      onChange={e => setProduct(p => ({ ...p, warranty: { ...(p.warranty || {}), provider: e.target.value } }))}
                      className={inputClass}
                      placeholder="e.g., Manufacturer, Store"
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Warranty Details</label>
                    <textarea
                      value={product.warranty?.details || ''}
                      onChange={e => setProduct(p => ({ ...p, warranty: { ...(p.warranty || {}), details: e.target.value } }))}
                      className={`${inputClass} h-24`}
                      placeholder="Describe what the warranty covers..."
                    />
                  </div>
                </div>
              </div>

              {/* Return Policy */}
              <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                <label className="text-lg font-semibold text-gray-900 mb-4 block">Return Policy</label>
                <p className="text-sm text-gray-600 mb-4">Set clear return and refund policies</p>
                
                <div className="space-y-4">
                  <div>
                    <label className={labelClass}>Return Window (Days)</label>
                    <input
                      type="number"
                      value={product.returnPolicy?.days ?? ''}
                      onChange={e => setProduct(p => ({ ...p, returnPolicy: { ...(p.returnPolicy || {}), days: e.target.value === '' ? undefined : Number(e.target.value) } }))}
                      className={inputClass}
                      placeholder="e.g., 30"
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="refundable"
                      checked={product.returnPolicy?.refundable ?? true}
                      onChange={e => setProduct(p => ({ ...p, returnPolicy: { ...(p.returnPolicy || {}), refundable: e.target.checked } }))}
                      className="w-5 h-5"
                    />
                    <label htmlFor="refundable" className="text-sm font-medium text-gray-700">
                      Product is Refundable
                    </label>
                  </div>
                  <div>
                    <label className={labelClass}>Return Policy Details</label>
                    <textarea
                      value={product.returnPolicy?.details || ''}
                      onChange={e => setProduct(p => ({ ...p, returnPolicy: { ...(p.returnPolicy || {}), details: e.target.value } }))}
                      className={`${inputClass} h-24`}
                      placeholder="Describe the return process and conditions..."
                    />
                  </div>
                </div>
              </div>

              {/* FAQs */}
              <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <label className="text-lg font-semibold text-gray-900 block">Frequently Asked Questions</label>
                    <p className="text-sm text-gray-600 mt-1">Help customers by answering common questions</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setProduct(p => ({ ...p, faqs: [...(p.faqs || []), { question: '', answer: '' }] }))}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    + Add FAQ
                  </button>
                </div>

                {(product.faqs || []).length === 0 ? (
                  <p className="text-center text-gray-500 py-4">No FAQs yet. Click "Add FAQ" to create one.</p>
                ) : (
                  <div className="space-y-4">
                    {(product.faqs || []).map((f, i) => (
                      <div key={i} className="bg-white rounded-lg p-4 border border-gray-200">
                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Question</label>
                            <input
                              type="text"
                              value={f.question || ''}
                              onChange={e => setProduct(p => {
                                const arr = [...(p.faqs || [])];
                                arr[i] = { ...(arr[i] || {}), question: e.target.value };
                                return { ...p, faqs: arr };
                              })}
                              className={inputClass}
                              placeholder="What is your question?"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Answer</label>
                            <textarea
                              value={f.answer || ''}
                              onChange={e => setProduct(p => {
                                const arr = [...(p.faqs || [])];
                                arr[i] = { ...(arr[i] || {}), answer: e.target.value };
                                return { ...p, faqs: arr };
                              })}
                              className={`${inputClass} h-20`}
                              placeholder="Your answer..."
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => setProduct(p => ({ ...p, faqs: p.faqs.filter((_, idx) => idx !== i) }))}
                            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                          >
                            Remove FAQ
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

          {/* Reviews Tab */}
          <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Customer Reviews</h2>
              
              {/* Add Review Form */}
              <div className="bg-indigo-50 rounded-xl p-6 border-2 border-indigo-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Review</h3>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>Reviewer Name (Optional)</label>
                      <input
                        type="text"
                        value={newReview.authorName}
                        onChange={e => setNewReview(n => ({ ...n, authorName: e.target.value }))}
                        className={inputClass}
                        placeholder="Anonymous"
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Rating (1-5)</label>
                      <input
                        type="number"
                        min={1}
                        max={5}
                        step={0.1}
                        value={newReview.rating}
                        onChange={e => setNewReview(n => ({ ...n, rating: e.target.value }))}
                        className={inputClass}
                      />
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Review Title</label>
                    <input
                      type="text"
                      value={newReview.title}
                      onChange={e => setNewReview(n => ({ ...n, title: e.target.value }))}
                      className={inputClass}
                      placeholder="Great product!"
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Review Content</label>
                    <textarea
                      value={newReview.body}
                      onChange={e => setNewReview(n => ({ ...n, body: e.target.value }))}
                      className={`${inputClass} h-32`}
                      placeholder="Write your review..."
                    />
                  </div>
                  <button
                    type="button"
                    onClick={addReview}
                    className="w-full px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors shadow-md"
                  >
                    Add Review
                  </button>
                </div>
              </div>

              {/* Existing Reviews */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Existing Reviews ({(product.reviews || []).length})
                </h3>
                
                {(product.reviews || []).length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-xl">
                    <p className="text-gray-600">No reviews yet. Add the first review above.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {(product.reviews || []).map((r, i) => (
                      <div key={i} className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold text-gray-900">{r.authorName || 'Anonymous'}</span>
                              <span className="text-yellow-500">
                                {'★'.repeat(Math.round(r.rating || 0))}{'☆'.repeat(5 - Math.round(r.rating || 0))}
                              </span>
                            </div>
                            <p className="text-sm text-gray-500">
                              {new Date(r.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeReviewAt(i)}
                            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm"
                          >
                            Delete
                          </button>
                        </div>
                        {r.title && <h4 className="font-semibold text-gray-900 mb-2">{r.title}</h4>}
                        <p className="text-gray-700">{r.body}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

          {/* SEO Tab */}
          <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">SEO & Search Optimization</h2>
              
              <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                <p className="text-sm text-gray-600 mb-6">
                  Optimize how your product appears in search engines and social media shares
                </p>
                
                <div className="space-y-6">
                  {/* Meta Title */}
                  <div>
                    <label className={labelClass}>SEO Title</label>
                    <input
                      type="text"
                      value={product.seo?.title || ''}
                      onChange={e => setProduct(p => ({ ...p, seo: { ...p.seo, title: e.target.value } }))}
                      className={inputClass}
                      placeholder="e.g., Premium Leather Jacket - Brand Name"
                    />
                    <div className="flex justify-between items-center mt-2">
                      <p className="text-xs text-gray-500">Recommended: 50-60 characters</p>
                      <span className={`text-sm font-medium ${
                        (product.seo?.title || '').length > 60 ? 'text-red-600' : 'text-gray-600'
                      }`}>
                        {(product.seo?.title || '').length}/60
                      </span>
                    </div>
                  </div>

                  {/* Meta Description */}
                  <div>
                    <label className={labelClass}>SEO Meta Description</label>
                    <textarea
                      value={product.seo?.description || ''}
                      onChange={e => setProduct(p => ({ ...p, seo: { ...p.seo, description: e.target.value } }))}
                      className={`${inputClass} h-32`}
                      placeholder="Write a compelling description for search engines..."
                    />
                    <div className="flex justify-between items-center mt-2">
                      <p className="text-xs text-gray-500">Recommended: 120-155 characters</p>
                      <span className={`text-sm font-medium ${
                        (product.seo?.description || '').length > 155 ? 'text-red-600' : 'text-gray-600'
                      }`}>
                        {(product.seo?.description || '').length}/155
                      </span>
                    </div>
                  </div>

                  {/* Keywords */}
                  <div>
                    <label className={labelClass}>SEO Keywords</label>
                    <input
                      type="text"
                      value={product.seo?.keywords || ''}
                      onChange={e => setProduct(p => ({
                        ...p,
                        seo: { ...p.seo, keywords: e.target.value }
                      }))}
                      className={inputClass}
                      placeholder="comma separated keywords"
                    />
                    <p className="text-xs text-gray-500 mt-1">Enter words that describe this product, separated by commas.</p>
                  </div>                      <p className="text-xs text-gray-500">Recommended: 120-155 characters</p>
                      <span className={`text-sm font-medium ${
                        (product.seo?.description || '').length > 155 ? 'text-red-600' : 'text-gray-600'
                      }`}>
                        {(product.seo?.description || '').length}/155
                      </span>
                    </div>
                  </div>

                  {/* Preview */}
                  <div className="bg-white rounded-lg p-4 border border-gray-300">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Search Engine Preview</h4>
                    <div className="space-y-1">
                      <div className="text-blue-700 text-lg font-medium">
                        {product.seo?.title || product.title || 'Your Product Title'}
                      </div>
                      <div className="text-green-700 text-sm">
                        yoursite.com/product/{product.title?.toLowerCase().replace(/\s+/g, '-') || 'product-name'}
                      </div>
                      <div className="text-gray-600 text-sm">
                        {product.seo?.description || product.description?.substring(0, 155) || 'Your product description will appear here...'}
                  </div>
                </div>
              </div>
            </div>
        </div>

        {/* Action Buttons */}
        <div className="bg-white rounded-xl shadow-md p-6 mt-6">
          <div className="flex flex-col sm:flex-row gap-4 justify-end">
            <button
              type="button"
              onClick={() => router.push('/dashabord/products')}
              className="px-8 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-all"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Update Product'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
