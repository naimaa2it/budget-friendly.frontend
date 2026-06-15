"use client";

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { getDisplayPrice } from '@/lib/pricing';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default function SearchBox({ className = '', inputClassName = '', onClose, autoFocus = false }) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);
  const debounceRef = useRef(null);

  // close when clicking outside
  useEffect(() => {
    function handleOutsideClick(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
        setActiveIndex(-1);
      }
    }
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const fetchSuggestions = useCallback(async (term) => {
    if (!term.trim()) {
      setSuggestions([]);
      setTotalCount(0);
      setOpen(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/products?q=${encodeURIComponent(term.trim())}&limit=8`);
      const json = await res.json();
      const items = json.items || [];
      setSuggestions(items);
      setTotalCount(json.total || items.length);
      setOpen(true);
    } catch (err) {
      console.error('search suggestions error', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    setActiveIndex(-1);
    clearTimeout(debounceRef.current);
    if (!val.trim()) {
      setSuggestions([]);
      setTotalCount(0);
      setOpen(false);
      return;
    }
    debounceRef.current = setTimeout(() => fetchSuggestions(val), 280);
  };

  const logSearch = (term) => {
    fetch(`${API}/api/analytics/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ term }),
    }).catch(() => {});
  };

  const navigate = (term) => {
    if (!term.trim()) return;
    setOpen(false);
    setQuery(term);
    onClose?.();
    logSearch(term.trim());
    router.push(`/search?q=${encodeURIComponent(term.trim())}`);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    navigate(query);
  };

  const handleKeyDown = (e) => {
    if (!open || suggestions.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(prev => Math.min(prev + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(prev => Math.max(prev - 1, -1));
    } else if (e.key === 'Enter') {
      if (activeIndex >= 0 && suggestions[activeIndex]) {
        e.preventDefault();
        navigate(suggestions[activeIndex].title);
      }
      // else natural form submit handles it
    } else if (e.key === 'Escape') {
      setOpen(false);
      setActiveIndex(-1);
    }
  };

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      <form onSubmit={handleSubmit} role="search" aria-label="Search form">
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 text-red-500 pointer-events-none"
            width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onFocus={() => query.trim() && suggestions.length && setOpen(true)}
            placeholder="Find your favorite product..."
            autoComplete="off"
            className={`pl-9 pr-4 py-1.5 rounded-full border border-black/10 w-full outline-none placeholder:text-[13px] placeholder:text-gray-500 focus:border-red-400 transition-colors ${inputClassName}`}
            aria-label="Search"
            aria-expanded={open}
            aria-autocomplete="list"
            autoFocus={autoFocus}
          />
          {loading && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2">
              <svg className="animate-spin w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
              </svg>
            </span>
          )}
        </div>
      </form>

      {/* Dropdown */}
      {open && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-gray-200 rounded-xl shadow-2xl z-[999] overflow-hidden">
          {suggestions.length === 0 && !loading ? (
            <div className="px-4 py-3 text-sm text-gray-500">No results for &ldquo;{query}&rdquo;</div>
          ) : (
            <>
              <ul className="max-h-72 overflow-y-auto divide-y divide-gray-50">
                {suggestions.map((product, idx) => {
                  const image = product.images?.[0]?.url || '/assets/placeholder.svg';
                  const { price, compareAtPrice: compareAt } = getDisplayPrice(product);
                  const isActive = idx === activeIndex;
                  return (
                    <li key={product._id}>
                      <button
                        type="button"
                        onMouseDown={() => navigate(product.title)}
                        onMouseEnter={() => setActiveIndex(idx)}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${isActive ? 'bg-red-50' : 'hover:bg-gray-50'}`}
                      >
                        {/* thumbnail */}
                        <div className="w-10 h-10 flex-shrink-0 rounded-md border border-gray-100 overflow-hidden bg-gray-50">
                          <Image
                            src={encodeURI(image)}
                            alt={product.title}
                            width={40}
                            height={40}
                            className="w-full h-full object-contain"
                            onError={(e) => { e.currentTarget.src = '/assets/placeholder.svg'; }}
                          />
                        </div>
                        {/* title + price */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-800 font-medium truncate">{product.title}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            {price != null && (
                              <span className="text-xs font-bold text-red-600">৳{Number(price).toLocaleString()}</span>
                            )}
                            {compareAt != null && compareAt > price && (
                              <span className="text-xs text-gray-400 line-through">৳{Number(compareAt).toLocaleString()}</span>
                            )}
                          </div>
                        </div>
                        {/* search icon arrow */}
                        <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5" />
                        </svg>
                      </button>
                    </li>
                  );
                })}
              </ul>

              {/* View all */}
              <button
                type="button"
                onMouseDown={() => navigate(query)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 transition-colors border-t border-gray-100"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                  <circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                View all products ({totalCount.toLocaleString()})
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
