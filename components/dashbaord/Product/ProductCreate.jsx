"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/components/context/UserContext';

// CREATE product component — full copy of ProductEditor form but always POSTS
export default function ProductCreate() {
  const router = useRouter();
  const { user, refreshUser } = useUser();
  const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  const [product, setProduct] = useState({
    title: '',
    description: '',
    category: '',
    tags: [],
    images: [],
    variants: [],
    price: 0,
    compareAtPrice: 0,
    sku: '',
    currency: 'USD',
    inventory: 0,
    availability: 'in_stock',
    colors: [],
    sizes: [],
    guidelines: '',
    monthlySold: 0,
    rewardPoints: 0,
    keyAttributes: [],
    customization: { customizable: false, options: [] },
    warranty: { period: '', details: '', provider: '' },
    returnPolicy: { days: 0, refundable: true, details: '' },
    faqs: [],
    reviews: [],
    averageRating: 0,
    reviewCount: 0,
    status: 'draft',
    specs: {},

    // promotion flags — visible as checkboxes in editor
    featured: false,
    coupon: false,
    flashSale: false,
    clearance: false,
    // admin-controlled badges (select multiple)
    badges: []
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // local state for admin to add a review manually
  const [newReview, setNewReview] = useState({ authorName: '', rating: 5, title: '', body: '' });

  useEffect(() => { if (!user) refreshUser(); }, [user, refreshUser]);

  const [categories, setCategories] = useState([]);
  const [selectedMain, setSelectedMain] = useState(null);
  const [selectedSub, setSelectedSub] = useState(null);
  const [selectedChild, setSelectedChild] = useState(null);

  useEffect(() => {
    // load categories tree for selects
    fetch(`${API}/api/products/categories`).then(r => r.json()).then(b => {
      setCategories(b.categories || []);
    }).catch(() => setCategories([]));
  }, [API]);

  const handleFile = async (file) => {
    // show immediate local preview while uploading
    const preview = URL.createObjectURL(file);
    setProduct(p => ({ ...p, images: [...(p.images||[]), { url: preview, __local: true, uploading: true }] }));

    try {
      const fd = new FormData();
      fd.append('file', file);
      const resp = await fetch(`${API}/api/admin/upload`, { method: 'POST', body: fd, credentials: 'include' });
      const body = await resp.json();
      if (!resp.ok) throw new Error(body.error || 'Upload failed');

      const asset = { public_id: body.asset.public_id, url: body.asset.url, width: body.asset.width, height: body.asset.height, format: body.asset.format };

      // replace the local preview entry with the uploaded asset
      setProduct(p => {
        const imgs = (p.images || []).map(img => {
          if (img.__local && img.url === preview) return asset; // replace preview with real asset
          return img;
        });
        return { ...p, images: imgs };
      });

      // revoke local preview URL
      try { URL.revokeObjectURL(preview); } catch (e) { /* ignore */ }
    } catch (err) {
      // remove failed preview
      setProduct(p => ({ ...p, images: (p.images || []).filter(i => !(i.__local && i.url === preview)) }));
      alert(err.message || 'Upload failed');
    }
  };

  const onAddVariant = () => {
    setProduct(p => ({ ...p, variants: [...(p.variants||[]), { title: '', sku: '', price: 0, inventory: 0, attributes: {} }] }));
  };
  const onRemoveVariant = (idx) => setProduct(p => ({ ...p, variants: p.variants.filter((_,i)=>i!==idx) }));
  const onChangeVariant = (idx, patch) => setProduct(p => { const arr = [...(p.variants||[])]; arr[idx] = { ...(arr[idx]||{}), ...patch }; return { ...p, variants: arr }; });

  // ---- reviews helpers for admin editor ----
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
    setSaving(true);
    try {
      // ensure specs.sizes and top-level sizes are kept in sync for backward compatibility
      const payload = { ...product, specs: { ...(product.specs || {}), sizes: product.sizes || product.specs?.sizes || [] } };
      const resp = await fetch(`${API}/api/admin/products`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(payload) });
      const body = await resp.json();
      if (!resp.ok) throw new Error(body.error || 'Save failed');
      router.push('/dashabord/products');
    } catch (err) {
      alert(err.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto mt-6 bg-white p-6 rounded shadow">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-3xl font-semibold text-blue-600">Create product</h2>
      </div>

      {loading ? <div className="text-center py-12">Loading…</div> : (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium">Title</label>
            <input value={product.title} onChange={e => setProduct(p=>({...p, title: e.target.value}))} className="w-full border px-3 py-2 rounded" />
          </div>

          <div>
            <label className="block text-sm font-medium">Description</label>
            <textarea value={product.description || ''} onChange={e => setProduct(p=>({...p, description: e.target.value}))} className="w-full border px-3 py-2 rounded h-28" />
          </div>

          {/* Category selector (Main → Sub → Child) */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium">Category</label>
              <select value={selectedMain?._id || ''} onChange={e => { const id = e.target.value; const main = categories.find(c=>String(c._id)===id)||null; setSelectedMain(main); setSelectedSub(null); setSelectedChild(null); setProduct(p=>({ ...p, categoryId: id || undefined, category: main?.name || '' })); }} className="w-full border px-3 py-2 rounded">
                <option value="">Choose category</option>
                {categories.map(c=> <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium">Sub category</label>
              <select value={selectedSub?._id || ''} onChange={e => { const id = e.target.value; const sub = (selectedMain?.children||[]).find(c=>String(c._id)===id)||null; setSelectedSub(sub); setSelectedChild(null); setProduct(p=>({ ...p, categoryId: id || p.categoryId })); }} className="w-full border px-3 py-2 rounded">
                <option value="">Sub category</option>
                {(selectedMain?.children||[]).map(c=> <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium">Sub‑sub category</label>
              <select value={selectedChild?._id || ''} onChange={e => { const id = e.target.value; const child = (selectedSub?.children||[]).find(c=>String(c._id)===id)||null; setSelectedChild(child); setProduct(p=>({ ...p, categoryId: id || p.categoryId })); }} className="w-full border px-3 py-2 rounded">
                <option value="">Sub‑sub category</option>
                {(selectedSub?.children||[]).map(c=> <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </div>
          </div>

          {/* Pricing / inventory — simpler labels + help text */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium">Price</label>
              <input type="number" value={product.price || 0} onChange={e => setProduct(p=>({...p, price: Number(e.target.value)}))} className="w-full border px-3 py-2 rounded" />
            </div>
            <div>
              <label className="block text-sm font-medium">Offer price — Was price (optional)</label>
              <input type="number" value={product.compareAtPrice || 0} onChange={e => setProduct(p=>({...p, compareAtPrice: Number(e.target.value)}))} className="w-full border px-3 py-2 rounded" />
            </div>
            <div>
              <label className="block text-sm font-medium">Stock quantity</label>
              <input type="number" value={product.inventory || 0} onChange={e => setProduct(p=>({...p, inventory: Number(e.target.value)}))} className="w-full border px-3 py-2 rounded" />
            </div>
          </div>

          {/* Variants editor (title, sku, price, inventory) */}
          <div className="mt-4 border rounded p-3 bg-white">
            <div className="flex justify-between items-center mb-3">
              <div className="text-sm font-medium">Variants</div>
              <button type="button" onClick={onAddVariant} className="text-sm px-3 py-1 bg-slate-100 rounded">+ Add variant</button>
            </div>

            {(product.variants || []).length === 0 && (
              <div className="text-sm text-slate-500">No variants yet — add variant if product has size/color/other variations.</div>
            )}

            <div className="space-y-3">
              {(product.variants || []).map((v, idx) => (
                <div key={idx} className="grid grid-cols-5 gap-2 items-center border p-2 rounded">
                  <input placeholder="Label (e.g. Red - L)" value={v.title || ''} onChange={e => onChangeVariant(idx, { title: e.target.value })} className="col-span-2 border px-2 py-1 rounded" />
                  <input placeholder="SKU" value={v.sku || ''} onChange={e => onChangeVariant(idx, { sku: e.target.value })} className="border px-2 py-1 rounded" />
                  <input placeholder="Price" value={v.price || ''} onChange={e => onChangeVariant(idx, { price: e.target.value })} className="border px-2 py-1 rounded" />
                  <div className="flex gap-2 items-center">
                    <input placeholder="Qty" value={v.inventory || ''} onChange={e => onChangeVariant(idx, { inventory: e.target.value })} className="w-16 border px-2 py-1 rounded" />
                    <button type="button" onClick={() => onRemoveVariant(idx)} className="text-sm text-red-600">Remove</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium">Product code (SKU)</label>
              <input value={product.sku || ''} onChange={e => setProduct(p=>({...p, sku: e.target.value}))} className="w-full border px-3 py-2 rounded" />
              <div className="text-xs text-gray-500 mt-1">Optional — an internal code to track the product (e.g. ABC-123).</div>
            </div>
            <div>
              <label className="block text-sm font-medium">Currency</label>
              <input value={product.currency ?? ''} placeholder="USD" onChange={e => setProduct(p=>({...p, currency: e.target.value}))} className="w-full border px-3 py-2 rounded" />
            </div>
            <div>
              <label className="block text-sm font-medium">Availability</label>
              <select value={product.availability || 'in_stock'} onChange={e => setProduct(p=>({...p, availability: e.target.value}))} className="w-full border px-3 py-2 rounded">
                <option value="in_stock">In stock — available now</option>
                <option value="pre_order">Pre-order — accept orders before shipping</option>
                <option value="upcoming">Coming soon — not available yet</option>
                <option value="out_of_stock">Out of stock — not available</option>
              </select>
            </div>
          </div>

          {/* Colors, sizes & care — clearer labels */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium">Available Colors</label>
              <div className="space-y-2 mt-2">
                {(product.colors || []).map((c, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <input value={c.name || ''} onChange={e => setProduct(p=>{ const arr = [...(p.colors||[])]; arr[i] = { ...(arr[i]||{}), name: e.target.value }; return { ...p, colors: arr }; })} placeholder="Color name (e.g. Navy)" className="border px-2 py-1 rounded w-32" />
                    <input value={c.label || ''} onChange={e => setProduct(p=>{ const arr = [...(p.colors||[])]; arr[i] = { ...(arr[i]||{}), label: e.target.value }; return { ...p, colors: arr }; })} placeholder="level- Midnight Blue" className="border px-2 py-1 rounded flex-1" />
                    <button onClick={() => setProduct(p=>({...p, colors: p.colors.filter((_,idx)=>idx!==i)}))} className="px-2 py-1 border rounded text-sm text-red-600">Remove</button>
                  </div>
                ))}
                <button onClick={() => setProduct(p=>({...p, colors: [...(p.colors||[]), {name:'', hex:'#000000'}]}))} className="px-2 py-1 border rounded text-sm mt-2">Add color</button>

                {/* Badges (storefront) — shown here for convenience next to colors */}
                <div className="mt-4">
                  <label className="block text-sm font-medium">Badges (storefront)</label>
                  <div className="text-xs text-gray-500 mt-1">Pick badges to display on the product card.</div>
                  <div className="flex gap-2 flex-wrap mt-2">
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
              <label className="block text-sm font-medium">Sizes</label>
              <div className="text-xs text-gray-500 mt-1">Enter sizes separated by commas (e.g. S, M, L).</div>
              <input value={(product.sizes||[]).join(', ')} onChange={e => { const arr = e.target.value.split(',').map(s=>s.trim()).filter(Boolean); setProduct(p=>({...p, sizes: arr, specs: {...(p.specs||{}), sizes: arr}})); }} className="w-full border px-3 py-2 rounded" />

              <label className="block text-sm font-medium mt-3">Care & instructions</label>
              <div className="text-xs text-gray-500 mt-1">Write washing/care instructions customers should see.</div>
              <textarea value={product.guidelines || ''} onChange={e => setProduct(p=>({...p, guidelines: e.target.value}))} className="w-full border px-3 py-2 rounded h-24" />
            </div>
          </div>

          

          {/* Images — uploaded to Cloudinary (admin upload endpoint) */}
          <div>
            <label className="block text-sm font-medium">Images</label>
            <div className="text-xs text-gray-500 mt-1">Click to upload or drag files</div>

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
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium">Reward points (optional)</label>
              <input type="number" value={product.rewardPoints || 0} onChange={e => setProduct(p=>({...p, rewardPoints: Number(e.target.value)}))} className="w-full border px-3 py-2 rounded" />
              <div className="text-xs text-gray-500 mt-1">Points customers earn for buying this product.</div>
            </div>

            <div>
              <label className="block text-sm font-medium">Sold last 30 days</label>
              <input type="number" value={product.monthlySold || 0} onChange={e => setProduct(p=>({...p, monthlySold: Number(e.target.value)}))} className="w-full border px-3 py-2 rounded" />
              <div className="text-xs text-gray-500 mt-1">Use this to show popularity badges (e.g. “1k+ sold”).</div>
            </div>
          </div> 

         

          <div>
            <label className="block text-sm font-medium">Customization</label>
            <div className="flex items-center gap-3 mt-2">
              <label className="inline-flex items-center gap-2"><input type="checkbox" checked={product.customization?.customizable || false} onChange={e => setProduct(p=>({...p, customization: {...(p.customization||{}), customizable: e.target.checked}}))} /> Allow customizations</label>
            </div>
            {(product.customization?.customizable) && (
              <div className="mt-3 space-y-2">
                {(product.customization.options || []).map((opt, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <input value={opt.name || ''} onChange={e => setProduct(p=>{ const arr = [...(p.customization.options||[])]; arr[i] = { ...(arr[i]||{}), name: e.target.value }; return { ...p, customization: {...p.customization, options: arr } }; })} placeholder="Option name (e.g. Engraving)" className="border px-2 py-1 rounded w-68" />
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
              <input type="number" placeholder="Days (e.g. 30)" value={product.returnPolicy?.days || 0} onChange={e => setProduct(p=>({...p, returnPolicy: {...(p.returnPolicy||{}), days: Number(e.target.value)}}))} className="w-full border px-3 py-2 rounded mt-2" />
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
            <label className="block text-sm font-medium">Customer reviews</label>
            <div className="mt-3 space-y-3">
              {/* Add-review box for admin */}
              <div className="p-4 border rounded bg-gray-50">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm font-medium">Add review</div>
                </div>

                <div className="space-y-3">
                  <div className="flex flex-col gap-3">
                    <input placeholder="Your name (optional)" value={newReview.authorName} onChange={e => setNewReview(n => ({ ...n, authorName: e.target.value }))} className="border px-3 py-2 rounded w-full" />

                    <div className="w-full">
                      <label className="text-xs text-gray-600">Rating</label>
                      <input type="number" min={1} max={5} step={0.1} value={newReview.rating} onChange={e => setNewReview(n => ({ ...n, rating: Number(e.target.value) }))} className="w-full border px-2 py-2 rounded mt-1" />
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
            </div>
          </div>



          <div>
            <label className="block text-sm font-medium">Search listing (SEO / meta)</label>

            <div className="mt-3 space-y-3">
              <div>
                <label className="text-xs font-medium">Meta title</label>
                <input placeholder="e.g. Lightweight Jacket — Brand" value={product.seo?.title || ''} onChange={e => setProduct(p=>({...p, seo: {...p.seo, title: e.target.value}}))} className="w-full border px-3 py-2 rounded" />
                <div className="flex justify-between items-center mt-1">
                  <div className={`${(product.seo?.title || '').length > 60 ? 'text-red-600' : 'text-gray-500'} text-xs`}>{(product.seo?.title || '').length}/60</div>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium">Meta description</label>
                <textarea placeholder="Short summary for search engines and social shares" value={product.seo?.description || ''} onChange={e => setProduct(p=>({...p, seo: {...p.seo, description: e.target.value}}))} className="w-full border px-3 py-2 rounded h-20" />
                <div className="flex justify-between items-center mt-1">
                  <div className={`${(product.seo?.description || '').length > 155 ? 'text-red-600' : 'text-gray-500'} text-xs`}>{(product.seo?.description || '').length}/155</div>
                </div>
              </div>

              
            </div>

            {/* Save / Cancel at bottom */}
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => router.push('/dashabord/products')} className="px-4 py-2 border rounded text-sm">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-indigo-600 text-white rounded text-sm">{saving ? 'Saving…' : 'Save product'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}