"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';

// simple sidebar for policy/help pages
export default function PolicySidebar() {
  const pathname = usePathname() || '';

  const items = [
    { key: 'shipping', label: 'Shipping & Delivery', href: '/shipping', icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 9h13v10H3z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M16 9l4 0 0 5M16 14l4 0" />
          <circle cx="5.5" cy="18.5" r="2.5" />
          <circle cx="18.5" cy="18.5" r="2.5" />
        </svg>
      ) },
    { key: 'returns', label: 'Return & Replacement', href: '/returns', icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v5h5" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21v-5h-5" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 10a9 9 0 0116 0" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M20 14a9 9 0 01-16 0" />
        </svg>
      ) },
    { key: 'faq', label: 'FAQ', href: '/faq', icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 16h.01M16 10h.01M12 4a9 9 0 100 18 9 9 0 000-18z" />
        </svg>
      ) },
  ];

  return (
    <nav className="space-y-4">
      {items.map(i => {
        const active = pathname === i.href;
        return (
          <Link key={i.key} href={i.href} className={`flex items-center gap-3 p-2 rounded-lg text-sm font-medium transition ${active ? 'bg-gray-200 text-gray-900' : 'text-gray-700 hover:bg-gray-100'}`}>
            {i.icon}
            <span>{i.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
