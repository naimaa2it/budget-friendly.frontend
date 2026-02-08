"use client";

import React from 'react';
import Link from 'next/link';
import { PiFishThin , PiTireThin,PiLeafThin} from 'react-icons/pi';
import { GiRopeCoil,GiPeanut,GiWoodPile } from 'react-icons/gi';
import { FaArrowRight } from 'react-icons/fa';

// Icon and image mapping for categories
const categoryAssets = {
  'Vehicle Parts & Accessories': {
    image: '/assets/truck/Double Coin/Drive/RR202 10.00R20p-1.webp',
    icon: <PiTireThin />
  },
  'Frozen Fish': {
    image: '/assets/fish/shrimp/shrimp.webp',
    icon: <PiFishThin />
  },
  'Metals & Metal Products': {
    image: '/assets/Metals/Copper/copper1.webp',
    icon: <GiRopeCoil />
  },
  'Dry Food': {
    image: '/assets/dryFruit/nuts/cashew_roasted.webp',
    icon: <GiPeanut />
  },
  'Agriculture': {
    image: '/assets/agriculture/onion/onion2.webp',
    icon: <PiLeafThin />
  },
  'Wood Products': {
    image: '/assets/wood/premium.webp',
    icon: <GiWoodPile />
  }
};

export default function ShopByCategory() {
  // Static categories - replace with your data source
  const rawCategories = [
    { name: 'Vehicle Parts & Accessories' },
    { name: 'Frozen Fish' },
    { name: 'Metals & Metal Products' },
    { name: 'Dry Food' },
    { name: 'Agriculture' },
    { name: 'Wood Products' }
  ];

  // Transform data and match with assets
  const categories = rawCategories.map(category => {
    const assets = categoryAssets[category.name] || {};
    const slug = category.name.replace(/\s+/g, '-');
    return {
      name: category.name,
      image: assets.image || '/assets/placeholder.webp',
      icon: assets.icon || null,
      link: `/products/c/${slug}`
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
        {categories.length === 0 ? (
          <div className="text-gray-500 py-8">No categories available</div>
        ) : (
          categories.map((cat, idx) => (
            <Link key={idx} href={cat.link} className='flex flex-col items-center group cursor-pointer'>
              <div className='relative w-40 h-40 rounded-full border-4 border-white shadow-lg bg-red-100/30 group-hover:scale-105 transition-transform overflow-visible'>
                <div className='w-full h-full rounded-full overflow-hidden'>
                  <img
                    src={cat.image}
                    alt={cat.name}
                    className='w-full h-full object-contain group-hover:blur-sm transition-all duration-300'
                  />
                </div>
                {/* Red overlay on hover */}
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
          ))
        )}
      </div>
    </div>
  );
}