"use client";

import React from 'react';
import { usePathname } from 'next/navigation';
import Navbar from '@/components/common/Navbar';
import MegaMenuNavbar from '@/components/common/MegaMenuNavbar';
import Footer from '@/components/common/Footer';

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
