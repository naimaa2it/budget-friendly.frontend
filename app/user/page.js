"use client";

import React, { useState, useEffect } from 'react';
import { useUser } from '@/components/context/UserContext';
import { useSearchParams, useRouter } from 'next/navigation';
import AuthModal from '@/components/authentication/AuthModal';
import WishlistPage from '@/components/cart/WishlistPage';

export default function UserPage() {
  const { user, refreshUser } = useUser();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [showAuthModal, setShowAuthModal] = useState(false);

  const section = searchParams.get('section') || 'profile';

  useEffect(() => {
    if (!user) {
      // delay slightly to avoid React warning about state updates in effect
      setTimeout(() => setShowAuthModal(true), 0);
    }
  }, [user]);

  const handleSectionClick = (sec) => {
    router.push(`/user?section=${sec}`);
  };

  if (!user) {
    return <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-2xl font-bold mb-6">Hello, {user.name || user.email}</h1>
        {/* simple tab navigation */}
        <div className="flex flex-wrap gap-2 mb-8">
          {['profile','orders','wishlist','reviews','points','interest'].map((sec) => (
            <button
              key={sec}
              onClick={() => handleSectionClick(sec)}
              className={`px-4 py-2 rounded-md ${section === sec ? 'bg-red-600 text-white' : 'bg-white border'}`}
            >
              {sec.charAt(0).toUpperCase() + sec.slice(1)}
            </button>
          ))}
        </div>

        {/* section content */}
        <div>
          {section === 'profile' && (
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">Profile information</h2>
              <p><strong>Name:</strong> {user.name || '–'}</p>
              <p><strong>Email:</strong> {user.email || '–'}</p>
              {/* Additional fields could go here */}
            </div>
          )}

          {section === 'orders' && (
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">Your orders</h2>
              <p className="text-gray-600">You have not placed any orders yet.</p>
            </div>
          )}

          {section === 'wishlist' && (
            <WishlistPage embedded={true} />
          )}

          {section === 'reviews' && (
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">Your reviews</h2>
              <p className="text-gray-600">No reviews yet.</p>
            </div>
          )}

          {section === 'points' && (
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">YourHaat points</h2>
              <p className="text-gray-600">You have 0 points.</p>
            </div>
          )}

          {section === 'interest' && (
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">Interests</h2>
              <p className="text-gray-600">You haven&apos;t set any interests yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
