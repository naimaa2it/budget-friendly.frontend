"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useUser } from '@/components/context/UserContext';

const nav = [
  { key: 'overview', label: 'Overview', href: '/dashabord', icon: 'M3 12h18M3 6h18M3 18h18' },
  { key: 'products', label: 'Products', href: '/dashabord/products', icon: 'M3 7h18v13a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7z' },
  { key: 'categories', label: 'Categories', href: '/dashabord/categories', icon: 'M3 6h18M3 12h18M3 18h18' },
  { key: 'orders', label: 'Orders', href: '/dashabord/orders', icon: 'M3 3h18v4H3V3z M3 11h18v10H3V11z' },
  { key: 'customers', label: 'Customers', href: '/dashabord/customers', icon: 'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4z M4 20c0-2.21 3.58-4 8-4s8 1.79 8 4' },
  { key: 'reviews', label: 'Reviews', href: '/dashabord/reviews', icon: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z' },
  { key: 'questions', label: 'Questions', href: '/dashabord/questions', icon: 'M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
  { key: 'occasions', label: 'Occasions', href: '/dashabord/occasions', icon: 'M12 2l2 7h7l-5.5 4 2 7L12 16l-5.5 4 2-7L3 9h7z' },
  { key: 'featured', label: 'Featured Sections', href: '/dashabord/featured', icon: 'M3 3h7v7H3V3z M13 3h8v4h-8V3z M13 10h8v4h-8v-4z M13 17h8v4h-8v-4z M3 13h7v8H3v-8z' },
  { key: 'banners', label: 'Banners', href: '/dashabord/banners', icon: 'M4 5h16v10H4z M8 18h8' },
  { key: 'blog', label: 'Blog / Content', href: '/dashabord/blog', icon: 'M4 7h16M4 11h16M8 15h8' },
  { key: 'media', label: 'Media', href: '/dashabord/media', icon: 'M4 5h16v14H4z M8 9l2 2 3-3 5 5' },
  { key: 'discounts', label: 'Discounts', href: '/dashabord/discounts', icon: 'M12 2l4 4-8 8-4-4 8-8z' },
  { key: 'pages', label: 'Pages', href: '/dashabord/pages', icon: 'M4 4h16v16H4z' },
  { key: 'authorized', label: 'Authorized Persons', href: '/dashabord/authorized', icon: 'M12 8a4 4 0 100 8 4 4 0 000-8z' },
  { key: 'settings', label: 'Settings', href: '/dashabord/settings', icon: 'M12 8a4 4 0 100 8 4 4 0 000-8z' }
];

export default function Sidebar({ mobileOpen, onClose }) {
  const pathname = usePathname() || '/dashabord';
  const router = useRouter();
  const { user, refreshUser } = useUser();

  const handleSignOut = async () => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/auth/logout`, { method: 'POST', credentials: 'include' });
    } catch (err) {
      // ignore
    }
    await refreshUser();
    router.push('/');
  };

  return (
    <>
      {/* overlay for mobile when sidebar is open */}
      <div
        className={`fixed inset-0  bg-opacity-50 z-40 transition-opacity md:hidden ${mobileOpen ? 'block' : 'hidden'}`}
        onClick={onClose}
      />
      <aside
        className={`fixed inset-y-0 left-0 w-64 bg-white border-r h-full z-50 transform transition-transform md:static md:translate-x-0 md:h-screen ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-4 border-b flex items-center justify-between">
          <Link href="/dashabord" className="text-lg font-semibold text-pink-600">Budget Friendly Dashboard</Link>
          {/* close button visible only on mobile */}
          <button className="md:hidden p-2" onClick={onClose} aria-label="Close menu">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

      <nav className="p-3 space-y-1">
        {nav.map(item => {
          // only show the 'Authorized' admin-management link to admins
          if (item.key === 'authorized' && user?.role !== 'admin') return null;

          const active = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link key={item.key} href={item.href} className={`flex items-center gap-3 px-3 py-2 rounded text-sm ${active ? 'bg-pink-50 text-pink-700 font-medium' : 'text-gray-700 hover:bg-gray-50'}`}>
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={item.icon} /></svg>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto p-4 border-t">
        <button onClick={handleSignOut} className="w-full text-left px-3 py-2 rounded border text-sm text-red-600 hover:bg-red-50">Sign out</button>
      </div>
    </aside>
    </>
  );
}
