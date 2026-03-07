"use client"
import React, { useState } from 'react'
import Link from 'next/link'
import WebsiteLogo from '@/components/ui/WebsiteLogo'
import { useUser } from '@/components/context/UserContext'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default function Footer() {
  const { user } = useUser();
  const [email, setEmail] = useState('');
  const [toast, setToast] = useState(null); // { type: 'success'|'error'|'warn', msg }

  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  };

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!user) {
      showToast('warn', 'Please log in to subscribe to our newsletter.');
      return;
    }
    if (!email.trim()) {
      showToast('error', 'Please enter a valid email address.');
      return;
    }
    try {
      // Use the existing profile endpoint to persist newsletterSubscribed flag
      const formData = new FormData();
      formData.append('newsletterSubscribed', 'true');
      const resp = await fetch(`${API}/api/user/profile`, {
        method: 'PUT',
        credentials: 'include',
        body: formData,
      });
      const text = await resp.text();
      let data = {};
      try { data = JSON.parse(text); } catch { /* non-JSON */ }
      if (!resp.ok) throw new Error(data.error || `Server error (${resp.status})`);
      showToast('success', 'You are now subscribed! 🎉');
      setEmail('');
    } catch (err) {
      showToast('error', err.message || 'Subscription failed. Try again.');
    }
  };
  return (
    <>
    <footer role="contentinfo" className="bg-[#FFF5ED] border-t border-black/6">
      <div className="max-w-[1200px] mx-auto px-4 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <div className="mb-3">
              <WebsiteLogo />
            </div>
            <p className="text-sm text-[#202020] max-w-[260px]">Budget Friendly brings you curated beauty and skincare products with fast shipping and reliable customer service.</p>

            <div className="flex items-center gap-3 mt-4">
              <a href="#" aria-label="Facebook" className="text-[#202020] hover:text-red-600">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a4 4 0 0 0-4 4v3H8v4h3v8h4v-8h3l1-4h-4V6a1 1 0 0 1 1-1h3z"/></svg>
              </a>
              <a href="#" aria-label="Instagram" className="text-[#202020] hover:text-red-600">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
              </a>
              <a href="#" aria-label="Twitter" className="text-[#202020] hover:text-red-600">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M23 3a10.9 10.9 0 0 1-3.14 1.53A4.48 4.48 0 0 0 12 7v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"/></svg>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-medium text-[#202020] mb-3">Quick links</h3>
            <ul className="space-y-2 text-sm text-[#202020]">
              <li><Link href="/" className="hover:text-red-600">Home</Link></li>
              <li><Link href="/category/electronics" className="hover:text-red-600">Electronics</Link></li>
              <li><Link href="/category/gents" className="hover:text-red-600">Gents</Link></li>
              <li><Link href="/category/ladies" className="hover:text-red-600">Ladies</Link></li>
              
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h3 className="text-sm font-medium text-[#202020] mb-3">Customer service</h3>
            <ul className="space-y-2 text-sm text-[#202020]">
              <li><Link href="/shipping" className="hover:text-red-600">Shipping & returns</Link></li>
              <li><Link href="/faq" className="hover:text-red-600">FAQ</Link></li>
              <li><Link href="/contact" className="hover:text-red-600">Contact us</Link></li>
              <li><Link href="/about" className="hover:text-red-600">About Us</Link></li>
            </ul>
          </div>

        <div>
            <h3 className="text-sm font-medium text-[#202020] mb-3">Join our newsletter</h3>
            <p className="text-sm text-[#202020] mb-3">Get updates on new products and offers. Unsubscribe anytime.</p>
            <form onSubmit={handleSubscribe} className="w-full">
              <label htmlFor="newsletter" className="sr-only">Email address</label>
              <div className="relative">
                <input
                  id="newsletter"
                  type="email"
                  placeholder="Your email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full px-4 py-2 pr-24 rounded-full border border-black/10 outline-none text-sm focus:ring-2 focus:ring-[#ac0ad1]"
                  aria-label="Email address"
                />
                <button
                  type="submit"
                  aria-label="Subscribe"
                  className="absolute right-1 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-full bg-rose-600 text-white text-xs hover:bg-rose-700"
                >
                  Subscribe
                </button>
              </div>
            </form>

            <div className="mt-6">
              <span className="text-sm text-[#202020] font-medium">Pay with</span>
              <div className="flex items-center gap-2 mt-2">
                {/* Visa */}
                <div className="w-12 h-8 flex items-center justify-center rounded-sm bg-white border border-black/5 p-1">
                  <svg width="40" height="18" viewBox="0 0 40 18" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Visa" role="img">
                    <rect width="40" height="18" rx="2" fill="#1A5ABB" />
                    <text x="8" y="13" fill="white" fontSize="9" fontWeight="700">VISA</text>
                  </svg>
                </div>

                {/* MasterCard */}
                <div className="w-12 h-8 flex items-center justify-center rounded-sm bg-white border border-black/5 p-1">
                  <svg width="40" height="18" viewBox="0 0 40 18" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Mastercard" role="img">
                    <rect width="40" height="18" rx="2" fill="white" />
                    <g transform="translate(6,2)">
                      <circle cx="6" cy="7" r="5" fill="#FF5F00"/>
                      <circle cx="13" cy="7" r="5" fill="#EB001B"/>
                    </g>
                  </svg>
                </div>

                {/* Amex */}
                <div className="w-12 h-8 flex items-center justify-center rounded-sm bg-white border border-black/5 p-1">
                  <svg width="40" height="18" viewBox="0 0 40 18" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="American Express" role="img">
                    <rect width="40" height="18" rx="2" fill="#2E77BC" />
                    <text x="6" y="13" fill="white" fontSize="6.5" fontWeight="700">AMEX</text>
                  </svg>
                </div>

                {/* PayPal */}
                <div className="w-12 h-8 flex items-center justify-center rounded-sm bg-white border border-black/5 p-1">
                  <svg width="40" height="18" viewBox="0 0 40 18" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="PayPal" role="img">
                    <rect width="40" height="18" rx="2" fill="#003087" />
                    <text x="8" y="13" fill="white" fontSize="7" fontWeight="700">Pay</text>
                    <text x="22" y="13" fill="#66A5E2" fontSize="7" fontWeight="700">Pal</text>
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 border-t border-black/6 pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-[#202020]">
          <p>© {new Date().getFullYear()} Budget Friendly. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="hover:text-red-600">Privacy</Link>
            <Link href="/terms" className="hover:text-red-600">Terms</Link>
            <Link href="/sitemap" className="hover:text-red-600">Sitemap</Link>
          </div>
        </div>
      </div>
    </footer>

    {/* Subscribe toast */}
    {toast && (
      <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-full text-sm font-medium shadow-lg text-white transition-all ${
        toast.type === 'success' ? 'bg-green-600' :
        toast.type === 'warn'    ? 'bg-amber-500' : 'bg-red-600'
      }`}>
        {toast.msg}
      </div>
    )}
  </>
  )
}
