"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { PiFishThin , PiTireThin,PiLeafThin} from 'react-icons/pi';
import { GiRopeCoil,GiPeanut,GiWoodPile } from 'react-icons/gi';
import { FaArrowRight, FaTrash } from 'react-icons/fa';
import { useUser } from '@/components/context/UserContext';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// Icon and image mapping for categories
const categoryAssets = {
  'Vehicle Parts & Accessories': {
    image: '/assets/placeholder.svg',
    icon: <PiTireThin />
  },
  'Frozen Fish': {
    image: '/assets/placeholder.svg',
    icon: <PiFishThin />
  },
  'Metals & Metal Products': {
    image: '/assets/placeholder.svg',
    icon: <GiRopeCoil />
  },
  'Dry Food': {
    image: '/assets/placeholder.svg',
    icon: <GiPeanut />
  },
  'Agriculture': {
    image: '/assets/placeholder.svg',
    icon: <PiLeafThin />
  },
  'Wood Products': {
    image: '/assets/placeholder.svg',
    icon: <GiWoodPile />
  }
};

export default function ShopByCategory() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useUser();

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch(`${API}/api/products/categories`);
        const json = await res.json();
        if (!mounted) return;
        // API returns tree: { categories: [...] } — take top-level nodes and prefer uploaded image when available
        setCategories((json.categories || []).map(c => ({ _id: c._id, name: c.name, slug: c.slug, image: (c.images && c.images[0] && c.images[0].url) ? c.images[0].url : undefined })));
      } catch (err) {
        console.error('Failed to fetch categories', err);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const rendered = (categories || []).map((category) => {
    const assets = categoryAssets[category.name] || {};
    const slug = (category.slug || (category.name || '').replace(/\s+/g, '-'));
    const image = category.image || assets.image || '/assets/placeholder.svg';
    return {
      name: category.name,
      image,
      icon: assets.icon || null,
      link: `/category/${slug}`,
      _id: category._id
    };
  });

  return (
    <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
      <div className='max-w-5xl mx-auto flex justify-between items-center mt-5 mb-6'>
        <h1 className='text-3xl font-bold text-gray-900 text-center mt-5 mb-2'>
          Shop By <span className='border-b-2 border-red-500'>Category</span>
        </h1>
        <Link 
          href="/products" 
          className='px-6 py-2 bg-gray-100 text-red-600 rounded-md hover:bg-red-700 hover:text-white transition font-medium flex items-center gap-2'
        >
          View All
          <FaArrowRight className='w-4 h-4' />
        </Link>
      </div>

      <div className='flex flex-wrap justify-center gap-6 mb-10 mt-6'>
        {loading ? (
          <div className="text-gray-500 py-8">Loading categories...</div>
        ) : rendered.length === 0 ? (
          <div className="text-gray-500 py-8">No categories available</div>
        ) : (
          rendered.map((cat) => (
            <div key={cat._id} className='relative flex flex-col items-center group w-40'>
              {user?.role === 'admin' && (
                <button
                  onClick={async (e) => {
                    e.stopPropagation(); e.preventDefault();
                    if (!confirm('Delete this category?')) return;
                    try {
                      const r = await fetch(`${API}/api/admin/categories/${cat._id}`, { method: 'DELETE', credentials: 'include' });
                      const body = await r.json();
                      if (!r.ok) return alert(body.error || 'Delete failed');
                      setCategories(prev => prev.filter(c => c._id !== cat._id));
                    } catch (err) {
                      console.error(err);
                      alert('Delete failed');
                    }
                  }}
                  className='absolute -top-2 -right-2 z-20 bg-white rounded-full p-1 shadow border border-gray-200 hover:bg-red-600 hover:text-white transition'
                  aria-label='Delete category'
                >
                  <FaTrash className='w-4 h-4' />
                </button>
              )}

              <Link href={cat.link} className='cursor-pointer flex flex-col items-center'>
                <div className='relative w-40 h-40 rounded-full border-4 border-white shadow-lg bg-red-100/30 group-hover:scale-105 transition-transform overflow-visible'>
                  <div className='w-full h-full rounded-full overflow-hidden'>
                    <img
                      src={encodeURI(cat.image)}
                      alt={cat.name}
                      loading="lazy"
                      decoding="async"
                      onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/assets/placeholder.svg'; }}
                      className='w-full h-full object-contain group-hover:blur-sm transition-all duration-300'
                    />
                  </div>

                  <div className='absolute inset-0 bg-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center'>
                    <span className='text-white font-bold text-center px-2 text-base'>{cat.name}</span>
                  </div>

                  {cat.icon && (
                    <div className='absolute top-2 -left-1 bg-white rounded-full p-1 shadow z-20 border border-gray-100'>
                      {typeof cat.icon === 'string' ? (
                        <img src={cat.icon} alt="" className="w-8 h-8 object-contain" />
                      ) : (
                        React.cloneElement(cat.icon, { className: 'w-8 h-8 text-gray-700' })
                      )}
                    </div>
                  )}
                </div>
              </Link>
            </div>
          ))
        )}
      </div>
    </div>
  );
}