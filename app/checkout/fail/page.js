"use client";

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense, useState } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

function FailContent() {
  const params = useSearchParams();
  const orderId = params.get('orderId');
  const reason = params.get('reason');
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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-lg p-10 max-w-md w-full text-center">
        {/* X icon */}
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-red-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Failed</h1>
        <p className="text-gray-600 mb-1">
          {reason === 'amount_mismatch'
            ? 'Payment amount did not match the order total. Please retry.'
            : reason === 'server_error'
            ? 'A server error occurred while processing your payment.'
            : 'Your payment could not be completed. No amount has been charged.'}
        </p>

        {orderId && (
          <p className="text-sm text-gray-500 mt-3 mb-2">
            Reference: <span className="font-mono font-semibold text-gray-800">{orderId.slice(-6).toUpperCase()}</span>
          </p>
        )}

        {retryError && (
          <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 mt-2 mb-2">{retryError}</p>
        )}

        <div className="space-y-3 mt-4">
          {orderId ? (
            <button
              onClick={handleRetry}
              disabled={retrying}
              className="block w-full py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {retrying ? 'Redirecting to payment...' : 'Retry Payment'}
            </button>
          ) : (
            <Link
              href="/checkout"
              className="block w-full py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition"
            >
              Back to Checkout
            </Link>
          )}
          <Link
            href="/"
            className="block w-full py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
          >
            Go to Home
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutFailPage() {
  return (
    <Suspense>
      <FailContent />
    </Suspense>
  );
}
