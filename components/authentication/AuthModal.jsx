"use client";

import React, { useState } from 'react';
import { useUser } from '@/components/context/UserContext';
import { auth, googleProvider } from '@/lib/firebase';
import { signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendEmailVerification, sendPasswordResetEmail } from 'firebase/auth';

export default function AuthModal({ isOpen, onClose }) {
  const { setUser, refreshUser } = useUser();
  const [view, setView] = useState('choose'); // choose | email-login | email-register
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
  const [message, setMessage] = useState('');

  if (!isOpen) return null;

  const handleGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      // send to backend to create session
      await fetch(`${API}/api/auth/firebase-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: user.email, name: user.displayName, image: user.photoURL, provider: 'google' })
      });
      await refreshUser();
      onClose();
    } catch (err) {
      console.error(err);
      setMessage('Google login failed');
    }
  };

  const handleEmailRegister = async (e) => {
    e.preventDefault();
    setMessage('');
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await sendEmailVerification(userCredential.user);
      setMessage('Verification email sent. Please verify your email then login.');
      setView('email-login');
    } catch (err) {
      console.error(err);
      setMessage(err.message || 'Registration failed');
    }
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setMessage('');
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      if (!userCredential.user.emailVerified) {
        setMessage('Please verify your email before signing in.');
        return;
      }

      // send user info to backend to create session
      await fetch(`${API}/api/auth/firebase-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: userCredential.user.email, name: userCredential.user.displayName || name, image: userCredential.user.photoURL || '' })
      });

      await refreshUser();
      onClose();
    } catch (err) {
      console.error(err);
      setMessage(err.message || 'Login failed');
    }
  };

  const handleForgot = async () => {
    if (!email) return setMessage('Enter your email to reset');
    try {
      await sendPasswordResetEmail(auth, email);
      setMessage('Password reset email sent.');
    } catch (err) {
      console.error(err);
      setMessage(err.message || 'Failed to send reset email');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose}></div>
      <div className="bg-white rounded-lg p-6 relative z-10 w-full max-w-md">
        <button onClick={onClose} className="absolute top-3 right-3 text-gray-600 hover:text-gray-900">✕</button>
        <h2 className="text-2xl font-semibold mb-4 text-gray-900">Continue to Budget Friendly</h2>

        {view === 'choose' && (
          <div className="space-y-3">
            <button onClick={handleGoogle} className="w-full border border-gray-200 px-4 py-3 flex items-center justify-center gap-3 text-gray-800 hover:bg-gray-50">
              <img src="/google-icon.png" alt="g" className="w-5" />
              <span>Continue with Google</span>
            </button>
            <button onClick={() => setView('email-login')} className="w-full border border-gray-200 px-4 py-3 flex items-center justify-center gap-3 text-gray-800 hover:bg-gray-50">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-gray-800"><path d="M4 4h16v16H4z" stroke="currentColor"/></svg>
              <span>Continue with Email</span>
            </button>
          </div>
        )}

        {view === 'email-register' && (
          <form onSubmit={handleEmailRegister} className="space-y-3">
            <div>
              <input required placeholder="Name" value={name} onChange={e => setName(e.target.value)} className="w-full border border-gray-200 bg-white text-gray-900 placeholder-gray-400 px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-indigo-100" />
            </div>
            <div>
              <input required placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className="w-full border border-gray-200 bg-white text-gray-900 placeholder-gray-400 px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-indigo-100" />
            </div>
            <div>
              <input required placeholder="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full border border-gray-200 bg-white text-gray-900 placeholder-gray-400 px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-indigo-100" />
            </div>
            <div className="flex gap-2">
              <button type="submit" className="bg-gray-700 hover:bg-gray-800 text-white px-4 py-2 rounded">Continue →</button>
              <button type="button" onClick={() => setView('choose')} className="px-4 py-2 text-gray-700 hover:bg-gray-50">Back</button>
            </div>
          </form>
        )}

        {view === 'email-login' && (
          <form onSubmit={handleEmailLogin} className="space-y-3">
            <div>
              <input required placeholder="Enter email" value={email} onChange={e => setEmail(e.target.value)} className="w-full border border-gray-200 bg-white text-gray-900 placeholder-gray-400 px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-indigo-100" />
            </div>
            <div>
              <input required placeholder="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full border border-gray-200 bg-white text-gray-900 placeholder-gray-400 px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-indigo-100" />
            </div>
            <div className="flex gap-2">
              <button type="submit" className="bg-gray-700 hover:bg-gray-800 text-white px-4 py-2 rounded">Continue →</button>
              <button type="button" onClick={() => setView('email-register')} className="px-4 py-2 text-gray-700 hover:bg-gray-50">Register</button>
            </div>
            <div>
              <button type="button" onClick={handleForgot} className="text-sm text-indigo-600 hover:text-indigo-800">Forgot password?</button>
            </div>
          </form>
        )}

        {message && <p className="mt-3 text-sm text-red-600">{message}</p>}
      </div>
    </div>
  );
}
