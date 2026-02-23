import React from 'react';
import ProductDetails from '@/components/Home/ProductDetails';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default async function ProductPage({ params }) {
  const { id } = await params;
  let product = null;
  let related = [];
  let error = null;

  // Validate ID exists
  if (!id || id === 'undefined') {
    return (
      <div className="py-24 text-center">
        <p className="text-red-600 text-lg">Error loading product</p>
        <p className="text-gray-500 mt-2">Invalid product ID</p>
      </div>
    );
  }

  try {
    console.log('Fetching product:', id);
    const resp = await fetch(`${API}/api/products/${id}`, {
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!resp.ok) {
      error = `Failed to fetch product: ${resp.status} ${resp.statusText}`;
      console.error(error);
    } else {
      const json = await resp.json();
      console.log('Product data:', json);
      product = json.product;
      
      if (product && product.department) {
        // fetch related by department
        const relResp = await fetch(`${API}/api/products?department=${encodeURIComponent(product.department)}&limit=8`, {
          cache: 'no-store'
        });
        if (relResp.ok) {
          const relJson = await relResp.json();
          related = (relJson.items || []).filter(p => String(p._id) !== String(id));
        }
      }
    }
  } catch (err) {
    error = err.message;
    console.error('Failed to load product page:', err);
  }

  if (error) {
    return (
      <div className="py-24 text-center">
        <p className="text-red-600 text-lg">Error loading product</p>
        <p className="text-gray-500 mt-2">{error}</p>
      </div>
    );
  }

  return <ProductDetails product={product} relatedProducts={related} />;
}
