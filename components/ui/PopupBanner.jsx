"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function PopupBanner() {
  const [popup, setPopup]       = useState(null);
  const [visible, setVisible]   = useState(false);
  const [exiting, setExiting]   = useState(false);
  const pathname = usePathname() || '';

  // Don't show popup inside the dashboard
  const isDashboard = pathname.startsWith('/dashabord');

  useEffect(() => {
    if (isDashboard) return;

    const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    fetch(`${API}/api/popup`)
      .then(r => r.json())
      .then(d => {
        if (d.popup?.image?.url) setPopup(d.popup);
      })
      .catch(() => {});
  }, [isDashboard]);

  const handleClose = () => {
    setExiting(true);
    setTimeout(() => {
      setVisible(false);
      setExiting(false);
    }, 300);
  };

  useEffect(() => {
    if (!popup) return;

    // Show after 3 seconds
    const showTimer = setTimeout(() => setVisible(true), 3000);

    // Auto-close after 3 + 6 = 9 seconds
    const closeTimer = setTimeout(() => handleClose(), 9000);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(closeTimer);
    };
  }, [popup]);

  if (!visible || !popup) return null;

  const imageBox = (
    <div
      className={`relative rounded-2xl overflow-hidden shadow-2xl transition-all duration-300 ${
        exiting ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
      }`}
    >
      {/* Image */}
      <div className="relative w-full" style={{ aspectRatio: '3/2' }}>
        <Image
          src={popup.image.url}
          alt="Promotion"
          fill
          className="object-cover"
          priority
        />
      </div>
    </div>
  );

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 transition-opacity duration-300 ${
        exiting ? 'opacity-0' : 'opacity-100'
      }`}
      onClick={handleClose}
    >
      {/* wrapper: stops overlay-click, holds close button outside the Link */}
      <div
        className="relative"
        style={{ width: '90vw', maxWidth: '680px' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Close button lives here — outside the Link — so it never navigates */}
        <button
          onClick={handleClose}
          aria-label="Close popup"
          className="absolute -top-4 -right-4 z-10 bg-white hover:bg-red-50 rounded-full w-9 h-9 flex items-center justify-center shadow-lg transition"
        >
          <svg className="w-5 h-5 text-gray-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>

        {popup.link && popup.link !== '/' ? (
          <Link href={popup.link} className="block">
            {imageBox}
          </Link>
        ) : (
          imageBox
        )}
      </div>
    </div>
  );
}
