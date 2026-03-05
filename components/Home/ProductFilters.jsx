"use client";

import React, { useState, useEffect, useMemo } from 'react';

/**
 * Universal filter sidebar.
 *
 * Props:
 *  products        – full unfiltered product list (price range + brand/rating derived from this)
 *  subcategories   – flat array of { _id, name, depth } — depth 0 = direct child, 1 = grandchild, etc.
 *  descendantMap   – Map<string, Set<string>>: maps each category id to ALL its descendant ids + itself
 *  onChange        – called immediately on every change with:
 *                    { priceRange:[min,max], expandedSubIds:Set, brands:Set, minRating:number|null }
 */
export default function ProductFilters({ products = [], subcategories = [], descendantMap = new Map(), onChange }) {
  // ── derive min/max + brand options from products ───────────────────
  const { absMin, absMax, brandOptions } = useMemo(() => {
    const prices = products.map(p => p.price ?? p.variants?.[0]?.price ?? 0).filter(v => v > 0);
    const absMin = prices.length ? Math.floor(Math.min(...prices)) : 0;
    const absMax = prices.length ? Math.ceil(Math.max(...prices)) : 10000;

    const brandMap = new Map();
    products.forEach(p => {
      if (!p.department) return;
      brandMap.set(p.department, (brandMap.get(p.department) || 0) + 1);
    });
    const brandOptions = Array.from(brandMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    return { absMin, absMax, brandOptions };
  }, [products]);

  // ── filter state ────────────────────────────────────────────────────
  const [priceRange, setPriceRange] = useState([absMin, absMax]);
  const [subIds, setSubIds]         = useState(new Set()); // selected raw IDs
  const [brands, setBrands]         = useState(new Set());
  const [minRating, setMinRating]   = useState(null); // null = no filter, 1-5 = minimum

  useEffect(() => { setPriceRange([absMin, absMax]); }, [absMin, absMax]);

  // ── expand selected subIds to include all descendants ──────────────
  const expandedSubIds = useMemo(() => {
    if (subIds.size === 0) return new Set();
    const expanded = new Set();
    subIds.forEach(id => {
      expanded.add(id);
      const desc = descendantMap.get(id);
      if (desc) desc.forEach(d => expanded.add(d));
    });
    return expanded;
  }, [subIds, descendantMap]);

  // ── notify parent ───────────────────────────────────────────────────
  useEffect(() => {
    onChange?.({ priceRange, expandedSubIds, brands, minRating });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [priceRange, expandedSubIds, brands, minRating]);

  // ── helpers ─────────────────────────────────────────────────────────
  const toggleSet = (setter, key) => setter(prev => {
    const s = new Set(prev);
    s.has(key) ? s.delete(key) : s.add(key);
    return s;
  });

  const hasActiveFilters =
    priceRange[0] !== absMin || priceRange[1] !== absMax ||
    subIds.size > 0 || brands.size > 0 || minRating !== null;

  const reset = () => {
    setPriceRange([absMin, absMax]);
    setSubIds(new Set());
    setBrands(new Set());
    setMinRating(null);
  };

  const span = Math.max(absMax - absMin, 1);

  // ── collapsible sections ────────────────────────────────────────────
  const [openSections, setOpenSections] = useState({ price: true, sub: true, brand: true, rating: true });
  const toggleSection = key => setOpenSections(s => ({ ...s, [key]: !s[key] }));
  const Section = ({ id, title, children }) => (
    <div className="border-b border-gray-100 pb-4">
      <button
        type="button"
        onClick={() => toggleSection(id)}
        className="w-full flex items-center justify-between py-2 text-sm font-semibold text-gray-800 hover:text-red-600 transition-colors"
      >
        {title}
        <svg className={`w-4 h-4 transition-transform ${openSections[id] ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {openSections[id] && <div className="mt-2">{children}</div>}
    </div>
  );

  // ── star row helper ─────────────────────────────────────────────────
  const StarRow = ({ count, active }) => (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <svg key={i}
          className={`w-4 h-4 ${i <= count ? (active ? 'text-blue-500' : 'text-blue-400') : 'text-gray-200'}`}
          fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </span>
  );

  return (
    <aside className="w-full bg-white border border-gray-100 rounded-xl shadow-sm p-4 sticky top-20 space-y-1">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-base font-bold text-gray-900">Filters</h4>
        {hasActiveFilters && (
          <button type="button" onClick={reset}
            className="text-xs text-red-500 hover:text-red-700 font-medium transition-colors">
            Reset all
          </button>
        )}
      </div>

      {/* ── Price ───────────────────────────────────────────────────── */}
      <Section id="price" title="Price">
        <div className="relative h-5 flex items-center my-3">
          <div className="absolute left-0 right-0 h-1.5 bg-gray-200 rounded-full" />
          <div className="absolute h-1.5 bg-red-500 rounded-full"
            style={{
              left:  `${((priceRange[0] - absMin) / span) * 100}%`,
              right: `${100 - ((priceRange[1] - absMin) / span) * 100}%`,
            }}
          />
          <input type="range" min={absMin} max={absMax} step={1} value={priceRange[0]}
            onChange={e => setPriceRange(r => [Math.min(Number(e.target.value), r[1]), r[1]])}
            className="absolute w-full appearance-none bg-transparent cursor-pointer range-thumb"
            style={{ zIndex: priceRange[0] >= absMax - 1 ? 5 : 3 }}
          />
          <input type="range" min={absMin} max={absMax} step={1} value={priceRange[1]}
            onChange={e => setPriceRange(r => [r[0], Math.max(Number(e.target.value), r[0])])}
            className="absolute w-full appearance-none bg-transparent cursor-pointer range-thumb"
            style={{ zIndex: 4 }}
          />
        </div>
        <div className="flex items-center gap-2">
          <input type="number" min={absMin} max={priceRange[1]} value={priceRange[0]}
            onChange={e => setPriceRange(r => [Math.min(Number(e.target.value), r[1]), r[1]])}
            className="w-full border border-gray-200 rounded-lg px-2 py-1 text-sm text-center focus:outline-none focus:border-red-400"
          />
          <span className="text-gray-400 text-sm">—</span>
          <input type="number" min={priceRange[0]} max={absMax} value={priceRange[1]}
            onChange={e => setPriceRange(r => [r[0], Math.max(Number(e.target.value), r[0])])}
            className="w-full border border-gray-200 rounded-lg px-2 py-1 text-sm text-center focus:outline-none focus:border-red-400"
          />
        </div>
      </Section>

      {/* ── Subcategories (nested with depth indentation) ────────────── */}
      {subcategories.length > 0 && (
        <Section id="sub" title="Subcategories">
          <div className="space-y-1 max-h-52 overflow-y-auto pr-1">
            {subcategories.map(sub => {
              const id = String(sub._id);
              const indent = (sub.depth || 0) * 14;
              const checked = subIds.has(id);
              return (
                <label key={id}
                  style={{ paddingLeft: indent }}
                  className="flex items-center gap-2 cursor-pointer group py-0.5">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleSet(setSubIds, id)}
                    className="accent-red-500 w-3.5 h-3.5 rounded shrink-0"
                  />
                  <span className={`text-sm transition-colors truncate ${checked ? 'text-red-600 font-medium' : 'text-gray-700 group-hover:text-red-600'}`}>
                    {sub.depth > 0 && <span className="text-gray-300 mr-1">{'└'}</span>}
                    {sub.name}
                  </span>
                </label>
              );
            })}
          </div>
        </Section>
      )}

      {/* ── Brands ──────────────────────────────────────────────────── */}
      {brandOptions.length > 0 && (
        <Section id="brand" title="Brands">
          <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
            {brandOptions.map(b => (
              <label key={b.name} className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={brands.has(b.name)}
                  onChange={() => toggleSet(setBrands, b.name)}
                  className="accent-red-500 w-4 h-4 rounded shrink-0"
                />
                <span className={`text-sm flex-1 uppercase truncate transition-colors ${brands.has(b.name) ? 'text-red-600 font-medium' : 'text-gray-700 group-hover:text-red-600'}`}>
                  {b.name}
                </span>
                <span className="text-xs text-gray-400 shrink-0">({b.count})</span>
              </label>
            ))}
          </div>
        </Section>
      )}

      {/* ── Rating (radio — single minimum rating) ──────────────────── */}
      <Section id="rating" title="Rating">
        <div className="space-y-2 mt-1">
          {[5, 4, 3, 2, 1].map(stars => {
            const active = minRating === stars;
            return (
              <button
                key={stars}
                type="button"
                onClick={() => setMinRating(active ? null : stars)}
                className="w-full flex items-center gap-2.5 group"
              >
                {/* radio circle */}
                <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors
                  ${active ? 'border-red-500 bg-red-500' : 'border-gray-300 group-hover:border-red-400'}`}>
                  {active && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                </span>
                <StarRow count={stars} active={active} />
                {stars < 5 && (
                  <span className="text-xs text-gray-400 ml-0.5">& up</span>
                )}
              </button>
            );
          })}
        </div>
      </Section>

      {/* range thumb styles */}
      <style jsx>{`
        .range-thumb::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 16px; height: 16px;
          background: #fff;
          border: 2px solid #ef4444;
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 1px 4px rgba(0,0,0,.2);
        }
        .range-thumb::-moz-range-thumb {
          width: 16px; height: 16px;
          background: #fff;
          border: 2px solid #ef4444;
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 1px 4px rgba(0,0,0,.2);
        }
      `}</style>
    </aside>
  );
}
