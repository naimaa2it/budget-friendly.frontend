"use client";

import React, { useEffect, useRef, useState } from 'react';
import Link from "next/link";
import WebsiteLogo from '@/components/Shared/WebsiteLogo'
import CategorySidebar from "../Home/CategorySidebar";
import AuthModal from "../authentication/AuthModal";

// Simple profile menu that uses UserContext so UI updates immediately on auth changes
import { useUser } from '@/components/context/UserContext';
import { useCart } from '@/components/context/CartContext';
import { useRouter } from 'next/navigation';

function ProfileMenu() {
  const { user, setUser, refreshUser } = useUser();
  const [open, setOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [imgError, setImgError] = useState(false);
  const ref = useRef(null);
  const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  async function handleLogout() {
    try {
      await fetch(`${API}/api/auth/logout`, { method: 'POST', credentials: 'include' });
    } catch (err) {
      // ignore
    }
    sessionStorage.removeItem('ya_access');
    setUser(null);
    setOpen(false);
  }

  const handleProfileClick = () => {
    if (!user) {
      setShowAuthModal(true);
      setOpen(false);
    } else {
      setOpen((s) => !s);
    }
  };

  return (
    <>
      <div ref={ref} className="relative">
        <button onClick={handleProfileClick} className="w-8 h-8 p-1 rounded-full border border-[#f2b7ff] text-[#202020] hover:text-[#ac0ad1] flex items-center justify-center overflow-hidden bg-white" aria-label="Profile" title="Profile">
          {user && user.image && !imgError && user.image !== 'undefined' && user.image !== 'null' ? (
            <img
              src={user.image}
              alt={user.name || 'User'}
              className="w-6 h-6 rounded-full object-cover"
              onError={() => setImgError(true)}
            />
          ) : user && user.email ? (
            <span className="text-sm font-semibold text-gray-700">
              {user.email.charAt(0).toUpperCase()}
            </span>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-3-3.87"/><path d="M4 21v-2a4 4 0 0 1 3-3.87"/><circle cx="12" cy="7" r="4"/></svg>
          )}
        </button>

        {open && user && (
          <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden">
            <div className="text-sm text-[#202020]">
              <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                <div className="font-semibold">{user.name || user.email}</div>
                <div className="text-xs text-gray-600">{user.email}</div>
              </div>

              <div className="py-2">
                {/* PROFILE Section */}
                <div className="mb-2">
                  <div className="px-4 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">Profile</div>
                  <Link href={{ pathname: '/user', query: { section: 'profile' } }} className="flex items-center gap-3 px-4 py-2 hover:bg-[#fff0f7] transition-colors">
                    <svg className="w-4 h-4 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                      <circle cx="12" cy="7" r="4"/>
                    </svg>
                    <span>General info</span>
                  </Link>
                  <Link href={{ pathname: '/user', query: { section: 'wishlist' } }} className="flex items-center gap-3 px-4 py-2 hover:bg-[#fff0f7] transition-colors">
                    <svg className="w-4 h-4 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20.8 4.6a5 5 0 0 0-7.1 0L12 6.3l-1.7-1.7a5 5 0 0 0-7.1 7.1L12 21l8.8-9.3a5 5 0 0 0 0-7.1z"/>
                    </svg>
                    <span>Favourites</span>
                  </Link>
                </div>

                {/* ORDERS Section */}
                <div className="mb-2">
                  <div className="px-4 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">Orders</div>
                  <Link href={{ pathname: '/user', query: { section: 'orders' } }} className="flex items-center gap-3 px-4 py-2 hover:bg-[#fff0f7] transition-colors">
                    <svg className="w-4 h-4 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 2H4a2 2 0 0 0-2 2v5m0 9v3a2 2 0 0 0 2 2h5M15 2h5a2 2 0 0 1 2 2v5m0 9v3a2 2 0 0 1-2 2h-5"/>
                    </svg>
                    <span>Orders</span>
                  </Link>
                  <Link href={{ pathname: '/user', query: { section: 'address' } }} className="flex items-center gap-3 px-4 py-2 hover:bg-[#fff0f7] transition-colors">
                    <svg className="w-4 h-4 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                      <circle cx="12" cy="10" r="3"/>
                    </svg>
                    <span>My Address</span>
                  </Link>
                </div>

                {/* OTHER Section */}
                <div className="mb-2">
                  <div className="px-4 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">Other</div>
                  <Link href={{ pathname: '/user', query: { section: 'reviews' } }} className="flex items-center gap-3 px-4 py-2 hover:bg-[#fff0f7] transition-colors">
                    <svg className="w-4 h-4 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
                    </svg>
                    <span>My reviews</span>
                  </Link>
                  <Link href={{ pathname: '/user', query: { section: 'rewards' } }} className="flex items-center gap-3 px-4 py-2 hover:bg-[#fff0f7] transition-colors">
                    <svg className="w-4 h-4 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                    <span>My Rewards</span>
                  </Link>
                  <Link href={{ pathname: '/user', query: { section: 'coupons' } }} className="flex items-center gap-3 px-4 py-2 hover:bg-[#fff0f7] transition-colors">
                    <svg className="w-4 h-4 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 8.5a2.5 2.5 0 0 1 0 5M3 8.5a2.5 2.5 0 0 0 0 5"/>
                      <path d="M3 3h18v18H3z"/>
                      <line x1="9" y1="9" x2="15" y2="15"/>
                      <line x1="15" y1="9" x2="9" y2="15"/>
                    </svg>
                    <span>My Coupons</span>
                  </Link>
                  <Link href="/cart" className="flex items-center gap-3 px-4 py-2 hover:bg-[#fff0f7] transition-colors">
                    <svg className="w-4 h-4 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="9" cy="20" r="1"/>
                      <circle cx="20" cy="20" r="1"/>
                      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                    </svg>
                    <span>Cart</span>
                  </Link>
                </div>
              </div>

              {/* Logout Button */}
              <div className="border-t border-gray-200 p-2">
                <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded transition-colors">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                    <polyline points="16 17 21 12 16 7"/>
                    <line x1="21" y1="12" x2="9" y2="12"/>
                  </svg>
                  <span>Sign out</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </>
  );
}

export default function Navbar() {
  const { getCartCount, getWishlistCount, toggleSidebar } = useCart();
  const { user } = useUser();
  const router = useRouter();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [redirectWishlistOnLogin, setRedirectWishlistOnLogin] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false); // mobile-only 
  const [catSidebarOpen, setCatSidebarOpen] = useState(false);
  const mobileSearchRef = useRef(null);
  const searchIconRef = useRef(null);

  React.useEffect(() => {
    if (user && redirectWishlistOnLogin) {
      router.push('/user/wishlist');
      setRedirectWishlistOnLogin(false);
    }
  }, [user, redirectWishlistOnLogin, router]);

  // close mobile search when clicking outside or on empty space
  React.useEffect(() => {
    if (!mobileSearchOpen) return;
    function handleDocumentClick(e) {
      if (
        mobileSearchRef.current &&
        !mobileSearchRef.current.contains(e.target) &&
        searchIconRef.current &&
        !searchIconRef.current.contains(e.target)
      ) {
        setMobileSearchOpen(false);
      }
    }
    document.addEventListener('click', handleDocumentClick);
    return () => document.removeEventListener('click', handleDocumentClick);
  }, [mobileSearchOpen]);


  return (
    <header className="relative bg-[#fffaf6] z-50">
      <div className="flex items-center gap-5 justify-between max-w-[1200px] mx-auto py-1.5 md:py-2 px-1 bg-transparent">
          <div className="flex items-center gap-2">
            {/* hamburger menu */}
            <button
              onClick={() => setCatSidebarOpen((v) => !v)}
              onMouseEnter={() => setCatSidebarOpen(true)}
              className="p-2 text-[#202020] hover:text-[#ac0ad1]"
              aria-label="Categories"
              title="Categories"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="stroke-current">
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
            <WebsiteLogo />
          </div>

        {/* navigation links removed - keeping search centered */}
        <div className="flex-1 flex justify-center">
          <form className="hidden md:flex w-full max-w-[400px] flex items-center" role="search" onSubmit={(e) => e.preventDefault()} aria-label="Search form">
            <div className="relative w-full">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[#ff0707] pointer-events-none" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input className="pl-9 px-3 py-1 rounded-full border border-black/10 w-full outline-none placeholder:text-[14px] placeholder:text-gray-500" type="search" placeholder="Find your favorite product..." aria-label="Search" />
            </div>
          </form>
        </div>

        <div className="flex items-center gap-0 md:gap-1">
          {/* mobile search icon, only visible below md */}
          <button
            ref={searchIconRef}
            onClick={() => setMobileSearchOpen(true)}
            className="p-2 text-[#202020] hover:text-[#ac0ad1] md:hidden "
            aria-label="Search"
            title="Search"
          >
            <svg className="stroke-current" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          </button>
          <button
            onClick={() => {
              if (!user) {
                setRedirectWishlistOnLogin(true);
                setShowAuthModal(true);
              } else {
                router.push('/user/wishlist');
              }
            }}
            className="relative p-2 text-[#202020] hover:text-[#ac0ad1] group"
            aria-label="Wishlist"
            title="Wishlist"
          >
            <svg className="stroke-current transition-colors duration-200 group-hover:stroke-[#ac0ad1]" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20.8 4.6a5 5 0 0 0-7.1 0L12 6.3l-1.7-1.7a5 5 0 0 0-7.1 7.1L12 21l8.8-9.3a5 5 0 0 0 0-7.1z"/></svg>
            {getWishlistCount() > 0 && (
              <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
                {getWishlistCount()}
              </span>
            )}
          </button>

          <button
            onClick={toggleSidebar}
            className="relative p-2 text-[#202020] hover:text-[#ac0ad1] group"
            aria-label="Cart"
            title="Cart"
          >
            <svg className="stroke-current transition-colors duration-200 group-hover:stroke-[#ac0ad1]" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="20" r="1"/><circle cx="20" cy="20" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
            {getCartCount() > 0 && (
              <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
                {getCartCount()}
              </span>
            )}
          </button>

          {/* Profile dropdown */}
          <div className="relative">
            <ProfileMenu />
          </div>
        </div>
      </div>

      {/* category sidebar overlay */}
      {catSidebarOpen && (
        <div className="fixed top-14 left-0 right-0 bottom-0 z-40 flex items-start">
          {/* Backdrop — clicking closes */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setCatSidebarOpen(false)}
          />
          {/* Panel — 70vw on mobile, 256px on desktop, content height */}
          <div
            className="relative w-[80vw] md:w-68 bg-white shadow-2xl z-10"
            onMouseLeave={() => setCatSidebarOpen(false)}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-2 border-b border-gray-100">
             
              <button
                onClick={() => setCatSidebarOpen(false)}
                className="md:hidden p-1 text-gray-400 hover:text-gray-600"
                aria-label="Close"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <CategorySidebar onLinkClick={() => setCatSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* mobile search overlay */}
      {mobileSearchOpen && (
        <div ref={mobileSearchRef} className="absolute top-full left-0 w-full bg-white p-2 z-50 shadow-md">
          <form
            className="flex items-center"
            role="search"
            onSubmit={(e) => {
              e.preventDefault();
              setMobileSearchOpen(false);
            }}
          >
            <div className="relative w-full">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[#fc0707] pointer-events-none" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input
                className="pl-9 px-3 py-1 rounded-full border border-black/10 w-full outline-none placeholder:text-[12px] placeholder:text-gray-500"
                type="search"
                placeholder="Find your favorite product..."
                aria-label="Search"
                autoFocus
              />
            </div>
            <button
              type="button"
              className="ml-2 p-2 text-[#202020] hover:text-[#ac0ad1]"
              onClick={() => setMobileSearchOpen(false)}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </form>
        </div>
      )}

      {showAuthModal && <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />}
    </header>
  );
}
