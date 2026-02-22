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
  { key: 'blog', label: 'Blog / Content', href: '/dashabord/blog', icon: 'M4 7h16M4 11h16M8 15h8' },
  { key: 'media', label: 'Media', href: '/dashabord/media', icon: 'M4 5h16v14H4z M8 9l2 2 3-3 5 5' },
  { key: 'discounts', label: 'Discounts', href: '/dashabord/discounts', icon: 'M12 2l4 4-8 8-4-4 8-8z' },
  { key: 'pages', label: 'Pages', href: '/dashabord/pages', icon: 'M4 4h16v16H4z' },
  { key: 'authorized', label: 'Authorized Persons', href: '/dashabord/authorized', icon: 'M12 8a4 4 0 100 8 4 4 0 000-8z' },
  { key: 'settings', label: 'Settings', href: '/dashabord/settings', icon: 'M12 8a4 4 0 100 8 4 4 0 000-8z' }
];

export default function Sidebar() {
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
    <aside className="w-64 bg-white border-r h-screen sticky top-0">
      <div className="p-4 border-b">
        <Link href="/" className="text-lg font-semibold text-pink-600">YourHaat Dashboard</Link>
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
  );
}
