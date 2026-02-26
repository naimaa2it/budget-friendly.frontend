"use client";

import React, { useRef } from 'react';
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

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      const containerWidth = scrollContainerRef.current.clientWidth;
      scrollContainerRef.current.scrollBy({ left: -(containerWidth / 4 + 8), behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      const containerWidth = scrollContainerRef.current.clientWidth;
      scrollContainerRef.current.scrollBy({ left: (containerWidth / 4 + 8), behavior: 'smooth' });
    }
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
    <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
      <div className='max-w-5xl mx-auto flex justify-between items-center mt-2'>
        <h1 className='text-2xl md:text-3xl font-bold text-gray-900 text-center mt-5 mb-4 md:mb-2'>
          Shop By <span className='border-b-2 border-red-500'>Category</span>
        </h1>
        
      </div>

      <div className='relative'>
        {/* Left Arrow - Only on Mobile */}
        <button
          onClick={scrollLeft}
          className="md:hidden absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full p-2 shadow-lg hover:bg-gray-50"
          aria-label="Scroll left"
        >
          <svg className="w-3 h-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Mobile: Scrollable Container with 4 items visible */}
        <div 
          ref={scrollContainerRef}
          className='md:hidden flex gap-2 overflow-x-auto scrollbar-hide scroll-smooth px-10 mb-4'
          style={{ scrollSnapType: 'x mandatory' }}
        >
          {loading ? (
            <div className="text-gray-500 py-8 w-full text-center">Loading categories...</div>
          ) : rendered.length === 0 ? (
            <div className="text-gray-500 py-8 w-full text-center">No categories available</div>
          ) : (
            rendered.map((cat) => (
              <div 
                key={cat._id} 
                className='relative flex flex-col items-center group shrink-0'
                style={{ 
                  width: 'calc((100vw - 88px) / 4)',
                  height: 'calc((100vw - 88px) / 4)',
                  scrollSnapAlign: 'start'
                }}
              >
                <Link href={cat.link} className='cursor-pointer flex flex-col items-center w-full h-full'>
                  <div className='relative w-full h-full rounded-full border-2 border-white shadow-lg bg-gradient-to-r from-rose-100 to-purple-100 group-hover:scale-105 transition-transform overflow-visible'>
                    <div className='w-full h-full rounded-full overflow-hidden'>
                      <Image
                        src={encodeURI(cat.image)}
                        alt={cat.name}
                        width={160}
                        height={160}
                        loading="lazy"
                        decoding="async"
                        onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/assets/placeholder.svg'; }}
                        className='w-full h-full object-contain group-hover:blur-sm transition-all duration-300'
                      />
                    </div>

                    <div className='absolute inset-0 bg-gradient-to-r from-rose-400 to-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center'>
                      <span className='text-white font-bold text-center px-1 text-[10px] leading-tight'>{cat.name}</span>
                    </div>

                    {cat.icon && (
                      <div className='absolute top-0.5 -left-0.5 bg-white rounded-full p-0.5 shadow z-20 border border-gray-100'>
                        {typeof cat.icon === 'string' ? (
                          <img src={cat.icon} alt="" className="w-4 h-4 object-contain" />
                        ) : (
                          React.cloneElement(cat.icon, { className: 'w-4 h-4 text-gray-700' })
                        )}
                      </div>
                    )}
                  </div>
                </Link>
              </div>
            ))
          )}
        </div>

        {/* Desktop: Flex Wrap Layout */}
        <div className='hidden md:flex flex-wrap justify-center gap-5 mb-4'>
          {loading ? (
            <div className="text-gray-500 py-8">Loading categories...</div>
          ) : rendered.length === 0 ? (
            <div className="text-gray-500 py-8">No categories available</div>
          ) : (
            rendered.map((cat) => (
              <div key={cat._id} className='relative flex flex-col items-center group w-40'>
                <Link href={cat.link} className='cursor-pointer flex flex-col items-center'>
                  <div className='relative w-38 h-38 rounded-full border-5 border-white shadow-lg bg-gradient-to-r from-rose-100 to-purple-100 group-hover:scale-105 transition-transform overflow-visible'>
                    <div className='w-full h-full rounded-full overflow-hidden'>
                      <Image
                        src={encodeURI(cat.image)}
                        alt={cat.name}
                        width={160}
                        height={160}
                        loading="lazy"
                        decoding="async"
                        onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/assets/placeholder.svg'; }}
                        className='w-full h-full object-contain group-hover:blur-sm transition-all duration-300'
                      />
                    </div>

                    <div className='absolute inset-0 bg-gradient-to-r from-rose-400 to-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center'>
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

        {/* Right Arrow - Only on Mobile */}
        <button
          onClick={scrollRight}
          className="md:hidden absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full p-2 shadow-lg hover:bg-gray-50"
          aria-label="Scroll right"
        >
          <svg className="w-3 h-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
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