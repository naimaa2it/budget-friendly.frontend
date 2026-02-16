"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/components/context/UserContext';

export default function ProductEditor({ productId }) {
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
    specs: {}
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

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

  useEffect(() => {
    if (!productId || productId === 'new') return;
    setLoading(true);
    fetch(`${API}/api/admin/products/${productId}`, { credentials: 'include' })
      .then(r => r.json())
      .then(async b => {
        if (b.product) {
          const p = b.product;
          // normalize fields for editor (backward compatibility)
          p.sizes = p.sizes || p.specs?.sizes || [];
          p.specs = { ...(p.specs || {}), sizes: p.sizes };
          p.currency = p.currency || 'USD';
          p.availability = p.availability || (p.inventory > 0 ? 'in_stock' : 'out_of_stock');
          p.colors = p.colors || [];
          p.keyAttributes = p.keyAttributes || [];
          p.customization = p.customization || { customizable: false, options: [] };
          p.warranty = p.warranty || { period: '', details: '', provider: '' };
          p.returnPolicy = p.returnPolicy || { days: 0, refundable: true, details: '' };
          p.faqs = p.faqs || [];
          p.reviews = p.reviews || [];
          p.rewardPoints = p.rewardPoints || 0;
          p.monthlySold = p.monthlySold || 0;
          p.compareAtPrice = p.compareAtPrice || 0;

          setProduct(p);

          // try to set selected category from categoryId or category name
          if (p.categoryId) {
            // find path in categories
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
            const path = findPath(categories, p.categoryId);
            if (path) {
              setSelectedMain(path[0] || null);
              setSelectedSub(path[1] || null);
              setSelectedChild(path[2] || null);
            }
          } else if (p.category) {
            // try match by name
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
            const path = matchByName(categories, p.category);
            if (path) {
              setSelectedMain(path[0] || null);
              setSelectedSub(path[1] || null);
              setSelectedChild(path[2] || null);
              if (!p.categoryId && path[path.length-1]) setProduct(prod => ({ ...prod, categoryId: path[path.length-1]._id }));
            }
          }
        }
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [productId, API, categories]);

  const handleFile = async (file) => {
    try {
      const fd = new FormData();
      fd.append('file', file);
      const resp = await fetch(`${API}/api/admin/upload`, { method: 'POST', body: fd, credentials: 'include' });
      const body = await resp.json();
      if (!resp.ok) throw new Error(body.error || 'Upload failed');
      const img = { public_id: body.asset.public_id, url: body.asset.url, width: body.asset.width, height: body.asset.height, format: body.asset.format };
      setProduct(p => ({ ...p, images: [...(p.images||[]), img] }));
    } catch (err) {
      alert(err.message || 'Upload failed');
    }
  };

  const onAddVariant = () => {
    setProduct(p => ({ ...p, variants: [...(p.variants||[]), { title: '', sku: '', price: 0, inventory: 0, attributes: {} }] }));
  };
  const onRemoveVariant = (idx) => setProduct(p => ({ ...p, variants: p.variants.filter((_,i)=>i!==idx) }));

  const handleSave = async () => {
    if (!product.title) return alert('Title is required');
    setSaving(true);
    try {
      // ensure specs.sizes and top-level sizes are kept in sync for backward compatibility
      const payload = { ...product, specs: { ...(product.specs || {}), sizes: product.sizes || product.specs?.sizes || [] } };
      const method = (productId && productId !== 'new') ? 'PUT' : 'POST';
      const url = (method === 'POST') ? `${API}/api/admin/products` : `${API}/api/admin/products/${productId}`;
      const resp = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(payload) });
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
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">{productId === 'new' ? 'Create product' : 'Edit product'}</h2>
        <div className="flex gap-2">
          <button onClick={() => router.push('/dashabord/products')} className="px-3 py-2 border rounded text-sm">Cancel</button>
          <button onClick={handleSave} className="px-3 py-2 bg-indigo-600 text-white rounded text-sm" disabled={saving}>{saving ? 'Saving…' : 'Save product'}</button>
        </div>
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

          {/* Pricing / inventory — simpler labels + help text */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium">Price</label>
              <input type="number" value={product.price || 0} onChange={e => setProduct(p=>({...p, price: Number(e.target.value)}))} className="w-full border px-3 py-2 rounded" />
              <div className="text-xs text-gray-500 mt-1">What customers will pay (enter numbers only).</div>
            </div>
            <div>
              <label className="block text-sm font-medium">Offer price — Was price (optional)</label>
              <input type="number" value={product.compareAtPrice || 0} onChange={e => setProduct(p=>({...p, compareAtPrice: Number(e.target.value)}))} className="w-full border px-3 py-2 rounded" />
              <div className="text-xs text-gray-500 mt-1">Leave empty unless you want to show a crossed-out original price.</div>
            </div>
            <div>
              <label className="block text-sm font-medium">Stock quantity</label>
              <input type="number" value={product.inventory || 0} onChange={e => setProduct(p=>({...p, inventory: Number(e.target.value)}))} className="w-full border px-3 py-2 rounded" />
              <div className="text-xs text-gray-500 mt-1">How many units are available to sell.</div>
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
              <input value={product.currency || 'USD'} onChange={e => setProduct(p=>({...p, currency: e.target.value}))} className="w-full border px-3 py-2 rounded" />
              <div className="text-xs text-gray-500 mt-1">Currency code (e.g. USD, INR). Leave as USD if not sure.</div>
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

          {/* Key attributes, customization, rewards */}
          <div className="grid grid-cols-3 gap-4">
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
            <div>
              <label className="block text-sm font-medium">Sales badge (auto)</label>
              <div className="w-full border px-3 py-2 rounded bg-gray-50">{product.monthlySold >= 1000000 ? Math.round((product.monthlySold/1000000)*10)/10 + 'M+' : product.monthlySold >= 1000 ? Math.round((product.monthlySold/1000)*10)/10 + 'k+' : String(product.monthlySold || 0)}</div>
              <div className="text-xs text-gray-500 mt-1">This is formatted for display and cannot be edited.</div>
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
          <div className="grid grid-cols-2 gap-4">
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
            <label className="block text-sm font-medium">Customer reviews (admin view)</label>
            <div className="mt-2 text-sm text-gray-600">Average: {product.averageRating || 0} • {product.reviewCount || 0} reviews. You can remove inappropriate reviews here; customers add reviews from the product page.</div>
            <div className="mt-3 space-y-3">
              {(product.reviews || []).map((r, i) => (
                <div key={i} className="border p-3 rounded">
                  <div className="flex justify-between items-start gap-3">
                    <div>
                      <div className="font-medium">{r.title || '—'} <span className="text-yellow-600">{'★'.repeat(Math.round(r.rating || 0))}</span></div>
                      <div className="text-xs text-gray-500">{r.user ? `${r.user}` : 'Anonymous'} — {new Date(r.createdAt).toLocaleDateString()}</div>
                      <div className="mt-2">{r.body}</div>
                    </div>
                    <div>
                      <button onClick={() => setProduct(p=>({...p, reviews: p.reviews.filter((_,idx)=>idx!==i)}))} className="px-2 py-1 border rounded text-sm text-red-600">Delete review</button>
                    </div>
                  </div>
                </div>
              ))}
              {(!product.reviews || product.reviews.length === 0) && <div className="text-sm text-gray-500">No reviews yet</div>}
            </div>
          </div>

          <div className="flex gap-3">
            <select value={product.status} onChange={e => setProduct(p=>({...p, status: e.target.value}))} className="border px-3 py-2 rounded">
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
            <input placeholder="Keywords customers search for (comma separated)" value={(product.tags||[]).join(', ')} onChange={e => setProduct(p=>({...p, tags: e.target.value.split(',').map(s=>s.trim()).filter(Boolean)}))} className="border px-3 py-2 rounded flex-1" />
          </div>

          <div>
            <label className="block text-sm font-medium">SEO Title</label>
            <input value={product.seo?.title || ''} onChange={e => setProduct(p=>({...p, seo: {...p.seo, title: e.target.value}}))} className="w-full border px-3 py-2 rounded" />
            <label className="block text-sm font-medium mt-2">SEO Description</label>
            <input value={product.seo?.description || ''} onChange={e => setProduct(p=>({...p, seo: {...p.seo, description: e.target.value}}))} className="w-full border px-3 py-2 rounded" />
          </div>
        </div>
      )}
    </div>
  );
}
