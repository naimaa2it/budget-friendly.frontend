"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useUser } from '@/components/context/UserContext';
import { useParams, useRouter } from 'next/navigation';
import AuthModal from '@/components/auth/AuthModal';
import WishlistPage from '@/components/cart/WishlistPage';
import AddressManager from '@/components/user/AddressManager';

export default function UserSectionPage() {
  const { user, setUser, refreshUser } = useUser();
  const params = useParams();
  const router = useRouter();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', email: '', mobile: '', dob: '' });
  const [selectedImageFile, setSelectedImageFile] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [gravatarUrl, setGravatarUrl] = useState(null);

  const section = params.section || 'profile';

  useEffect(() => {
    if (!user) {
      setTimeout(() => setShowAuthModal(true), 0);
    }
  }, [user]);

  // compute gravatar when user email changes
  useEffect(() => {
    if (user && user.email) {
      const computeHash = async (email) => {
        const encoder = new TextEncoder();
        const data = encoder.encode(email.trim().toLowerCase());
        const hashBuffer = await crypto.subtle.digest('MD5', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      };
      computeHash(user.email).then(h => {
        setGravatarUrl(`https://www.gravatar.com/avatar/${h}?d=identicon`);
      });
    }
  }, [user && user.email]);

  useEffect(() => {
    if (user && !isEditing) {
      setTimeout(() => {
        setEditForm({
          name: user.name || '',
          email: user.email || '',
          mobile: user.mobile || '',
          dob: user.dob || ''
        });
        setPreviewImage(user.image || gravatarUrl || null);
        setSelectedImageFile(null);
        setRemoveImage(false);
      }, 0);
    }
  }, [user, isEditing, gravatarUrl]);

  const handleSectionClick = (sec) => {
    router.push(`/user/${sec}`);
  };

  const handleLogout = async () => {
    try {
      const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      await fetch(`${API}/api/auth/logout`, { method: 'POST', credentials: 'include' });
    } catch (err) {
      // ignore
    }
    sessionStorage.removeItem('ya_access');
    setUser(null);
    router.push('/');
  };

  const handleSaveProfile = async () => {
    const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    try {
      const formData = new FormData();
      formData.append('name', editForm.name);
      formData.append('email', editForm.email);
      formData.append('mobile', editForm.mobile);
      formData.append('dob', editForm.dob);
      if (selectedImageFile) {
        formData.append('image', selectedImageFile);
      }
      if (removeImage && !selectedImageFile) {
        formData.append('removeImage', '1');
      }

      const res = await fetch(`${API}/api/user/profile`, {
        method: 'PUT',
        credentials: 'include',
        body: formData
      });
      const data = await res.json();
      if (data.ok) {
        setIsEditing(false);
        refreshUser();
      } else {
        console.error('Profile save error', data);
        alert(data.error || 'Failed to save profile');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to save profile');
    }
  };

  if (!user) {
    return <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className=" mx-auto ml-40 -mb-5">
        {/* always-visible back button */}
        <button
          onClick={() => router.back()}
          className=" px-4  mt-2 text-gray-500 rounded hover:text-gray-900"
        >
          ← Back
        </button>
      </div>
      <div className="max-w-7xl mx-auto py-8 px-4">
        <div className="flex gap-6">
          {/* Left Sidebar */}
          <div className="w-80 bg-white rounded-lg shadow h-fit sticky top-24">
            {/* User Profile Section */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center gap-3 mb-2">
                  {previewImage ? (
                  <Image src={previewImage} alt={user.name || 'User'} width={56} height={56} className="w-14 h-14 rounded-full object-cover" />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-orange-400 flex items-center justify-center text-white text-xl font-semibold">
                    {(user.name || user.email || 'U').charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-lg truncate">{user.name || 'User'}</h3>
                  <p className="text-sm text-gray-600 truncate">{user.email}</p>
                </div>
              </div>
            </div>

            {/* Navigation Menu */}
            <div className="py-4">
              {/* PROFILE Section */}
              <div className="mb-6">
                <h4 className="px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Profile</h4>
                <button
                  onClick={() => handleSectionClick('profile')}
                  className={`w-full text-left px-6 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors ${
                    section === 'profile' ? 'bg-gray-100 border-l-4 border-red-600' : ''
                  }`}
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                  <span>General info</span>
                </button>
                <button
                  onClick={() => handleSectionClick('wishlist')}
                  className={`w-full text-left px-6 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors ${
                    section === 'wishlist' ? 'bg-gray-100 border-l-4 border-red-600' : ''
                  }`}
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20.8 4.6a5 5 0 0 0-7.1 0L12 6.3l-1.7-1.7a5 5 0 0 0-7.1 7.1L12 21l8.8-9.3a5 5 0 0 0 0-7.1z"/>
                  </svg>
                  <span>Favourites</span>
                </button>
                <button
                  onClick={() => router.push('/cart')}
                  className={`w-full text-left px-6 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors`}
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="9" cy="20" r="1"/>
                    <circle cx="20" cy="20" r="1"/>
                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                  </svg>
                  <span>My Cart</span>
                </button>
              </div>

              {/* ORDERS Section */}
              <div className="mb-6">
                <h4 className="px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Orders</h4>
                <button
                  onClick={() => handleSectionClick('orders')}
                  className={`w-full text-left px-6 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors ${
                    section === 'orders' ? 'bg-gray-100 border-l-4 border-red-600' : ''
                  }`}
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 2H4a2 2 0 0 0-2 2v5m0 9v3a2 2 0 0 0 2 2h5M15 2h5a2 2 0 0 1 2 2v5m0 9v3a2 2 0 0 1-2 2h-5"/>
                  </svg>
                  <span>Orders</span>
                </button>
                <button
                  onClick={() => handleSectionClick('address')}
                  className={`w-full text-left px-6 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors ${
                    section === 'address' ? 'bg-gray-100 border-l-4 border-red-600' : ''
                  }`}
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                    <circle cx="12" cy="10" r="3"/>
                  </svg>
                  <span>My Address</span>
                </button>
              </div>

              {/* OTHER Section */}
              <div className="mb-6">
                <h4 className="px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Other</h4>
                <button
                  onClick={() => handleSectionClick('reviews')}
                  className={`w-full text-left px-6 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors ${
                    section === 'reviews' ? 'bg-gray-100 border-l-4 border-red-600' : ''
                  }`}
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
                  </svg>
                  <span>My reviews</span>
                </button>
                <button
                  onClick={() => handleSectionClick('rewards')}
                  className={`w-full text-left px-6 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors ${
                    section === 'rewards' ? 'bg-gray-100 border-l-4 border-red-600' : ''
                  }`}
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                  <span>My Rewards</span>
                </button>
                <button
                  onClick={() => handleSectionClick('coupons')}
                  className={`w-full text-left px-6 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors ${
                    section === 'coupons' ? 'bg-gray-100 border-l-4 border-red-600' : ''
                  }`}
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 8.5a2.5 2.5 0 0 1 0 5M3 8.5a2.5 2.5 0 0 0 0 5"/>
                    <path d="M3 3h18v18H3z"/>
                    <line x1="9" y1="9" x2="15" y2="15"/>
                    <line x1="15" y1="9" x2="9" y2="15"/>
                  </svg>
                  <span>My Coupons</span>
                </button>
              </div>
            </div>

            {/* Logout Button */}
            <div className="p-4 border-t border-gray-200">
              <button
                onClick={handleLogout}
                className="w-full px-4 py-3 border border-red-600 text-red-600 rounded-lg hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                  <polyline points="16 17 21 12 16 7"/>
                  <line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
                <span>Logout</span>
              </button>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1">
            
            {section === 'profile' && (
              <div className="bg-white rounded-lg shadow">
                <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                  <h2 className="text-2xl font-semibold">General Info</h2>
                  {!isEditing ? (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                    >
                      Edit
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={() => setIsEditing(false)}
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveProfile}
                        className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                      >
                        Save
                      </button>
                    </div>
                  )}
                </div>
                <div className="p-6 space-y-6">
                  {/* avatar + upload row shown only while editing */}
                  {isEditing && (
                    <div className="flex items-center gap-4">
                      <div className="w-20 h-20">
                        {previewImage ? (
                          <Image
                            src={previewImage}
                            alt={user.name || 'User'}
                            width={80}
                            height={80}
                            className="w-20 h-20 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-20 h-20 rounded-full bg-orange-400 flex items-center justify-center text-white text-2xl font-semibold">
                            {(user.name || user.email || 'U').charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="cursor-pointer text-sm text-blue-600 hover:underline">
                          Select image
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const f = e.target.files && e.target.files[0];
                              if (f) {
                                setSelectedImageFile(f);
                                setPreviewImage(URL.createObjectURL(f));
                                setRemoveImage(false);
                              }
                            }}
                          />
                        </label>
                        {(previewImage && !selectedImageFile) && (
                          <button
                            type="button"
                            className="text-sm text-red-500 hover:underline"
                            onClick={() => {
                              setRemoveImage(true);
                              setPreviewImage(gravatarUrl);
                              setSelectedImageFile(null);
                            }}
                          >
                            Remove image
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                  <div>
                    <label className="block text-sm text-gray-600 mb-2">Name</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                      />
                    ) : (
                      <p className="text-lg">{user.name || 'Project Toktik'}</p>
                    )}
                  </div>

                  <div className="border-t border-gray-100 pt-6">
                    <label className="block text-sm text-gray-600 mb-2">Mail Address</label>
                    {isEditing ? (
                      <input
                        type="email"
                        value={editForm.email}
                        onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                      />
                    ) : (
                      <p className="text-lg">{user.email}</p>
                    )}
                  </div>

                  <div className="border-t border-gray-100 pt-6">
                    <label className="block text-sm text-gray-600 mb-2">Mobile Number</label>
                    {isEditing ? (
                      <input
                        type="tel"
                        value={editForm.mobile}
                        onChange={(e) => setEditForm({ ...editForm, mobile: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                        placeholder="Not Provided"
                      />
                    ) : (
                      <p className="text-lg">{user.mobile || 'Not Provided'}</p>
                    )}
                  </div>

                  <div className="border-t border-gray-100 pt-6">
                    <label className="block text-sm text-gray-600 mb-2">Date Of Birth</label>
                    {isEditing ? (
                      <input
                        type="date"
                        value={editForm.dob}
                        onChange={(e) => setEditForm({ ...editForm, dob: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                      />
                    ) : (
                      <p className="text-lg">{user.dob || 'Not Provided'}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {section === 'orders' && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-2xl font-semibold mb-4">Your Orders</h2>
                <p className="text-gray-600">You have not placed any orders yet.</p>
              </div>
            )}

            {section === 'wishlist' && (
              <div className="bg-white rounded-lg shadow">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-2xl font-semibold">My Wishlist</h2>
                </div>
                <div className="p-6">
                  <WishlistPage embedded={true} />
                </div>
              </div>
            )}

            {section === 'address' && (
              <div className="bg-white rounded-lg shadow p-6">
                <AddressManager />
              </div>
            )}

            {section === 'reviews' && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-2xl font-semibold mb-4">My Reviews</h2>
                <p className="text-gray-600">No reviews yet.</p>
              </div>
            )}

            {section === 'rewards' && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-2xl font-semibold mb-4">My Rewards</h2>
                <p className="text-gray-600">You have no rewards at this time.</p>
              </div>
            )}

            {section === 'coupons' && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-2xl font-semibold mb-4">My Coupons</h2>
                <p className="text-gray-600">No coupons available.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
