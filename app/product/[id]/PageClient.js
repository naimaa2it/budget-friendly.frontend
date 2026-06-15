'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import ProductDetails from '@/components/product/ProductDetails';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default function ProductPageClient() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id || id === '__placeholder__') {
      setLoading(false);
      return;
    }

    fetch(`${API}/api/products/${id}`)
      .then(r => r.ok ? r.json() : null)
      .then(async data => {
        const prod = data?.product || null;
        if (!prod) { setNotFound(true); setLoading(false); return; }
        setProduct(prod);

        const fetches = [];
        if (prod.categoryId) {
          fetches.push(
            fetch(`${API}/api/products?categoryId=${prod.categoryId}&limit=14`)
              .then(r => r.ok ? r.json() : { items: [] })
              .then(d => d.items || [])
              .catch(() => [])
          );
        }
        if (prod.department) {
          fetches.push(
            fetch(`${API}/api/products?brand=${encodeURIComponent(prod.department)}&limit=14`)
              .then(r => r.ok ? r.json() : { items: [] })
              .then(d => d.items || [])
              .catch(() => [])
          );
        }

        let relatedList = [];
        if (fetches.length > 0) {
          const results = await Promise.all(fetches);
          const seen = new Set([String(id)]);
          for (const arr of results) {
            for (const p of arr) {
              const pid = String(p._id);
              if (!seen.has(pid)) { seen.add(pid); relatedList.push(p); }
            }
          }
        }

        if (relatedList.length === 0) {
          relatedList = await fetch(`${API}/api/products?limit=14&sort=newest`)
            .then(r => r.ok ? r.json() : { items: [] })
            .then(d => (d.items || []).filter(p => String(p._id) !== String(id)))
            .catch(() => []);
        }

        setRelated(relatedList.slice(0, 12));
        setLoading(false);
      })
      .catch(() => { setNotFound(true); setLoading(false); });
  }, [id]);

  if (loading) {
    return (
      <div className="py-24 text-center">
        <p className="text-sm text-gray-500">Loading product…</p>
      </div>
    );
  }

  if (notFound || !product) {
    return (
      <div className="py-24 text-center">
        <p className="text-red-600 text-lg font-semibold">Product not found</p>
        <p className="text-gray-500 mt-2 text-sm">This product may have been removed or is unavailable.</p>
      </div>
    );
  }

  return <ProductDetails product={product} relatedProducts={related} />;
}
