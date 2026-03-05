"use client";

import React from 'react';
import { usePathname } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import MegaMenuNavbar from '@/components/layout/MegaMenuNavbar';
import Footer from '@/components/layout/Footer';

export default function LayoutWrapper({ children }) {
  const pathname = usePathname() || '';
  const hideNav = pathname.startsWith('/dashabord');

  return (
    <>
      {!hideNav && (
        <div className="sticky top-0 z-50 bg-white">
          <Navbar />
          <MegaMenuNavbar />
        </div>
      )}

      {children}

      {!hideNav && <Footer />}
    </>
  );
}
