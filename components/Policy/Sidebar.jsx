"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';

// simple sidebar for policy/help pages
// strip a trailing slash so '/shipping/' matches href '/shipping'
// (site uses trailingSlash: true, but hrefs below are written without it)
const normalize = (p) => (p.length > 1 ? p.replace(/\/$/, '') : p);

export default function PolicySidebar() {
  const pathname = normalize(usePathname() || '');

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
    { key: 'privacy', label: 'Privacy Policy', href: '/privacy', icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 11c0-3.866-3.582-7-8-7v14c4.418 0 8-3.134 8-7z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 11c0 3.866 3.582 7 8 7V4c-4.418 0-8 3.134-8 7z" />
        </svg>
      ) },
    { key: 'terms', label: 'Terms & Conditions', href: '/terms', icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h7l5 5v13a2 2 0 01-2 2z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M14 3v5h5" />
        </svg>
      ) },
    { key: 'contact', label: 'Contact Us', href: '/contact', icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 10a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7H9v3l-4-4 4-4v3h4a4.5 4.5 0 004.5-4.5V6a4.5 4.5 0 00-4.5-4.5H5" />
        </svg>
      ) },
    { key: 'about', label: 'About Us', href: '/about', icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 16v-4" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8h.01" />
        </svg>
      ) },
  ];

  return (
    <nav className="space-y-4 bg-[#FFF5ED] p-4 rounded-lg">
      {items.map(i => {
        const active = pathname === normalize(i.href);
        return (
          <Link key={i.key} href={i.href} className={`flex items-center gap-3 p-2 rounded-lg text-sm font-medium transition ${active ? 'bg-rose-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`}>
            {i.icon}
            <span>{i.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
