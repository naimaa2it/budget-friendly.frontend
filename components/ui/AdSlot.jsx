"use client";

import React, { useEffect, useRef, useState } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

let _cache = null;
let _promise = null;

async function getAdConfig() {
  if (_cache) return _cache;
  if (_promise) return _promise;
  _promise = fetch(`${API}/api/admin/tracking-config`)
    .then(r => r.json())
    .then(d => {
      const ga = d.googleAdsense;
      _cache = {
        active: !!(ga?.publisherId && ga?.adSlotId),
        publisherId: ga?.publisherId || '',
        slot: ga?.adSlotId || '',
        pageSettings: ga?.pageSettings || {},
      };
      return _cache;
    })
    .catch(() => {
      _cache = { active: false, publisherId: '', slot: '', pageSettings: {} };
      return _cache;
    });
  return _promise;
}

/**
 * AdSlot — renders a Google AdSense responsive display unit.
 *
 * Props:
 *   page      – 'homepage' | 'productPage' | 'categoryPage' | 'blogPage'
 *   format    – AdSense data-ad-format (default: 'auto')
 *   className – wrapper classes
 */
export default function AdSlot({ page = 'homepage', format = 'auto', className = '' }) {
  const [cfg, setCfg] = useState(null);
  const insRef = useRef(null);
  const pushed = useRef(false);

  useEffect(() => {
    getAdConfig().then(setCfg);
  }, []);

  useEffect(() => {
    if (!cfg?.active || pushed.current || !insRef.current) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      pushed.current = true;
    } catch (_) {}
  }, [cfg]);

  const IS_DEV = process.env.NODE_ENV === 'development';

  if (!cfg) return null;

  const pageAllowed = cfg.pageSettings[page] !== false;
  const enabled = cfg.active && pageAllowed;

  if (!enabled) {
    if (!IS_DEV) return null;
    return (
      <div className={className}>
        <div className="w-full min-h-16 flex flex-col items-center justify-center rounded border-2 border-dashed border-amber-300 bg-amber-50 py-3 select-none">
          <span className="text-[10px] font-bold uppercase tracking-widest text-amber-500">
            📢 Ad Slot — {page}
          </span>
          <span className="text-[9px] text-amber-400 mt-0.5">
            Configure in Dashboard → Addons → Google AdSense to show real ads
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <p className="text-[9px] text-gray-300 text-center uppercase tracking-widest mb-0.5 select-none">
        Advertisement
      </p>
      <ins
        ref={insRef}
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={cfg.publisherId}
        data-ad-slot={cfg.slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  );
}
