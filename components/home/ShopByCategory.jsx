"use client";

import React, { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import { PiFishThin , PiTireThin,PiLeafThin} from 'react-icons/pi';
import { GiRopeCoil,GiPeanut,GiWoodPile } from 'react-icons/gi';
import { FaArrowRight, FaTrash } from 'react-icons/fa';
import { useUser } from '@/components/context/UserContext';
import { useCategories } from '@/components/context/CategoryContext';
import Image from 'next/image';

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
  const { categories: rawCategories, loading } = useCategories();
  const { user } = useUser();
  const scrollContainerRef = useRef(null);
  const [page, setPage] = useState(0);

  // determine page size based on window width: mobile 4, tablet 5, large 6
  const [pageSize, setPageSize] = useState(4);
  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      if (w >= 1024) setPageSize(6);      // large devices
      else if (w >= 768) setPageSize(5);  // tablets
      else setPageSize(4);               // mobiles
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const totalPages = Math.ceil(rawCategories.length / pageSize);

  const scrollLeft = () => {
    setPage((prev) => Math.max(prev - 1, 0));
  };

  const scrollRight = () => {
    setPage((prev) => Math.min(prev + 1, totalPages - 1));
  };

  // Convert context categories to display format
  const categories = rawCategories.map(c => ({
    _id: c._id,
    name: c.name,
    slug: c.slug,
    image: (c.images && c.images[0] && c.images[0].url) ? c.images[0].url : undefined
  }));

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
    <div className='max-w-7xl mx-auto px-2 mt-10 mb-6'>
      <div className='max-w-6xl mx-auto flex justify-between items-center mt-2 mb-4 px-6 '>
        <h1 className='text-xl md:text-3xl font-bold text-gray-900 text-center mt-4'>
          Shop By <span className='border-b-2 border-red-500'>Category</span>
        </h1>
        <div className='flex gap-2 mt-4'>
          <button
            onClick={scrollLeft}
            className="bg-white rounded-full p-2 shadow-lg hover:bg-rose-50 border border-rose-400"
            aria-label="Scroll left"
            disabled={page === 0}
          >
            <svg className="md:w-4 md:h-4 w-3 h-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={scrollRight}
            className="bg-white rounded-full p-2 shadow-lg hover:bg-rose-50 border border-rose-400"
            aria-label="Scroll right"
            disabled={page === totalPages - 1}
          >
            <svg className="md:w-4 md:h-4 w-3 h-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      <div className='relative max-w-6xl mx-auto'>
        {/* unified paginated layout */}
        {loading ? (
          <div className="text-gray-500 py-8 w-full text-center">Loading categories...</div>
        ) : rendered.length === 0 ? (
          <div className="text-gray-500 py-8 w-full text-center">No categories available</div>
        ) : (
          <div className='grid  mb-4 grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-6'>
            {rendered
              .slice(page * pageSize, (page + 1) * pageSize)
              .map((cat) => (
                <div
                  key={cat._id}
                  className='flex flex-col items-center group'
                >
                  <Link href={cat.link} className='cursor-pointer flex flex-col items-center '>
                    <div
                      className='relative rounded-full border-2 border-white shadow-lg bg-gradient-to-r from-[#fff3dc] to-rose-100 group-hover:scale-105 transition-transform overflow-visible w-24 h-24 md:w-38 md:h-38 lg:w-42 lg:h-42'
                    >
                      <div className='absolute inset-0 rounded-full overflow-hidden w-full h-full'>
                        <Image
                          src={encodeURI(cat.image)}
                          alt={cat.name}
                          fill
                          style={{ objectFit: 'contain' }}
                          loading="lazy"
                          decoding="async"
                          onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/assets/placeholder.svg'; }}
                          className='group-hover:blur-sm transition-all duration-300'
                        />
                      </div>
                      <div className='absolute inset-0 bg-gradient-to-r from-[#fff3dc] to-rose-100 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center shadow-lg '>
                        <span className='text-[#fd6b66] font-bold text-center px-1 text-[16px] leading-tight'>{cat.name}</span>
                      </div>
                      {cat.icon && (
                        <div className='absolute top-1 left-1 bg-white rounded-full p-1 shadow z-20 border border-gray-100'>
                          {typeof cat.icon === 'string' ? (
                            <img src={cat.icon} alt="" className="w-6 h-6 object-contain" />
                          ) : (
                            React.cloneElement(cat.icon, { className: 'w-6 h-6 text-gray-700' })
                          )}
                        </div>
                      )}
                    </div>
                  </Link>
                </div>
              ))}
          </div>
        )}
      </div>

      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}