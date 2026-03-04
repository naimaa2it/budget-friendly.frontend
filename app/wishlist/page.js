"use client";

import React, { useState, useEffect } from 'react';
import { useUser } from '@/components/context/UserContext';
import { useRouter } from 'next/navigation';
import AuthModal from '@/components/authentication/AuthModal';
import WishlistPage from '@/components/cart/WishlistPage';

export const metadata = {
  title: 'Wishlist - YourHaat',
  description: 'Your saved products',
};

export default function Wishlist() {
  const { user } = useUser();
  const router = useRouter();
  const [showAuth, setShowAuth] = useState(false);
  useEffect(() => {
    if (!user) {
      setShowAuth(true);
    } else {
      // if user is now logged in we want to canonicalize the route
      router.push('/user/wishlist');
    }
  }, [user, router]);

  if (!user) {
    return <AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} />;
  }

  return <WishlistPage />;
}
