"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/components/context/UserContext';

export default function AdminLogin() {
  const router = useRouter();
  const { refreshUser } = useUser();
  const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  // only login supported now, so no "mode" toggling or registration state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [secret, setSecret] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState('error');
  const [loading, setLoading] = useState(false);

  const showMessage = (msg, t = 'error') => {
    setMessage(msg);
    setType(t);
  };

  const clear = () => {
    setMessage('');
    setType('error');
  };


  const handleLogin = async (e) => {
    e.preventDefault();
    clear();
    if (!email || !password || !secret) return showMessage('Email, password and secret code are required');

    setLoading(true);
    try {
      // Admin login: authenticate directly with backend (no Firebase)
      const resp = await fetch(`${API}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password, adminSecret: secret })
      });
      const body = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        throw new Error(body.error || `Server responded ${resp.status}`);
      }

      await refreshUser();
      showMessage('Login successful — redirecting...', 'success');
      setTimeout(() => router.push('/dashboard'), 1000);
    } catch (err) {
      console.error('Admin login error:', err);
      showMessage(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto mt-12 p-6 bg-white rounded shadow">
      <h1 className="text-2xl font-semibold mb-4 text-pink-600">Admin / Moderator — Sign in</h1>


      <form onSubmit={handleLogin} className="space-y-3">
        <div>
          <label className="block text-sm">Email</label>
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full border border-gray-200 bg-white text-gray-900 placeholder-gray-400 px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-indigo-100"
            disabled={loading}
            required
          />
        </div>

        <div className="relative">
          <label className="block text-sm font-medium">Password</label>
          <input
            type={showPassword ? 'text' : 'password'}
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full pr-10 border border-gray-200 bg-white text-gray-900 placeholder-gray-400 px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-indigo-100"
            disabled={loading}
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(s => !s)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            disabled={loading}
            className="absolute right-2 top-[34px] text-gray-500 hover:text-gray-900"
          >
            {showPassword ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-5 0-9.27-3-11-7 1.02-2.1 2.6-3.89 4.54-5.06"/><path d="M1 1l22 22"/></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            )}
          </button>
        </div>


        <div>
          <label className="block text-sm">Secret code</label>
          <input
            placeholder="Server secret code"
            value={secret}
            onChange={e => setSecret(e.target.value)}
            className="w-full border border-gray-200 bg-white text-gray-900 placeholder-gray-400 px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-indigo-100"
            disabled={loading}
            required
          />
          <div className="text-xs text-gray-500 mt-1">Enter the secret code</div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={loading}
            className="bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-opacity"
          >
            {loading && (
              <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            {loading ? 'Logging in...' : 'Login'}
          </button>
          <button type="button" onClick={() => { setEmail(''); setPassword(''); setSecret(''); }} className="px-3 py-2 border rounded">Clear</button>
        </div>
      </form>

      {message && (
        <div className={`mt-4 p-3 rounded-lg text-sm ${type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : type === 'info' ? 'bg-blue-50 text-blue-800 border border-blue-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
          <div className="flex items-start gap-2">
            {type === 'success' && (
              <svg className="w-5 h-5 text-green-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            )}
            {type === 'error' && (
              <svg className="w-5 h-5 text-red-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            )}
            {type === 'info' && (
              <svg className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            )}
            <div className="flex-1">
              <p>{message}</p>
            </div>
          </div>
        </div>
      )}

      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded text-sm text-gray-700">
        <h3 className="font-semibold text-blue-900 mb-2">Security features</h3>
        <ul className="list-disc list-inside space-y-1">
          <li>Admin accounts are stored in a separate <strong>Admin collection</strong> (not mixed with regular users)</li>
          <li>Passwords are hashed with bcrypt (12 rounds)</li>
          <li>Account locks after 20 failed login attempts (30-minute lockout)</li>
          <li>Login attempts and IP addresses are logged</li>
          <li>Server validates the admin secret code on each login</li>
        </ul>
      </div>
    </div>
  );
}
