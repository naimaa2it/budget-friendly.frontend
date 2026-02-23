"use client";

import React, { useState, useEffect } from 'react';

export default function CategoryFilters({ stats = {}, subcategories = [], onApply }) {
  const [minPrice, setMinPrice] = useState(stats.minPrice != null ? String(stats.minPrice) : '');
  const [maxPrice, setMaxPrice] = useState(stats.maxPrice != null ? String(stats.maxPrice) : '');
  const [selectedSubs, setSelectedSubs] = useState(new Set());

  useEffect(() => {
    if (stats.minPrice != null) setMinPrice(String(stats.minPrice));
    if (stats.maxPrice != null) setMaxPrice(String(stats.maxPrice));
  }, [stats.minPrice, stats.maxPrice]);

  const toggleSub = (id) => {
    const sid = String(id);
    setSelectedSubs(prev => {
      const s = new Set(prev);
      if (s.has(sid)) s.delete(sid); else s.add(sid);
      return s;
    });
  };

  return (
    <aside className="w-full lg:w-72 bg-white border border-[#fff8f8] rounded-md p-4 shadow-sm sticky top-16">
      <h4 className="text-lg font-semibold mb-3">Filters</h4>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Price: </label>
        <div className="flex gap-2 items-center">
          <input
            type="number"
            className="w-1/2 border px-2 py-1 rounded"
            value={minPrice}
            onChange={e => setMinPrice(e.target.value)}
          />-
          <input
            type="number"
            className="w-1/2 border px-2 py-1 rounded"
            value={maxPrice}
            onChange={e => setMaxPrice(e.target.value)}
          />
        </div>
        <div className="text-xs text-gray-500 mt-2">Showing range: ৳{minPrice} — ৳{maxPrice}</div>
      </div>

      {subcategories.length > 0 && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Subcategories</label>
          <div className="flex flex-col gap-2 max-h-40 overflow-auto pr-2">
            {subcategories.map(sub => (
              <label key={sub._id} className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={selectedSubs.has(sub._id)} onChange={() => toggleSub(sub._id)} />
                <span>{sub.name}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-2 mt-4">
        <button
          className="flex-1 px-3 py-2 bg-red-600 text-white rounded-md font-medium hover:bg-red-700 transition"
          onClick={() => onApply({ minPrice: Number(minPrice) || 0, maxPrice: Number(maxPrice) || 0, subIds: Array.from(selectedSubs) })}
        >
          Apply
        </button>
        <button
          className="px-3 py-2 border rounded-md hover:bg-gray-50"
          onClick={() => { setSelectedSubs(new Set()); setMinPrice(stats.minPrice != null ? String(stats.minPrice) : ''); setMaxPrice(stats.maxPrice != null ? String(stats.maxPrice) : ''); onApply({ reset: true }); }}
        >
          Reset
        </button>
      </div>
    </aside>
  );
}
