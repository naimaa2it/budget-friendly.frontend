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
    keyAttributes: [],
    customization: { customizable: false, options: [] },
    warranty: { period: '', details: '', provider: '' },
    returnPolicy: { days: undefined, refundable: true, details: '' },
    faqs: [],
    reviews: [],
    averageRating: 0,
    reviewCount: 0,
    status: 'draft',
    specs: {},
    seo: { title: '', description: '' },
    featured: false,
    coupon: false,
    flashSale: false,
    clearance: false,
    badges: []
  });

  const [activeTab, setActiveTab] = useState('basic');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newReview, setNewReview] = useState({ authorName: '', rating: 5, title: '', body: '' });

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
          p.seo = p.seo || { title: '', description: '' };
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
    const rating = Number(newReview.rating) || 0;
    if (rating < 1 || rating > 5) return alert('Rating must be between 1 and 5');
    const review = { authorName: newReview.authorName || undefined, rating, title: newReview.title || '', body: newReview.body || '', helpful: 0, createdAt: new Date().toISOString() };
    setProduct(p => {
      const reviews = [...(p.reviews||[]), review];
      const { count, avg } = recalcReviews(reviews);
      return { ...p, reviews, reviewCount: count, averageRating: avg };
    });
    setNewReview({ authorName: '', rating: 5, title: '', body: '' });
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
      const payload = { ...product, specs: { ...(product.specs || {}), sizes: product.sizes || product.specs?.sizes || [] } };
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

  const tabs = [
    { id: 'basic', label: 'Basic Info', icon: '📝' },
    { id: 'pricing', label: 'Pricing', icon: '💰' },
    { id: 'images', label: 'Images', icon: '🖼️' },
    { id: 'variants', label: 'Variants', icon: '🔀' },
    { id: 'attributes', label: 'Attributes', icon: '⚙️' },
    { id: 'policies', label: 'Policies', icon: '📋' },
    { id: 'reviews', label: 'Reviews', icon: '⭐' },
    { id: 'seo', label: 'SEO', icon: '🔍' }
  ];

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

        {/* Tab Navigation */}
        <div className="bg-white rounded-xl shadow-md mb-6 overflow-hidden">
          <div className="flex overflow-x-auto">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 min-w-[120px] px-6 py-4 text-sm font-medium transition-all border-b-2 ${
                  activeTab === tab.id
                    ? 'border-indigo-600 text-indigo-600 bg-indigo-50'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <div className="flex flex-col items-center gap-1">
                  <span className="text-2xl">{tab.icon}</span>
                  <span>{tab.label}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-xl shadow-md p-8">
          {/* Basic Info Tab */}
          {activeTab === 'basic' && (
    const review = { authorName: newReview.authorName || undefined, rating, title: newReview.title || '', body: newReview.body || '', helpful: 0, createdAt: new Date().toISOString() };
    setProduct(p => {
      const reviews = [...(p.reviews||[]), review];
      const { count, avg } = recalcReviews(reviews);
      return { ...p, reviews, reviewCount: count, averageRating: avg };
    });
    setNewReview({ authorName: '', rating: 5, title: '', body: '' });
  };

  const removeReviewAt = (idx) => setProduct(p => {
    const reviews = (p.reviews || []).filter((_, i) => i !== idx);
    const { count, avg } = recalcReviews(reviews);
    return { ...p, reviews, reviewCount: count, averageRating: avg };
  });

  const handleSave = async () => {
    if (!product.title) return alert('Title is required');
    if (Array.isArray(product.variants) && product.variants.some(v => v.price == null)) {
      return alert('Please enter a price for every variant or remove empty variants.');
    }
    setSaving(true);
    try {
      // ensure specs.sizes and top-level sizes are kept in sync for backward compatibility
      const payload = { ...product, specs: { ...(product.specs || {}), sizes: product.sizes || product.specs?.sizes || [] } };
      const resp = await fetch(`${API}/api/admin/products/${productId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(payload) });
      const body = await resp.json();
      if (!resp.ok) throw new Error(body.error || 'Save failed');
      router.push('/dashabord/products');
    } catch (err) {
      alert(err.message || 'Save failed');
    } finally { setSaving(false); }
  };

  return (
    <div className="max-w-4xl mx-auto mt-6 bg-white p-6 rounded shadow">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-semibold text-blue-600">Edit product</h2>
      </div>

      {loading ? <div className="text-center py-12">Loading…</div> : (
        <div className="space-y-6">
          {/* Basic information */}
          <section className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-start justify-between gap-6 mb-4">
              <div>
                <h3 className="text-xl font-semibold text-gray-800">Basic information</h3>
                <p className="text-sm text-gray-500 mt-1">Title, short description and the product status. These appear on the product page and catalog.</p>
              </div>
              <div className="text-sm text-gray-500">Required fields are marked visually</div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className={labelClass}>Title</label>
                <input value={product.title} onChange={e => setProduct(p=>({...p, title: e.target.value}))} className={inputClass} />
              </div>

              <div>
                <label className={labelClass}>Description</label>
                <textarea value={product.description || ''} onChange={e => setProduct(p=>({...p, description: e.target.value}))} className={`${inputClass} h-28`} />
              </div>

              <div className="flex items-center justify-between gap-6">
                <div>
                  <label className={labelClass}>Status</label>
                  <div className="text-xs text-gray-500 mt-1">Choose the product status (labels map to backend values).</div>
                  <select value={product.status} onChange={e => setProduct(p=>({...p, status: e.target.value}))} className="mt-2 border px-3 py-2 rounded-md">
                    <option value="draft">Draft</option>
                    <option value="draft">Unpublish</option>
                    <option value="archived">Archive</option>
                    <option value="published">Publish</option>
                  </select>
                </div>

                <div className="flex-1">
                  <label className={labelClass}>Category</label>
                  <div className="grid grid-cols-3 gap-3 mt-2">
                    <select value={selectedMain?._id || ''} onChange={e => { const id = e.target.value; const main = categories.find(c=>String(c._id)===id)||null; setSelectedMain(main); setSelectedSub(null); setSelectedChild(null); setProduct(p=>({ ...p, categoryId: id || undefined, category: main?.name || '' })); }} className="w-full border px-3 py-2 rounded-md">
                      <option value="">Choose</option>
                      {categories.map(c=> <option key={c._id} value={c._id}>{c.name}</option>)}
                    </select>

                    <select value={selectedSub?._id || ''} onChange={e => { const id = e.target.value; const sub = (selectedMain?.children||[]).find(c=>String(c._id)===id)||null; setSelectedSub(sub); setSelectedChild(null); setProduct(p=>({ ...p, categoryId: id || p.categoryId })); }} className="w-full border px-3 py-2 rounded-md">
                      <option value="">Sub</option>
                      {(selectedMain?.children||[]).map(c=> <option key={c._id} value={c._id}>{c.name}</option>)}
                    </select>

                    <select value={selectedChild?._id || ''} onChange={e => { const id = e.target.value; const child = (selectedSub?.children||[]).find(c=>String(c._id)===id)||null; setSelectedChild(child); setProduct(p=>({ ...p, categoryId: id || p.categoryId })); }} className="w-full border px-3 py-2 rounded-md">
                      <option value="">Child</option>
                      {(selectedSub?.children||[]).map(c=> <option key={c._id} value={c._id}>{c.name}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Pricing & inventory */}
          <section className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Pricing & inventory</h3>
                <p className="text-sm text-gray-500 mt-1">Set price, offer/compare price and available stock. Currency and availability help customers understand purchasing options.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className={labelClass}>Price</label>
                <input type="number" value={product.price ?? ''} onChange={e => setProduct(p=>({...p, price: e.target.value === '' ? undefined : Number(e.target.value)}))} className={inputClass} />
              </div>

              <div>
                <label className={labelClass}>Offer price — Was price (optional)</label>
                <input type="number" value={product.compareAtPrice ?? ''} onChange={e => setProduct(p=>({...p, compareAtPrice: e.target.value === '' ? undefined : Number(e.target.value)}))} className={inputClass} />
              </div>

              <div>
                <label className={labelClass}>Stock quantity</label>
                <input type="number" value={product.inventory ?? ''} onChange={e => setProduct(p=>({...p, inventory: e.target.value === '' ? undefined : Number(e.target.value)}))} className={inputClass} />
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className={labelClass}>Currency</label>
                <input value={product.currency ?? ''} placeholder="USD" onChange={e => setProduct(p=>({...p, currency: e.target.value}))} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Availability</label>
                <select value={product.availability || 'in_stock'} onChange={e => setProduct(p=>({...p, availability: e.target.value}))} className="w-full border px-3 py-2 rounded-md">
                  <option value="in_stock">In stock — available now</option>
                  <option value="pre_order">Pre-order — accept orders before shipping</option>
                  <option value="upcoming">Coming soon — not available yet</option>
                  <option value="out_of_stock">Out of stock — not available</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>SKU (optional)</label>
                <input value={product.sku || ''} onChange={e => setProduct(p=>({...p, sku: e.target.value}))} className={inputClass} />
              </div>
            </div>
          </section>

          {/* Variants editor (title, sku, price, inventory) */}
          <section className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Variants</h3>
                <p className="text-sm text-gray-500 mt-1">Add product variants (size/color). Each variant can have its own SKU, price and inventory.</p>
              </div>
              <div>
                <button type="button" onClick={onAddVariant} className="text-sm px-3 py-1 bg-slate-100 rounded">+ Add variant</button>
              </div>
            </div>

            {(product.variants || []).length === 0 && (
              <div className="text-sm text-slate-500">No variants yet — add variant if product has size/color/other variations.</div>
            )}

            <div className="space-y-3 mt-3">
              {(product.variants || []).map((v, idx) => (
                <div key={idx} className="grid grid-cols-5 gap-2 items-center border p-2 rounded">
                  <input placeholder="Label (e.g. Red - L)" value={v.title || ''} onChange={e => onChangeVariant(idx, { title: e.target.value })} className="col-span-2 border px-2 py-1 rounded" />
                  <input placeholder="SKU" value={v.sku || ''} onChange={e => onChangeVariant(idx, { sku: e.target.value })} className="border px-2 py-1 rounded" />
                  <input placeholder="Price" value={v.price ?? ''} onChange={e => onChangeVariant(idx, { price: e.target.value === '' ? undefined : Number(e.target.value) })} className="border px-2 py-1 rounded" />
                  <div className="flex gap-2 items-center">
                    <input placeholder="Qty" value={v.inventory ?? ''} onChange={e => onChangeVariant(idx, { inventory: e.target.value === '' ? undefined : Number(e.target.value) })} className="w-16 border px-2 py-1 rounded" />
                    <button type="button" onClick={() => onRemoveVariant(idx)} className="text-sm text-red-600">Remove</button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium">Product code (SKU)</label>
              <input value={product.sku || ''} onChange={e => setProduct(p=>({...p, sku: e.target.value}))} className="w-full border px-3 py-2 rounded" />
              <div className="text-xs text-gray-500 mt-1">Optional — an internal code to track the product (e.g. ABC-123).</div>
            </div>
            <div>
              <label className="block text-sm font-medium">Currency</label>
              <input value={product.currency ?? ''} placeholder="USD" onChange={e => setProduct(p=>({...p, currency: e.target.value}))} className="w-full border px-3 py-2 rounded" />
              <div className="text-xs text-gray-500 mt-1">Currency code (e.g. USD, INR). You can clear and type a different code.</div>
            </div>
            <div>
              <label className="block text-sm font-medium">Availability</label>
              <select value={product.availability || 'in_stock'} onChange={e => setProduct(p=>({...p, availability: e.target.value}))} className="w-full border px-3 py-2 rounded">
                <option value="in_stock">In stock — available now</option>
                <option value="pre_order">Pre-order — accept orders before shipping</option>
                <option value="upcoming">Coming soon — not available yet</option>
                <option value="out_of_stock">Out of stock — not available</option>
              </select>
              <div className="text-xs text-gray-500 mt-1">Choose if customers can buy it now or need to wait.</div>
            </div>
          </div>

          {/* Colors, sizes & care — clearer labels */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium">Colors</label>
              <div className="text-xs text-gray-500 mt-1">Add color options customers can choose from (name + swatch).</div>
              <div className="space-y-2 mt-2">
                {(product.colors || []).map((c, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <input value={c.name || ''} onChange={e => setProduct(p=>{ const arr = [...(p.colors||[])]; arr[i] = { ...(arr[i]||{}), name: e.target.value }; return { ...p, colors: arr }; })} placeholder="Color name (e.g. Navy)" className="border px-2 py-1 rounded w-32" />
                    <input type="color" value={c.hex || '#000000'} onChange={e => setProduct(p=>{ const arr = [...(p.colors||[])]; arr[i] = { ...(arr[i]||{}), hex: e.target.value }; return { ...p, colors: arr }; })} className="w-12 h-8 p-0 rounded border" />
                    <input value={c.label || ''} onChange={e => setProduct(p=>{ const arr = [...(p.colors||[])]; arr[i] = { ...(arr[i]||{}), label: e.target.value }; return { ...p, colors: arr }; })} placeholder="Optional label (e.g. Midnight Blue)" className="border px-2 py-1 rounded flex-1" />
                    <button onClick={() => setProduct(p=>({...p, colors: p.colors.filter((_,idx)=>idx!==i)}))} className="px-2 py-1 border rounded text-sm text-red-600">Remove</button>
                  </div>
                ))}
                <button onClick={() => setProduct(p=>({...p, colors: [...(p.colors||[]), {name:'', hex:'#000000'}]}))} className="px-2 py-1 border rounded text-sm mt-2">Add color</button>

                
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium">Sizes</label>
              <div className="text-xs text-gray-500 mt-1">Enter sizes separated by commas (e.g. S, M, L). These appear as options for customers.</div>
              <input value={(product.sizes||[]).join(', ')} onChange={e => { const arr = e.target.value.split(',').map(s=>s.trim()).filter(Boolean); setProduct(p=>({...p, sizes: arr, specs: {...(p.specs||{}), sizes: arr}})); }} className="w-full border px-3 py-2 rounded" />

              <label className="block text-sm font-medium mt-3">Care & instructions</label>
              <div className="text-xs text-gray-500 mt-1">Write washing/care instructions customers should see.</div>
              <textarea value={product.guidelines || ''} onChange={e => setProduct(p=>({...p, guidelines: e.target.value}))} className="w-full border px-3 py-2 rounded h-24" />
            </div>
          </div>

          {/* Highlights (moved after Available Colors) */}
          <div>
            <label className="block text-sm font-medium">Highlights (short facts)</label>
            <div className="text-xs text-gray-500 mt-1">Short bullets shown near the product title (e.g. Lightweight, 2-year warranty).</div>
            <div className="space-y-2 mt-2">
              {(product.keyAttributes || []).map((a, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <input value={a.label || ''} onChange={e => setProduct(p=>{ const arr = [...(p.keyAttributes||[])]; arr[i] = { ...(arr[i]||{}), label: e.target.value }; return { ...p, keyAttributes: arr }; })} placeholder="Label (e.g. Weight)" className="border px-2 py-1 rounded w-40" />
                  <input value={a.value || ''} onChange={e => setProduct(p=>{ const arr = [...(p.keyAttributes||[])]; arr[i] = { ...(arr[i]||{}), value: e.target.value }; return { ...p, keyAttributes: arr }; })} placeholder="Value (e.g. 200g)" className="border px-2 py-1 rounded flex-1" />
                  <button onClick={() => setProduct(p=>({...p, keyAttributes: p.keyAttributes.filter((_,idx)=>idx!==i)}))} className="px-2 py-1 border rounded text-sm text-red-600">Remove</button>
                </div>
              ))}
              <button onClick={() => setProduct(p=>({...p, keyAttributes: [...(p.keyAttributes||[]), { label: '', value: '' }]}))} className="px-2 py-1 border rounded text-sm mt-2">Add highlight</button>
            </div>
          </div>

          {/* Promotions & badges (moved) */}
          <div className="mt-4">
            <label className="block text-sm font-medium">Promotions & badges</label>
            <div className="text-xs text-gray-500 mt-1">Promotion flags and storefront badges — choose any that apply.</div>

            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="flex gap-3 flex-wrap items-center">
                <label className="inline-flex items-center gap-2"><input type="checkbox" checked={product.featured || false} onChange={e => setProduct(p=>({...p, featured: e.target.checked}))} /> Featured</label>
                <label className="inline-flex items-center gap-2"><input type="checkbox" checked={product.coupon || false} onChange={e => setProduct(p=>({...p, coupon: e.target.checked}))} /> Coupon</label>
                <label className="inline-flex items-center gap-2"><input type="checkbox" checked={product.flashSale || false} onChange={e => setProduct(p=>({...p, flashSale: e.target.checked}))} /> Flash sale</label>
                <label className="inline-flex items-center gap-2"><input type="checkbox" checked={product.clearance || false} onChange={e => setProduct(p=>({...p, clearance: e.target.checked}))} /> Clearance deal</label>
              </div>

              <div>
                <div className="flex gap-2 flex-wrap">
                  {[
                    { key: 'best_seller', label: 'Best seller' },
                    { key: 'hot', label: 'Hot' },
                    { key: 'new_arrival', label: 'New arrival' },
                    { key: 'trending', label: 'Trending' },
                    { key: 'limited', label: 'Limited edition' }
                  ].map(b => (
                    <label key={b.key} className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium border transition-colors ${ (product.badges||[]).includes(b.key) ? 'bg-indigo-600 text-white border-indigo-600 shadow' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}>
                      <input className="sr-only" type="checkbox" checked={(product.badges||[]).includes(b.key)} onChange={() => setProduct(p => ({ ...p, badges: (p.badges||[]).includes(b.key) ? p.badges.filter(x=>x!==b.key) : [...(p.badges||[]), b.key] }))} aria-checked={(product.badges||[]).includes(b.key)} />
                      {b.label}
                    </label>
                  ))}
                </div>
              </div>

              <div className="sm:col-span-2 flex gap-3 items-center">
                <select value={product.status} onChange={e => setProduct(p=>({...p, status: e.target.value}))} className="border px-3 py-2 rounded">
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
                <input placeholder="Keywords customers search for (comma separated)" value={(product.tags||[]).join(', ')} onChange={e => setProduct(p=>({...p, tags: e.target.value.split(',').map(s=>s.trim()).filter(Boolean)}))} className="border px-3 py-2 rounded flex-1" />
              </div>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium">Images</label>
            <div className="text-xs text-gray-500 mt-1">Click to upload or drag files. Uploaded images are stored in Cloudinary and optimized automatically.</div>

            <label className="mt-2 flex items-center gap-3 cursor-pointer border-2 border-dashed border-gray-200 rounded px-4 py-6 text-center">
              <input type="file" accept="image/*" multiple className="sr-only" onChange={e => Array.from(e.target.files || []).forEach(f => f && handleFile(f))} />
              <div className="text-sm text-gray-600">Click to select images or drop here</div>
            </label>

            <div className="flex gap-2 mt-3 flex-wrap">
              {(product.images||[]).map((img, i) => (
                <div key={i} className="relative w-24 h-24 rounded overflow-hidden border">
                  {/* preview (local or uploaded) */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.url} alt="" className="w-full h-full object-cover" />

                  {/* uploading overlay for local previews */}
                  {img.uploading || img.__local ? (
                    <div className="absolute inset-0 bg-white/70 flex items-center justify-center text-xs text-gray-700">Uploading…</div>
                  ) : null}

                  <button type="button" onClick={() => setProduct(p=>({...p, images: p.images.filter((_,idx)=>idx!==i)}))} className="absolute -top-2 -right-2 bg-white rounded-full p-1 border text-red-600">×</button>
                </div>
              ))}
            </div>
          </div>

          {/* Key attributes, customization, rewards */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium">Reward points (optional)</label>
              <input type="number" value={product.rewardPoints ?? ''} onChange={e => setProduct(p=>({...p, rewardPoints: e.target.value === '' ? undefined : Number(e.target.value)}))} className="w-full border px-3 py-2 rounded" />
              <div className="text-xs text-gray-500 mt-1">Points customers earn for buying this product.</div>
            </div>

            <div>
              <label className="block text-sm font-medium">Sold last 30 days</label>
              <input type="number" value={product.monthlySold ?? ''} onChange={e => setProduct(p=>({...p, monthlySold: e.target.value === '' ? undefined : Number(e.target.value)}))} className="w-full border px-3 py-2 rounded" />
              <div className="text-xs text-gray-500 mt-1">Use this to show popularity badges (e.g. “1k+ sold”).</div>
            </div>

            <div>
              <label className="block text-sm font-medium">Sales badge (auto)</label>
              <div className="w-full border px-3 py-2 rounded bg-gray-50">{product.monthlySold != null ? (product.monthlySold >= 1000000 ? Math.round((product.monthlySold/1000000)*10)/10 + 'M+' : product.monthlySold >= 1000 ? Math.round((product.monthlySold/1000)*10)/10 + 'k+' : String(product.monthlySold)) : ''}</div>
              <div className="text-xs text-gray-500 mt-2">Automatic display based on <code>Sold last 30 days</code>.</div>

              <div className="mt-3">
                <label className="block text-sm font-medium">Badges (storefront)</label>
                <div className="text-xs text-gray-500 mt-1">Pick one or more badges to display on the storefront (multiple selection allowed).</div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {[
                    { key: 'best_seller', label: 'Best seller' },
                    { key: 'hot', label: 'Hot' },
                    { key: 'new_arrival', label: 'New arrival' },
                    { key: 'trending', label: 'Trending' },
                    { key: 'limited', label: 'Limited edition' }
                  ].map(b => (
                    <label key={b.key} className={`inline-flex items-center gap-2 border px-3 py-1 rounded text-sm cursor-pointer ${ (product.badges||[]).includes(b.key) ? 'bg-indigo-50 border-indigo-200' : 'bg-white'}`}>
                      <input type="checkbox" checked={(product.badges||[]).includes(b.key)} onChange={() => setProduct(p => ({ ...p, badges: (p.badges||[]).includes(b.key) ? p.badges.filter(x=>x!==b.key) : [...(p.badges||[]), b.key] }))} />
                      {b.label}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div> 

          <div>
            <label className="block text-sm font-medium">Highlights (short facts)</label>
            <div className="text-xs text-gray-500 mt-1">Short bullets shown near the product title (e.g. Lightweight, 2-year warranty).</div>
            <div className="space-y-2 mt-2">
              {(product.keyAttributes || []).map((a, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <input value={a.label || ''} onChange={e => setProduct(p=>{ const arr = [...(p.keyAttributes||[])]; arr[i] = { ...(arr[i]||{}), label: e.target.value }; return { ...p, keyAttributes: arr }; })} placeholder="Label (e.g. Weight)" className="border px-2 py-1 rounded w-40" />
                  <input value={a.value || ''} onChange={e => setProduct(p=>{ const arr = [...(p.keyAttributes||[])]; arr[i] = { ...(arr[i]||{}), value: e.target.value }; return { ...p, keyAttributes: arr }; })} placeholder="Value (e.g. 200g)" className="border px-2 py-1 rounded flex-1" />
                  <button onClick={() => setProduct(p=>({...p, keyAttributes: p.keyAttributes.filter((_,idx)=>idx!==i)}))} className="px-2 py-1 border rounded text-sm text-red-600">Remove</button>
                </div>
              ))}
              <button onClick={() => setProduct(p=>({...p, keyAttributes: [...(p.keyAttributes||[]), { label: '', value: '' }]}))} className="px-2 py-1 border rounded text-sm mt-2">Add highlight</button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium">Customization</label>
            <div className="text-xs text-gray-500 mt-1">Allow customers to personalize this product (e.g. add engraving or custom text).</div>
            <div className="flex items-center gap-3 mt-2">
              <label className="inline-flex items-center gap-2"><input type="checkbox" checked={product.customization?.customizable || false} onChange={e => setProduct(p=>({...p, customization: {...(p.customization||{}), customizable: e.target.checked}}))} /> Allow customizations</label>
            </div>
            {(product.customization?.customizable) && (
              <div className="mt-3 space-y-2">
                {(product.customization.options || []).map((opt, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <input value={opt.name || ''} onChange={e => setProduct(p=>{ const arr = [...(p.customization.options||[])]; arr[i] = { ...(arr[i]||{}), name: e.target.value }; return { ...p, customization: {...p.customization, options: arr } }; })} placeholder="Option name (e.g. Engraving)" className="border px-2 py-1 rounded w-48" />
                    <input value={opt.type || 'text'} onChange={e => setProduct(p=>{ const arr = [...(p.customization.options||[])]; arr[i] = { ...(arr[i]||{}), type: e.target.value }; return { ...p, customization: {...p.customization, options: arr } }; })} placeholder="Type" className="border px-2 py-1 rounded w-28" />
                    <input value={(opt.values||[]).join(', ')} onChange={e => setProduct(p=>{ const arr = [...(p.customization.options||[])]; arr[i] = { ...(arr[i]||{}), values: e.target.value.split(',').map(s=>s.trim()).filter(Boolean) }; return { ...p, customization: {...p.customization, options: arr } }; })} placeholder="Values (comma)" className="border px-2 py-1 rounded flex-1" />
                    <button onClick={() => setProduct(p=>({...p, customization: {...p.customization, options: p.customization.options.filter((_,idx)=>idx!==i)} }))} className="px-2 py-1 border rounded text-sm text-red-600">Remove</button>
                  </div>
                ))}
                <button onClick={() => setProduct(p=>({...p, customization: {...p.customization, options: [...(p.customization.options||[]), { name: '', type: 'text', values: [] } ] } }))} className="px-2 py-1 border rounded text-sm">Add option</button>
              </div>
            )}
          </div>

          {/* Warranty & return policy */}
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium">Warranty</label>
              <div className="text-xs text-gray-500 mt-1">What you guarantee customers (period and details).</div>
              <input placeholder="Period (e.g. 12 months)" value={product.warranty?.period || ''} onChange={e => setProduct(p=>({...p, warranty: {...(p.warranty||{}), period: e.target.value}}))} className="w-full border px-3 py-2 rounded mt-2" />
              <input placeholder="Provider" value={product.warranty?.provider || ''} onChange={e => setProduct(p=>({...p, warranty: {...(p.warranty||{}), provider: e.target.value}}))} className="w-full border px-3 py-2 rounded mt-2" />
              <textarea placeholder="Warranty details" value={product.warranty?.details || ''} onChange={e => setProduct(p=>({...p, warranty: {...(p.warranty||{}), details: e.target.value}}))} className="w-full border px-3 py-2 rounded mt-2 h-20" />
            </div>

            <div>
              <label className="block text-sm font-medium">Return policy</label>
              <div className="text-xs text-gray-500 mt-1">How customers can return the product and whether refunds are allowed.</div>
              <input type="number" placeholder="Days (e.g. 30)" value={product.returnPolicy?.days ?? ''} onChange={e => setProduct(p=>({...p, returnPolicy: {...(p.returnPolicy||{}), days: e.target.value === '' ? undefined : Number(e.target.value)}}))} className="w-full border px-3 py-2 rounded mt-2" />
              <label className="inline-flex items-center gap-2 mt-2"><input type="checkbox" checked={product.returnPolicy?.refundable ?? true} onChange={e => setProduct(p=>({...p, returnPolicy: {...(p.returnPolicy||{}), refundable: e.target.checked}}))} /> Refundable</label>
              <textarea placeholder="Return details" value={product.returnPolicy?.details || ''} onChange={e => setProduct(p=>({...p, returnPolicy: {...(p.returnPolicy||{}), details: e.target.value}}))} className="w-full border px-3 py-2 rounded mt-2 h-20" />
            </div>
          </div>

          {/* FAQs */}
          <div>
            <label className="block text-sm font-medium">FAQs</label>
            <div className="text-xs text-gray-500 mt-1">Common customer questions shown on the product page. Helps reduce support requests.</div>
            <div className="space-y-2 mt-2">
              {(product.faqs || []).map((f, i) => (
                <div key={i} className="grid grid-cols-2 gap-2 items-start">
                  <input value={f.question || ''} onChange={e => setProduct(p=>{ const arr = [...(p.faqs||[])]; arr[i] = { ...(arr[i]||{}), question: e.target.value }; return { ...p, faqs: arr }; })} placeholder="Question" className="border px-2 py-1 rounded" />
                  <div className="flex gap-2">
                    <input value={f.answer || ''} onChange={e => setProduct(p=>{ const arr = [...(p.faqs||[])]; arr[i] = { ...(arr[i]||{}), answer: e.target.value }; return { ...p, faqs: arr }; })} placeholder="Answer" className="border px-2 py-1 rounded flex-1" />
                    <button onClick={() => setProduct(p=>({...p, faqs: p.faqs.filter((_,idx)=>idx!==i)}))} className="px-2 py-1 border rounded text-sm text-red-600">Remove</button>
                  </div>
                </div>
              ))}
              <button onClick={() => setProduct(p=>({...p, faqs: [...(p.faqs||[]), { question: '', answer: '' }]}))} className="px-2 py-1 border rounded text-sm mt-2">Add FAQ</button>
            </div>
          </div>

          {/* Reviews (read / remove) */}
          <div>
            <label className="block text-sm font-medium">Customer reviews (admin view)</label>
            <div className="mt-2 text-sm text-gray-600">Average: {product.averageRating || 0} • {product.reviewCount || 0} reviews. You can remove inappropriate reviews here; customers add reviews from the product page.</div>
            <div className="mt-3 space-y-3">
              {/* Add-review box for admin */}
              <div className="p-4 border rounded bg-gray-50">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm font-medium">Add review</div>
                  <div className="text-xs text-gray-500">Admins can add or remove reviews here.</div>
                </div>

                <div className="space-y-3">
                  <div className="flex gap-3">
                    <input placeholder="Your name (optional)" value={newReview.authorName} onChange={e => setNewReview(n => ({ ...n, authorName: e.target.value }))} className="border px-3 py-2 rounded w-1/4" />

                    <div className="w-28">
                      <label className="text-xs text-gray-600">Rating</label>
                      <input type="number" min={1} max={5} step={0.1} value={newReview.rating} onChange={e => setNewReview(n => ({ ...n, rating: Number(e.target.value) }))} className="w-full border px-2 py-2 rounded mt-1" />
                      <div className="text-xs text-gray-400 mt-1">Enter 1–5</div>
                    </div>

                    <input placeholder="Title" value={newReview.title} onChange={e => setNewReview(n => ({ ...n, title: e.target.value }))} className="flex-1 border px-3 py-2 rounded" />
                  </div>

                  <textarea placeholder="Write the review..." value={newReview.body} onChange={e => setNewReview(n => ({ ...n, body: e.target.value }))} className="w-full border px-3 py-2 rounded h-32" />

                  <div className="flex justify-end">
                    <button onClick={addReview} className="px-4 py-2 bg-green-600 text-white rounded shadow-sm">Add review</button>
                  </div>
                </div>
              </div>

              {/* Existing reviews */}
              {(product.reviews || []).map((r, i) => (
                <div key={i} className="border p-3 rounded">
                  <div className="flex justify-between items-start gap-3">
                    <div>
                      <div className="font-medium">{r.title || '—'} <span className="text-yellow-600">{'★'.repeat(Math.round(r.rating || 0))}</span></div>
                      <div className="text-xs text-gray-500">{r.authorName || (r.user ? `${r.user}` : 'Anonymous')} — {new Date(r.createdAt).toLocaleDateString()}</div>
                      <div className="mt-2">{r.body}</div>
                    </div>
                    <div>
                      <button onClick={() => removeReviewAt(i)} className="px-2 py-1 border rounded text-sm text-red-600">Delete review</button>
                    </div>
                  </div>
                </div>
              ))}

              {(!product.reviews || product.reviews.length === 0) && <div className="text-sm text-gray-500">No reviews yet</div>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium">Promotions & badges</label>
              <div className="text-xs text-gray-500 mt-1">Tick any badges that apply — these can be displayed on the storefront.</div>
              <div className="flex gap-3 items-center mt-2">
                <label className="inline-flex items-center gap-2"><input type="checkbox" checked={product.featured || false} onChange={e => setProduct(p=>({...p, featured: e.target.checked}))} /> Featured</label>
                <label className="inline-flex items-center gap-2"><input type="checkbox" checked={product.coupon || false} onChange={e => setProduct(p=>({...p, coupon: e.target.checked}))} /> Coupon</label>
                <label className="inline-flex items-center gap-2"><input type="checkbox" checked={product.flashSale || false} onChange={e => setProduct(p=>({...p, flashSale: e.target.checked}))} /> Flash sale</label>
                <label className="inline-flex items-center gap-2"><input type="checkbox" checked={product.clearance || false} onChange={e => setProduct(p=>({...p, clearance: e.target.checked}))} /> Clearance deal</label>
              </div>
            </div>

            <div>
              <div className="flex gap-3">
                <select value={product.status} onChange={e => setProduct(p=>({...p, status: e.target.value}))} className="border px-3 py-2 rounded">
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
                <input placeholder="Keywords customers search for (comma separated)" value={(product.tags||[]).join(', ')} onChange={e => setProduct(p=>({...p, tags: e.target.value.split(',').map(s=>s.trim()).filter(Boolean)}))} className="border px-3 py-2 rounded flex-1" />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium">Search listing (SEO / meta)</label>
            <div className="text-xs text-gray-500 mt-1">Title and description shown on search engines and social shares — keep title ≤ 60 chars and description ≤ 155 chars for best results.</div>

            <div className="mt-3 space-y-3">
              <div>
                <label className="text-xs font-medium">Meta title</label>
                <input placeholder="e.g. Lightweight Jacket — Brand" value={product.seo?.title || ''} onChange={e => setProduct(p=>({...p, seo: {...p.seo, title: e.target.value}}))} className="w-full border px-3 py-2 rounded" />
                <div className="flex justify-between items-center mt-1">
                  <div className="text-xs text-gray-500">Appears as the clickable headline in search results.</div>
                  <div className={`${(product.seo?.title || '').length > 60 ? 'text-red-600' : 'text-gray-500'} text-xs`}>{(product.seo?.title || '').length}/60</div>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium">Meta description</label>
                <textarea placeholder="Short summary for search engines and social shares" value={product.seo?.description || ''} onChange={e => setProduct(p=>({...p, seo: {...p.seo, description: e.target.value}}))} className="w-full border px-3 py-2 rounded h-20" />
                <div className="flex justify-between items-center mt-1">
                  <div className="text-xs text-gray-500">Shown under the title in search results.</div>
                  <div className={`${(product.seo?.description || '').length > 155 ? 'text-red-600' : 'text-gray-500'} text-xs`}>{(product.seo?.description || '').length}/155</div>
                </div>
              </div>

              <div className="mt-2 p-3 border rounded bg-gray-50">
                <div className="text-sm text-blue-600 font-medium">{product.seo?.title || product.title || 'Preview title'}</div>
                <div className="text-xs text-slate-500">{process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com'}/products/{product.slug || 'product-slug'}</div>
                <div className="text-sm text-gray-700 mt-2">{product.seo?.description ? product.seo.description : (product.description || '').slice(0,160)}</div>
              </div>
            </div>

            {/* Save / Cancel at bottom */}
            <div className="flex flex-col md:flex-row justify-end gap-3 mt-6 border-t pt-4">
              <button onClick={() => router.push('/dashabord/products')} className="px-4 py-2 border rounded text-sm w-full md:w-auto">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-indigo-600 text-white rounded text-sm shadow-md hover:bg-indigo-700 w-full md:w-auto">{saving ? 'Saving…' : 'Save product'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
