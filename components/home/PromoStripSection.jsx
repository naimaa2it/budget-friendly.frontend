"use client";

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

export default function PromoStripSection() {
  const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
  const [items, setItems] = useState([]);
  const stripRef = useRef(null);

  useEffect(() => {
    fetch(`${API}/api/promo-strip`)
      .then(r => r.json())
      .then(b => setItems(b.items || []))
      .catch(() => setItems([]));
  }, [API]);

  if (!items.length) return null;

  const scrollByAmount = (dir) => {
    if (!stripRef.current) return;
    stripRef.current.scrollBy({ left: dir * 260, behavior: 'smooth' });
  };

  return (
    <section className="max-w-7xl mx-auto px-5 md:px-4 py-2 md:py-3">
      <div className="relative bg-gradient-to-r from-rose-50 via-white to-orange-50 border border-orange-200/60 rounded-2xl overflow-visible shadow-[0_4px_24px_rgba(251,146,60,0.13)]">
        {/* top glow layer */}
        
        {/* subtle inner glow beneath the bar */}
        <div className="absolute inset-x-4 top-1.5 h-[6px] bg-gradient-to-r from-rose-400/30 via-orange-300/20 to-amber-300/30 blur-sm rounded-full" />
        {/* Left / Right controls */}
        {items.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => scrollByAmount(-1)}
              className="flex absolute -left-4 top-1/2 -translate-y-1/2 z-20 w-7 h-7 rounded-full bg-white border border-rose-100 text-rose-500 items-center justify-center hover:text-rose-600 hover:border-rose-200 transition shadow"
              aria-label="Scroll promo left"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => scrollByAmount(1)}
              className="flex absolute -right-4 top-1/2 -translate-y-1/2 z-20 w-7 h-7 rounded-full bg-white border border-rose-100 text-rose-500 items-center justify-center hover:text-rose-600 hover:border-rose-200 transition shadow"
              aria-label="Scroll promo right"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}

        <div ref={stripRef} className="flex items-stretch overflow-x-auto promo-strip-scroll md:px-1">
          {items.map((item, idx) => (
            <Link
              key={item._id || idx}
              href={item.link || '#'}
              className="group shrink-0 min-w-[33.333%] md:min-w-[16.666%] flex items-center gap-1.5 px-1.5 py-0.5"
            >
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-lg overflow-hidden bg-white border border-rose-100 shadow-[0_1px_4px_rgba(244,63,94,0.12)] shrink-0">
                {item.image?.url ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={item.image.url}
                    alt={item.title || 'Offer'}
                    className="w-full h-full object-cover"
                    onError={(e) => { e.currentTarget.src = '/assets/placeholder.svg'; }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300 text-xl">🏷️</div>
                )}
              </div>

              <div className="min-w-0 flex-1 bg-white/70 backdrop-blur-sm border border-transparent group-hover:border-rose-100 rounded-lg px-0.5 py-1 transition-all duration-200 group-hover:shadow-[0_2px_8px_rgba(244,63,94,0.15)] group-hover:bg-white">
                <p className="text-[13px] font-extrabold leading-none tracking-tight uppercase bg-linear-to-r from-rose-600 to-orange-500 bg-clip-text text-transparent">
                  {item.title}
                </p>
                {item.subtitle && (
                  <p className="mt-0.5 text-[13px] leading-tight font-semibold text-slate-700 line-clamp-2">
                    {item.subtitle}
                  </p>
                )}
              </div>

              {idx < items.length - 1 && (
                <div className="hidden md:block h-12 w-px bg-gradient-to-b from-transparent via-orange-200 to-transparent shrink-0" />
              )}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
