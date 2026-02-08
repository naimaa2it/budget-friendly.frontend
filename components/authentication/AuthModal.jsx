"use client";

import React, { useState } from 'react';
import { useUser } from '@/components/context/UserContext';
import { auth, googleProvider } from '@/lib/firebase';
import { signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendEmailVerification, sendPasswordResetEmail } from 'firebase/auth';
import WebsiteLogo from '../Shared/WebsiteLogo';

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
       <div className='flex justify-center text-3xl'>
        <WebsiteLogo/>
        </div>
        <h2 className="text-2xl font-semibold mb-4 text-gray-900 text-center">Continue to Budget Friendly</h2>

        {view === 'choose' && (
          <div className="space-y-3">
            <button onClick={handleGoogle} className="w-full border border-gray-200 px-4 py-3 flex items-center justify-center gap-3 text-gray-800 hover:bg-gray-50">
              <svg className="w-5 h-5" viewBox="0 0 533.5 544.3" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path fill="#4285F4" d="M533.5 278.4c0-18.5-1.7-36.3-4.9-53.6H272v101.4h146.9c-6.3 34.7-25.2 64.1-53.9 83.9v69.6h87.1c51-47 80.4-116.5 80.4-201.3z"/>
                <path fill="#34A853" d="M272 544.3c72.6 0 133.6-24 178.2-65.1l-87.1-69.6c-24.2 16.2-55.2 25.8-91.1 25.8-69.9 0-129.2-47.1-150.4-110.4H31.9v69.5C76.5 492.5 168.9 544.3 272 544.3z"/>
                <path fill="#FBBC05" d="M121.6 323.8c-10.8-32-10.8-66.6 0-98.6V155.7H31.9c-35.3 69.9-35.3 153.6 0 223.5l89.7-55.4z"/>
                <path fill="#EA4335" d="M272 107.7c39.4-.6 77.1 14.5 104.8 40.6l78.5-78.5C403.8 24.6 341.6 0 272 0 168.9 0 76.5 51.8 31.9 155.7l89.7 69.5C142.8 154.8 202.1 107.7 272 107.7z"/>
              </svg>
              <span>Continue with Google</span>
            </button>
            <button onClick={() => setView('email-login')} className="w-full border border-gray-200 px-4 py-3 flex items-center justify-center gap-3 text-gray-800 hover:bg-gray-50">
              <svg className="w-5 h-5 text-gray-800" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M3 7.5v9A2.5 2.5 0 0 0 5.5 19h13a2.5 2.5 0 0 0 2.5-2.5v-9A2.5 2.5 0 0 0 18.5 5h-13A2.5 2.5 0 0 0 3 7.5z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M21 7.5l-9 6-9-6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
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
