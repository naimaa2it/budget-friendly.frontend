"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { getDisplayPrice } from '@/lib/pricing';

// Stable empty defaults — avoids new object references on every render
const EMPTY_SUBCATEGORIES = [];
const EMPTY_DESCENDANT_MAP = new Map();

// Collapsible section component - defined outside to prevent re-creation on every render
const Section = ({ id, title, children, isOpen, onToggle }) => (
  <div className="border-b border-gray-100 pb-4">
    <button
      type="button"
      onClick={() => onToggle(id)}
      className="w-full flex items-center justify-between py-2 text-sm font-semibold text-gray-800 hover:text-red-600 transition-colors"
    >
      {title}
      <svg className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
      </svg>
    </button>
    {isOpen && <div className="mt-2">{children}</div>}
  </div>
);

/**
 * Universal filter sidebar.
 *
 * Props:
 *  products             – full unfiltered product list (price range + brand/rating derived from this)
 *  subcategories        – flat array of { _id, name, depth }
 *  descendantMap        – Map<string, Set<string>>: category id → all descendant ids
 *  onChange             – called on every change with filter state
 *  showSkincareFilters  – show Skin Type, Formulation, Free From sections
 */

export default function ProductFilters({
  products = [],
  subcategories = EMPTY_SUBCATEGORIES,
  descendantMap = EMPTY_DESCENDANT_MAP,
  onChange,
  sticky = true,
  showSkincareFilters = false,
}) {
  // ── derive brand options from products ───────────────────────────────
  const brandOptions = useMemo(() => {
    const brandMap = new Map();
    products.forEach(p => {
      if (!p.department) return;
      brandMap.set(p.department, (brandMap.get(p.department) || 0) + 1);
    });
    return Array.from(brandMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [products]);

  // ── derive skincare options from products ─────────────────────────────
  const skinTypeOptions = useMemo(() => {
    if (!showSkincareFilters) return [];
    const s = new Set();
    products.forEach(p => (p.skinTypes || []).forEach(st => st.type && s.add(st.type)));
    return [...s].sort();
  }, [products, showSkincareFilters]);

  const formulationOptions = useMemo(() => {
    if (!showSkincareFilters) return [];
    const s = new Set();
    products.forEach(p => p.formulation && s.add(p.formulation));
    return [...s].sort();
  }, [products, showSkincareFilters]);

  // Use refs to track initialization - refs don't cause re-renders
  const initializedRef = useRef(false);
  const initialBoundsRef = useRef({ min: 0, max: 10000 });

  // ── filter state ────────────────────────────────────────────────────
  const [absMin, setAbsMin] = useState(0);
  const [absMax, setAbsMax] = useState(10000);
  const [priceRange, setPriceRange] = useState([0, 10000]);
  const [subIds, setSubIds] = useState(new Set());
  const [brands, setBrands] = useState(new Set());
  const [minRating, setMinRating] = useState(null);
  const [hoverRating, setHoverRating] = useState(0);
  const [selectedSkinTypes, setSelectedSkinTypes] = useState(new Set());
  const [selectedFormulations, setSelectedFormulations] = useState(new Set());
  const [freeFrom, setFreeFrom] = useState(new Set()); // 'fragrance', 'paraben', 'sulfate'
  const [skincareFlags, setSkincareFlags] = useState({ crueltyFree: false, vegan: false });
  
  // Local input state for typing
  const [minInputValue, setMinInputValue] = useState('0');
  const [maxInputValue, setMaxInputValue] = useState('10000');

  // Initialize bounds ONLY ONCE when products first arrive
  useEffect(() => {
    if (initializedRef.current || products.length === 0) return;
    
    const prices = products.map(p => getDisplayPrice(p).price).filter(v => v > 0);
    if (prices.length === 0) return;
    
    const min = Math.floor(Math.min(...prices));
    const max = Math.ceil(Math.max(...prices));
    
    if (min >= max) return;
    
    // Mark as initialized FIRST to prevent any race conditions
    initializedRef.current = true;
    initialBoundsRef.current = { min, max };
    
    setAbsMin(min);
    setAbsMax(max);
    setPriceRange([min, max]);
    setMinInputValue(String(min));
    setMaxInputValue(String(max));
  }, [products]);

  // Handler for min slider change
  const handleMinSliderChange = useCallback((e) => {
    const newVal = Number(e.target.value);
    setPriceRange(prev => {
      const newMin = Math.min(newVal, prev[1]);
      setMinInputValue(String(newMin));
      return [newMin, prev[1]];
    });
  }, []);

  // Handler for max slider change
  const handleMaxSliderChange = useCallback((e) => {
    const newVal = Number(e.target.value);
    setPriceRange(prev => {
      const newMax = Math.max(newVal, prev[0]);
      setMaxInputValue(String(newMax));
      return [prev[0], newMax];
    });
  }, []);

  // Handler for min input blur (commit the value)
  const handleMinInputBlur = useCallback(() => {
    const num = parseInt(minInputValue, 10);
    if (isNaN(num) || num < absMin) {
      setPriceRange(prev => [absMin, prev[1]]);
      setMinInputValue(String(absMin));
    } else if (num > priceRange[1]) {
      setPriceRange(prev => [prev[1], prev[1]]);
      setMinInputValue(String(priceRange[1]));
    } else {
      setPriceRange(prev => [num, prev[1]]);
      setMinInputValue(String(num));
    }
  }, [minInputValue, absMin, priceRange]);

  // Handler for max input blur (commit the value)
  const handleMaxInputBlur = useCallback(() => {
    const num = parseInt(maxInputValue, 10);
    if (isNaN(num) || num > absMax) {
      setPriceRange(prev => [prev[0], absMax]);
      setMaxInputValue(String(absMax));
    } else if (num < priceRange[0]) {
      setPriceRange(prev => [prev[0], prev[0]]);
      setMaxInputValue(String(priceRange[0]));
    } else {
      setPriceRange(prev => [prev[0], num]);
      setMaxInputValue(String(num));
    }
  }, [maxInputValue, absMax, priceRange]);

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
    onChange?.({ priceRange, expandedSubIds, brands, minRating, selectedSkinTypes, selectedFormulations, freeFrom, skincareFlags });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [priceRange, expandedSubIds, brands, minRating, selectedSkinTypes, selectedFormulations, freeFrom, skincareFlags]);

  // ── helpers ─────────────────────────────────────────────────────────
  const toggleSet = useCallback((setter, key) => setter(prev => {
    const s = new Set(prev);
    s.has(key) ? s.delete(key) : s.add(key);
    return s;
  }), []);

  const hasActiveFilters = initializedRef.current && (
    priceRange[0] !== absMin || priceRange[1] !== absMax ||
    subIds.size > 0 || brands.size > 0 || minRating !== null ||
    selectedSkinTypes.size > 0 || selectedFormulations.size > 0 ||
    freeFrom.size > 0 || skincareFlags.crueltyFree || skincareFlags.vegan
  );

  const reset = useCallback(() => {
    const { min, max } = initialBoundsRef.current;
    setPriceRange([min, max]);
    setMinInputValue(String(min));
    setMaxInputValue(String(max));
    setSubIds(new Set());
    setBrands(new Set());
    setMinRating(null);
    setSelectedSkinTypes(new Set());
    setSelectedFormulations(new Set());
    setFreeFrom(new Set());
    setSkincareFlags({ crueltyFree: false, vegan: false });
  }, []);

  const span = Math.max(absMax - absMin, 1);

  // ── collapsible sections ────────────────────────────────────────────
  const [openSections, setOpenSections] = useState({ price: true, sub: true, brand: true, rating: true, skinType: false, formulation: false, freeFrom: false });
  const toggleSection = useCallback((key) => setOpenSections(s => ({ ...s, [key]: !s[key] })), []);

  return (
    <aside className={`w-full bg-white border border-gray-100 rounded-xl shadow-sm p-4 space-y-1 ${sticky ? 'sticky top-20' : ''}`}>
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
      <Section id="price" title="Price" isOpen={openSections.price} onToggle={toggleSection}>
        <div className="relative h-5 flex items-center my-3">
          <div className="absolute left-0 right-0 h-1.5 bg-gray-200 rounded-full" />
          <div className="absolute h-1.5 bg-red-500 rounded-full"
            style={{
              left:  `${((priceRange[0] - absMin) / span) * 100}%`,
              right: `${100 - ((priceRange[1] - absMin) / span) * 100}%`,
            }}
          />
          <input 
            type="range" 
            min={absMin} 
            max={absMax} 
            step={1} 
            value={priceRange[0]}
            onChange={handleMinSliderChange}
            className="absolute w-full appearance-none bg-transparent cursor-pointer range-thumb"
            style={{ zIndex: priceRange[0] >= absMax - 1 ? 5 : 3 }}
          />
          <input 
            type="range" 
            min={absMin} 
            max={absMax} 
            step={1} 
            value={priceRange[1]}
            onChange={handleMaxSliderChange}
            className="absolute w-full appearance-none bg-transparent cursor-pointer range-thumb"
            style={{ zIndex: 4 }}
          />
        </div>
        <div className="flex items-center gap-2">
          <input 
            type="text" 
            inputMode="numeric"
            value={minInputValue}
            onChange={e => {
              const val = e.target.value;
              if (val === '' || /^\d*$/.test(val)) {
                setMinInputValue(val);
              }
            }}
            onBlur={handleMinInputBlur}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                e.target.blur();
              }
            }}
            className="w-full border border-gray-200 rounded-lg px-2 py-1 text-sm text-center focus:outline-none focus:border-red-400"
          />
          <span className="text-gray-400 text-sm">—</span>
          <input 
            type="text" 
            inputMode="numeric"
            value={maxInputValue}
            onChange={e => {
              const val = e.target.value;
              if (val === '' || /^\d*$/.test(val)) {
                setMaxInputValue(val);
              }
            }}
            onBlur={handleMaxInputBlur}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                e.target.blur();
              }
            }}
            className="w-full border border-gray-200 rounded-lg px-2 py-1 text-sm text-center focus:outline-none focus:border-red-400"
          />
        </div>
      </Section>

      {/* ── Subcategories (nested with depth indentation) ────────────── */}
      {subcategories.length > 0 && (
        <Section id="sub" title="Subcategories" isOpen={openSections.sub} onToggle={toggleSection}>
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
        <Section id="brand" title="Brands" isOpen={openSections.brand} onToggle={toggleSection}>
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

      {/* ── Rating (interactive star picker) ────────────────────────── */}
      <Section id="rating" title="Rating" isOpen={openSections.rating} onToggle={toggleSection}>
        <div className="mt-2">
          <div
            className="flex items-center gap-1"
            onMouseLeave={() => setHoverRating(0)}
          >
            {[1, 2, 3, 4, 5].map(star => {
              const filled = star <= (hoverRating || minRating || 0);
              return (
                <button
                  key={star}
                  type="button"
                  onMouseEnter={() => setHoverRating(star)}
                  onClick={() => setMinRating(minRating === star ? null : star)}
                  className="p-0.5 focus:outline-none"
                  aria-label={`${star} stars`}
                >
                  <svg
                    className={`w-7 h-7 transition-colors ${filled ? 'text-yellow-400' : 'text-gray-200'}`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </button>
              );
            })}
          </div>
          {minRating ? (
            <p className="text-xs text-gray-500 mt-1">
              {minRating} star{minRating > 1 ? 's' : ''} &amp; up
              <button
                type="button"
                onClick={() => setMinRating(null)}
                className="ml-2 text-red-500 hover:text-red-700 font-medium"
              >
                ✕ clear
              </button>
            </p>
          ) : hoverRating ? (
            <p className="text-xs text-gray-400 mt-1">{hoverRating} star{hoverRating > 1 ? 's' : ''} &amp; up</p>
          ) : (
            <p className="text-xs text-gray-400 mt-1">Select minimum rating</p>
          )}
        </div>
      </Section>

      {/* ── Skincare: Skin Type ──────────────────────────────────────── */}
      {showSkincareFilters && skinTypeOptions.length > 0 && (
        <Section id="skinType" title="Skin Type" isOpen={openSections.skinType} onToggle={toggleSection}>
          <div className="space-y-1.5 mt-1">
            {skinTypeOptions.map(type => (
              <label key={type} className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={selectedSkinTypes.has(type)}
                  onChange={() => toggleSet(setSelectedSkinTypes, type)}
                  className="accent-red-500 w-4 h-4 rounded shrink-0"
                />
                <span className={`text-sm capitalize transition-colors ${selectedSkinTypes.has(type) ? 'text-red-600 font-medium' : 'text-gray-700 group-hover:text-red-600'}`}>
                  {type}
                </span>
              </label>
            ))}
          </div>
        </Section>
      )}

      {/* ── Skincare: Formulation ────────────────────────────────────── */}
      {showSkincareFilters && formulationOptions.length > 0 && (
        <Section id="formulation" title="Formulation" isOpen={openSections.formulation} onToggle={toggleSection}>
          <div className="space-y-1.5 mt-1">
            {formulationOptions.map(f => (
              <label key={f} className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={selectedFormulations.has(f)}
                  onChange={() => toggleSet(setSelectedFormulations, f)}
                  className="accent-red-500 w-4 h-4 rounded shrink-0"
                />
                <span className={`text-sm capitalize transition-colors ${selectedFormulations.has(f) ? 'text-red-600 font-medium' : 'text-gray-700 group-hover:text-red-600'}`}>
                  {f}
                </span>
              </label>
            ))}
          </div>
        </Section>
      )}

      {/* ── Skincare: Free From + Cruelty-free / Vegan ──────────────── */}
      {showSkincareFilters && (
        <Section id="freeFrom" title="Free From & Values" isOpen={openSections.freeFrom} onToggle={toggleSection}>
          <div className="space-y-2 mt-1">
            {[
              { key: 'fragrance', label: 'Fragrance-free' },
              { key: 'paraben', label: 'Paraben-free' },
              { key: 'sulfate', label: 'Sulfate-free' },
            ].map(({ key, label }) => (
              <label key={key} className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={freeFrom.has(key)}
                  onChange={() => toggleSet(setFreeFrom, key)}
                  className="accent-red-500 w-4 h-4 rounded shrink-0"
                />
                <span className={`text-sm transition-colors ${freeFrom.has(key) ? 'text-red-600 font-medium' : 'text-gray-700 group-hover:text-red-600'}`}>
                  {label}
                </span>
              </label>
            ))}
            <label className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={skincareFlags.crueltyFree}
                onChange={() => setSkincareFlags(f => ({ ...f, crueltyFree: !f.crueltyFree }))}
                className="accent-red-500 w-4 h-4 rounded shrink-0"
              />
              <span className={`text-sm transition-colors ${skincareFlags.crueltyFree ? 'text-red-600 font-medium' : 'text-gray-700 group-hover:text-red-600'}`}>
                Cruelty-free
              </span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={skincareFlags.vegan}
                onChange={() => setSkincareFlags(f => ({ ...f, vegan: !f.vegan }))}
                className="accent-red-500 w-4 h-4 rounded shrink-0"
              />
              <span className={`text-sm transition-colors ${skincareFlags.vegan ? 'text-red-600 font-medium' : 'text-gray-700 group-hover:text-red-600'}`}>
                Vegan
              </span>
            </label>
          </div>
        </Section>
      )}

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
