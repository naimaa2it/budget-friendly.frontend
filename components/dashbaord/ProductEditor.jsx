"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/components/context/UserContext';

export default function ProductEditor({ productId }) {
  const router = useRouter();
  const { user, refreshUser } = useUser();
  const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  const [product, setProduct] = useState({ title: '', description: '', category: '', tags: [], images: [], variants: [], price: 0, inventory: 0, status: 'draft' });
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
      const method = (productId && productId !== 'new') ? 'PUT' : 'POST';
      const url = (method === 'POST') ? `${API}/api/admin/products` : `${API}/api/admin/products/${productId}`;
      const resp = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(product) });
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

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium">Price</label>
              <input type="number" value={product.price || 0} onChange={e => setProduct(p=>({...p, price: Number(e.target.value)}))} className="w-full border px-3 py-2 rounded" />
            </div>
            <div>
              <label className="block text-sm font-medium">Inventory (total)</label>
              <input type="number" value={product.inventory || 0} onChange={e => setProduct(p=>({...p, inventory: Number(e.target.value)}))} className="w-full border px-3 py-2 rounded" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium">Category (Main → Sub → Sub‑sub)</label>
            <div className="flex gap-2 mt-2">
              <select value={selectedMain?._id || ''} onChange={e => {
                const id = e.target.value;
                const main = categories.find(c => String(c._id) === id) || null;
                setSelectedMain(main);
                setSelectedSub(null);
                setSelectedChild(null);
                setProduct(p => ({ ...p, categoryId: main?._id || undefined, category: main?._id ? main.name : '' }));
              }} className="border px-3 py-2 rounded w-1/3">
                <option value="">Main category</option>
                {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>

              <select value={selectedSub?._id || ''} onChange={e => {
                const id = e.target.value;
                const sub = (selectedMain?.children || []).find(c => String(c._id) === id) || null;
                setSelectedSub(sub);
                setSelectedChild(null);
                setProduct(p => ({ ...p, categoryId: sub?._id || selectedMain?._id || undefined, category: sub?._id ? sub.name : (selectedMain?selectedMain.name:'') }));
              }} className="border px-3 py-2 rounded w-1/3">
                <option value="">Sub category</option>
                {(selectedMain?.children || []).map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>

              <select value={selectedChild?._id || ''} onChange={e => {
                const id = e.target.value;
                const child = (selectedSub?.children || []).find(c => String(c._id) === id) || null;
                setSelectedChild(child);
                setProduct(p => ({ ...p, categoryId: child?._id || selectedSub?._id || selectedMain?._id || undefined, category: child?._id ? child.name : (selectedSub?selectedSub.name:(selectedMain?selectedMain.name:'')) }));
              }} className="border px-3 py-2 rounded w-1/3">
                <option value="">Sub‑sub category</option>
                {(selectedSub?.children || []).map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </div>
          </div>

          {/* Category-specific info boxes */}
          {product.category === 'Electronics' && (
            <div className="p-3 border rounded bg-gray-50">
              <h4 className="font-medium mb-2">Electronics — technical details</h4>
              <div className="grid grid-cols-2 gap-3">
                <input placeholder="Brand" value={product.specs?.brand || ''} onChange={e => setProduct(p=>({...p, specs: {...(p.specs||{}), brand: e.target.value}}))} className="border px-3 py-2 rounded" />
                <input placeholder="Model" value={product.specs?.model || ''} onChange={e => setProduct(p=>({...p, specs: {...(p.specs||{}), model: e.target.value}}))} className="border px-3 py-2 rounded" />
                <input placeholder="Battery / Power info" value={product.specs?.battery || ''} onChange={e => setProduct(p=>({...p, specs: {...(p.specs||{}), battery: e.target.value}}))} className="border px-3 py-2 rounded" />
                <input placeholder="Warranty (e.g. 12 months)" value={product.specs?.warranty || ''} onChange={e => setProduct(p=>({...p, specs: {...(p.specs||{}), warranty: e.target.value}}))} className="border px-3 py-2 rounded" />
                <input placeholder="Storage (e.g. 128GB)" value={product.specs?.storage || ''} onChange={e => setProduct(p=>({...p, specs: {...(p.specs||{}), storage: e.target.value}}))} className="border px-3 py-2 rounded" />
                <input placeholder="RAM (e.g. 8GB)" value={product.specs?.ram || ''} onChange={e => setProduct(p=>({...p, specs: {...(p.specs||{}), ram: e.target.value}}))} className="border px-3 py-2 rounded" />
                <input placeholder="Dimensions (L×W×H)" value={product.specs?.dimensions || ''} onChange={e => setProduct(p=>({...p, specs: {...(p.specs||{}), dimensions: e.target.value}}))} className="border px-3 py-2 rounded" />
                <input placeholder="Weight" value={product.specs?.weight || ''} onChange={e => setProduct(p=>({...p, specs: {...(p.specs||{}), weight: e.target.value}}))} className="border px-3 py-2 rounded" />
              </div>
              <div className="mt-3">
                <label className="block text-sm font-medium">Technical specs (notes)</label>
                <textarea value={product.specs?.notes || ''} onChange={e => setProduct(p=>({...p, specs: {...(p.specs||{}), notes: e.target.value}}))} className="w-full border px-3 py-2 rounded h-20" />
              </div>
            </div>
          )}

          {(product.category === 'Ladies' || product.category === 'Gents') && (
            <div className="p-3 border rounded bg-gray-50">
              <h4 className="font-medium mb-2">Apparel — product details</h4>
              <div className="grid grid-cols-2 gap-3">
                <input placeholder="Brand" value={product.specs?.brand || ''} onChange={e => setProduct(p=>({...p, specs: {...(p.specs||{}), brand: e.target.value}}))} className="border px-3 py-2 rounded" />
                <input placeholder="Material / Fabric" value={product.specs?.material || ''} onChange={e => setProduct(p=>({...p, specs: {...(p.specs||{}), material: e.target.value}}))} className="border px-3 py-2 rounded" />
                <input placeholder="Fit (e.g. Slim, Regular)" value={product.specs?.fit || ''} onChange={e => setProduct(p=>({...p, specs: {...(p.specs||{}), fit: e.target.value}}))} className="border px-3 py-2 rounded" />
                <input placeholder="Care instructions" value={product.specs?.care || ''} onChange={e => setProduct(p=>({...p, specs: {...(p.specs||{}), care: e.target.value}}))} className="border px-3 py-2 rounded" />
                <input placeholder="Color" value={product.specs?.color || ''} onChange={e => setProduct(p=>({...p, specs: {...(p.specs||{}), color: e.target.value}}))} className="border px-3 py-2 rounded" />
                <input placeholder="Measurements (chest/waist/hips)" value={product.specs?.measurements || ''} onChange={e => setProduct(p=>({...p, specs: {...(p.specs||{}), measurements: e.target.value}}))} className="border px-3 py-2 rounded" />
              </div>
              <div className="mt-3">
                <label className="block text-sm font-medium">Available sizes (comma separated)</label>
                <input value={(product.specs?.sizes || []).join(', ')} onChange={e => setProduct(p=>({...p, specs: {...(p.specs||{}), sizes: e.target.value.split(',').map(s=>s.trim()).filter(Boolean)}}))} className="w-full border px-3 py-2 rounded" />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium">Images</label>
            <div className="flex gap-3 items-center mt-2">
              <input type="file" accept="image/*" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
              <div className="flex gap-2">
                {(product.images||[]).map((img, i) => (
                  <div key={i} className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img.url} alt="" className="w-24 h-24 object-cover rounded" />
                    <button type="button" onClick={() => setProduct(p=>({...p, images: p.images.filter((_,idx)=>idx!==i)}))} className="absolute -top-2 -right-2 bg-white rounded-full p-1 border text-red-600">×</button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium">Variants</label>
              <button onClick={onAddVariant} className="px-2 py-1 border rounded text-sm">Add variant</button>
            </div>
            <div className="mt-2 space-y-2">
              {(product.variants||[]).map((v, idx) => (
                <div key={idx} className="border p-3 rounded grid grid-cols-4 gap-2 items-center">
                  <input placeholder="Title" value={v.title} onChange={e => setProduct(p=>{ const nv = [...p.variants]; nv[idx].title = e.target.value; return {...p, variants: nv}; })} className="border px-2 py-1 rounded" />
                  <input placeholder="SKU" value={v.sku} onChange={e => setProduct(p=>{ const nv = [...p.variants]; nv[idx].sku = e.target.value; return {...p, variants: nv}; })} className="border px-2 py-1 rounded" />
                  <input type="number" placeholder="Price" value={v.price} onChange={e => setProduct(p=>{ const nv = [...p.variants]; nv[idx].price = Number(e.target.value); return {...p, variants: nv}; })} className="border px-2 py-1 rounded" />
                  <div className="flex gap-2 items-center">
                    <input type="number" placeholder="Inventory" value={v.inventory} onChange={e => setProduct(p=>{ const nv = [...p.variants]; nv[idx].inventory = Number(e.target.value); return {...p, variants: nv}; })} className="border px-2 py-1 rounded w-24" />
                    <button onClick={() => onRemoveVariant(idx)} className="px-2 py-1 border rounded text-sm text-red-600">Remove</button>
                  </div>
                </div>
              ))}
              {(!product.variants || product.variants.length === 0) && <div className="text-sm text-gray-500">No variants. Use main price/inventory above for single-variant products.</div>}
            </div>
          </div>

          <div className="flex gap-3">
            <select value={product.status} onChange={e => setProduct(p=>({...p, status: e.target.value}))} className="border px-3 py-2 rounded">
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
            <input placeholder="Tags (comma separated)" value={(product.tags||[]).join(', ')} onChange={e => setProduct(p=>({...p, tags: e.target.value.split(',').map(s=>s.trim()).filter(Boolean)}))} className="border px-3 py-2 rounded flex-1" />
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
