"use client";

import React, { useEffect, useRef, useState } from 'react';
import Link from "next/link";
import WebsiteLogo from "../shared/WebsiteLogo";
import AuthModal from "../authentication/AuthModal";

// Simple profile menu that uses UserContext so UI updates immediately on auth changes
import { useUser } from '@/components/context/UserContext';
import { useCart } from '@/components/context/CartContext';
import { useRouter } from 'next/navigation';

function ProfileMenu() {
  const { user, setUser, refreshUser } = useUser();
  const [open, setOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
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
        <button onClick={handleProfileClick} className="p-1 rounded-full border border-[#f2b7ff] text-[#202020] hover:text-[#ac0ad1]" aria-label="Profile" title="Profile">
          {user && user.image ? (
            <img src={user.image} alt={user.name || 'User'} className="w-6 h-6 rounded-full object-cover" />
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-3-3.87"/><path d="M4 21v-2a4 4 0 0 1 3-3.87"/><circle cx="12" cy="7" r="4"/></svg>
          )}
        </button>

        {open && user && (
          <div className="absolute right-0 mt-2 w-56 bg-white border border-black/6 rounded-md shadow-lg z-50 py-2">
            <div className="text-sm text-[#202020]">
              <div className="px-3 py-2 border-b border-black/6">
                <div className="font-medium">{user.name || user.email}</div>
                <div className="text-xs text-[#666]">{user.email}</div>
              </div>

              <ul className="py-2">
                <li><Link href={{ pathname: '/user', query: { section: 'profile' } }} className="block px-3 py-2 hover:bg-[#fff0f7]">My profile</Link></li>
                <li><Link href={{ pathname: '/user', query: { section: 'orders' } }} className="block px-3 py-2 hover:bg-[#fff0f7]">Orders</Link></li>
                <li><Link href="/cart" className="block px-3 py-2 hover:bg-[#fff0f7]">Cart</Link></li>
                <li><Link href={{ pathname: '/user', query: { section: 'wishlist' } }} className="block px-3 py-2 hover:bg-[#fff0f7]">Wishlist</Link></li>
                <li><Link href={{ pathname: '/user', query: { section: 'reviews' } }} className="block px-3 py-2 hover:bg-[#fff0f7]">Reviews</Link></li>
                <li><Link href={{ pathname: '/user', query: { section: 'points' } }} className="block px-3 py-2 hover:bg-[#fff0f7]">YourHaat points</Link></li>
                <li><Link href={{ pathname: '/user', query: { section: 'interest' } }} className="block px-3 py-2 hover:bg-[#fff0f7]">Interest</Link></li>
                <li><button onClick={handleLogout} className="w-full text-left px-3 py-2 hover:bg-[#fff0f7]">Sign out</button></li>
              </ul>
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

  React.useEffect(() => {
    if (user && redirectWishlistOnLogin) {
      router.push('/user?section=wishlist');
      setRedirectWishlistOnLogin(false);
    }
  }, [user, redirectWishlistOnLogin, router]);

  return (
    <header className="border-b border-black/6  bg-[#fffaf6] sticky top-0 z-50">
      <div className="flex items-center gap-5 justify-between max-w-[1200px] mx-auto py-2 px-1 bg-transparent">
          <WebsiteLogo />

        <nav className="hidden md:flex gap-4 items-center" aria-label="Main navigation ">
          {/* Home */}
          <Link href="/" className="text-[#202020] hover:text-[#ac0ad1] no-underline font-medium relative group inline-flex">
            Home
            <span aria-hidden="true" className="absolute left-0 -bottom-1 h-[1.5px] bg-[#ecb8f9] w-0 group-hover:w-full transition-all duration-300"></span>
          </Link>

          {/* SkinCare */}
          <Link href="/skincare" className="text-[#202020] hover:text-[#ac0ad1] no-underline font-medium relative group inline-flex">
            SkinCare
            <span aria-hidden="true" className="absolute left-0 -bottom-1 h-[1.5px] bg-[#ecb8f9] w-0 group-hover:w-full transition-all duration-300"></span>
          </Link>

          {/* Cosmetics */}
          <Link href="/cosmetics" className="text-[#202020] hover:text-[#ac0ad1] no-underline font-medium relative group inline-flex">
            Cosmetics
            <span aria-hidden="true" className="absolute left-0 -bottom-1 h-[1.5px] bg-[#ecb8f9] w-0 group-hover:w-full transition-all duration-300"></span>
          </Link>

          {/* Contact */}
          <Link href="/contact" className="text-[#202020] hover:text-[#ac0ad1] no-underline font-medium relative group inline-flex">
            Contact
            <span aria-hidden="true" className="absolute left-0 -bottom-1 h-[1.5px] bg-[#ecb8f9] w-0 group-hover:w-full transition-all duration-300"></span>
          </Link>
        </nav>

        <div className="flex items-center gap-1">
          <form className="hidden sm:flex items-center" role="search" onSubmit={(e) => e.preventDefault()} aria-label="Search form">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[#202020] pointer-events-none" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input className="pl-9 px-3 py-1 rounded-full border border-black/10 min-w-[180px] outline-none" type="search" placeholder="Search products..." aria-label="Search" />
            </div>
          </form>

          <button
            onClick={() => {
              if (!user) {
                setRedirectWishlistOnLogin(true);
                setShowAuthModal(true);
              } else {
                router.push('/user?section=wishlist');
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
      {showAuthModal && <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />}
    </header>
  );
}
