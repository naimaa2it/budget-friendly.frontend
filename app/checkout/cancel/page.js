"use client";

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense, useState } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

function CancelContent() {
  const params = useSearchParams();
  const orderId = params.get('orderId');
  const [retrying, setRetrying] = useState(false);
  const [retryError, setRetryError] = useState('');

  const handleRetry = async () => {
    if (!orderId) return;
    setRetrying(true);
    setRetryError('');
    try {
      const res = await fetch(`${API}/api/orders/${orderId}/pay`, {
        method: 'POST',
        credentials: 'include',
      });
      const data = await res.json();
      if (data.ok && data.url) {
        window.location.href = data.url;
      } else {
        setRetryError(data.error || 'Could not initiate payment. Please try again.');
        setRetrying(false);
      }
    } catch {
      setRetryError('Network error. Please check your connection.');
      setRetrying(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-rose-50 flex items-center justify-center px-4 py-10">
      <div className="bg-white rounded-3xl shadow-xl p-8 sm:p-10 max-w-md w-full text-center">

        {/* Animated icon */}
        <div className="relative w-24 h-24 mx-auto mb-6">
          <div className="absolute inset-0 bg-orange-100 rounded-full animate-ping opacity-30" />
          <div className="relative w-24 h-24 bg-gradient-to-br from-orange-100 to-rose-100 rounded-full flex items-center justify-center">
            <svg className="w-12 h-12 text-orange-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path strokeLinecap="round" d="M12 7v5l3 3" />
            </svg>
          </div>
        </div>

        {/* Heading */}
        <h1 className="text-2xl font-extrabold text-gray-900 mb-1">Order Saved!</h1>
        <p className="text-base text-gray-500 mb-4">
          You closed the payment window, but your order is safely kept.
        </p>

        {/* Info box */}
        <div className="bg-orange-50 border border-orange-200 rounded-2xl px-5 py-4 mb-5 text-left space-y-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-orange-400 shrink-0" />
            <p className="text-sm text-orange-800 font-medium">Your order is saved as <span className="font-bold">Unpaid</span></p>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-orange-400 shrink-0" />
            <p className="text-sm text-orange-800">You can complete payment anytime from your account</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-orange-400 shrink-0" />
            <p className="text-sm text-orange-800">Your cart items are still here if you want to restart</p>
          </div>
        </div>

        {/* Order ref */}
        {orderId && (
          <div className="bg-gray-50 rounded-xl px-4 py-3 mb-5 text-center">
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-0.5">Order Reference</p>
            <p className="font-mono font-bold text-gray-800 text-lg tracking-widest">
              #{orderId.slice(-8).toUpperCase()}
            </p>
          </div>
        )}

        {retryError && (
          <p className="text-sm text-red-600 bg-red-50 rounded-xl px-3 py-2 mb-4">{retryError}</p>
        )}

        {/* Actions */}
        <div className="space-y-3">
          {orderId && (
            <button
              onClick={handleRetry}
              disabled={retrying}
              className="w-full py-3.5 bg-gradient-to-r from-rose-500 to-orange-500 text-white rounded-xl font-bold text-base hover:from-rose-600 hover:to-orange-600 transition disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
            >
              {retrying ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                  </svg>
                  Redirecting to payment…
                </span>
              ) : '💳 Complete Payment Now'}
            </button>
          )}

          <Link
            href="/user/orders"
            className="block w-full py-3 bg-gray-900 text-white rounded-xl font-semibold hover:bg-gray-700 transition"
          >
            Pay Later — View My Orders
          </Link>

          <Link
            href="/"
            className="block w-full py-3 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition text-sm"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutCancelPage() {
  return (
    <Suspense>
      <CancelContent />
    </Suspense>
  );
}
