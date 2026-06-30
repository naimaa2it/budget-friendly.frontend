"use client";

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { FaTimes, FaBell } from "react-icons/fa";

export default function WaitlistModal({ product, onClose }) {
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() && !phone.trim()) {
      setError("Please provide at least an email or phone number.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const API = process.env.NEXT_PUBLIC_API_URL || "https://api.pickob.com";
      const res = await fetch(`${API}/api/waitlist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product._id,
          productTitle: product.title || product.name,
          email: email.trim() || undefined,
          phone: phone.trim() || undefined,
        }),
      });
      if (!res.ok) throw new Error("Failed");
      setSuccess(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 transition"
          aria-label="Close"
        >
          <FaTimes />
        </button>

        {success ? (
          <div className="text-center py-6">
            <div className="text-5xl mb-4">🎉</div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">
              You&apos;re on the list!
            </h2>
            <p className="text-gray-600 mb-5">
              We&apos;ll notify you as soon as{" "}
              <span className="font-semibold">
                {product.title || product.name}
              </span>{" "}
              is back in stock.
            </p>
            <button
              onClick={onClose}
              className="bg-pink-600 text-white px-6 py-2 rounded-lg hover:bg-pink-700 font-medium transition"
            >
              Got it!
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-amber-100 rounded-full p-3">
                <FaBell className="text-amber-600 text-xl" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-800">
                  Get Notified
                </h2>
                <p className="text-sm text-gray-500">
                  We will restock very soon!
                </p>
              </div>
            </div>

            <p className="text-gray-700 mb-5 bg-amber-50 border border-amber-100 rounded-lg p-3 text-sm leading-relaxed">
              <span className="font-semibold">
                {product.title || product.name}
              </span>{" "}
              is currently{" "}
              <span className="text-red-600 font-semibold">out of stock</span>.
              Leave your email or phone number and we&apos;ll let you know the
              moment it&apos;s back!
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number{" "}
                  <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+880 1XXX-XXXXXX"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
                />
              </div>
              {error && <p className="text-red-600 text-sm">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-pink-600 text-white py-2.5 rounded-lg font-semibold hover:bg-pink-700 disabled:opacity-60 transition"
              >
                {loading ? "Joining..." : "🔔 Notify Me When Available"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>,
    document.body,
  );
}
