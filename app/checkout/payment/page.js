"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useStoreSettings } from "@/components/context/StoreSettingsContext";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const STEP = { NUMBER: 1, TXID: 2, PROCESSING: 3 };

// ── Brand logos ──────────────────────────────────────────────────────────────

function BkashLogo() {
  return (
    <div className="flex items-center justify-center gap-2.5">
      <span
        className="text-4xl font-black leading-none tracking-tight"
        style={{
          color: "#E2136E",
          fontFamily: "'Noto Serif Bengali', Georgia, serif",
        }}
      >
        বিকাশ
      </span>
      {/* origami crane */}
      <svg width="44" height="40" viewBox="0 0 44 40" fill="none">
        <path d="M22 3 L36 15 L26 20 Z" fill="#E2136E" />
        <path d="M36 15 L44 8 L37 20 Z" fill="#C0105A" />
        <path d="M26 20 L36 15 L33 31 Z" fill="#E2136E" opacity="0.82" />
      </svg>
    </div>
  );
}

function NagadLogo() {
  return (
    <div className="flex items-center justify-center gap-2">
      {/* flame */}
      <svg width="32" height="40" viewBox="0 0 32 40" fill="none">
        <path
          d="M16 38C16 38 2 28 5 18C7 11 11 14 11 14C11 14 9 7 14 2C14 2 11 13 18 16C18 16 20 8 26 11C32 14 26 22 23 24C23 24 30 20 27 27C25 31 21 38 16 38Z"
          fill="#F16821"
        />
      </svg>
      <span
        className="text-4xl font-black leading-none"
        style={{
          color: "#F16821",
          fontFamily: "'Noto Serif Bengali', Georgia, serif",
        }}
      >
        নগদ
      </span>
    </div>
  );
}

function RocketLogo() {
  return (
    <div className="flex items-center justify-center gap-2.5">
      {/* rocket */}
      <svg width="30" height="42" viewBox="0 0 30 42" fill="none">
        <ellipse cx="15" cy="17" rx="6" ry="12" fill="#8B2FC9" />
        <path
          d="M9 24C4 22 3 16 9 12"
          stroke="#8B2FC9"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M21 24C26 22 27 16 21 12"
          stroke="#8B2FC9"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
        />
        <path d="M12 29L9 40L15 36L21 40L18 29" fill="#8B2FC9" opacity="0.72" />
        <circle cx="15" cy="16" r="4" fill="white" opacity="0.45" />
      </svg>
      <span
        className="text-4xl font-black leading-none"
        style={{ color: "#8B2FC9" }}
      >
        Rocket
      </span>
    </div>
  );
}

const LOGOS = { bkash: BkashLogo, nagad: NagadLogo, rocket: RocketLogo };

// ── Config ───────────────────────────────────────────────────────────────────

const CONFIG = {
  bkash: {
    brand: "#E2136E",
    name: "bKash",
    bangla: "বিকাশ",
    numberLabel: "Your bKash Account Number",
    txLabel: "bKash Transaction ID",
    txPlaceholder: "e.g. 8M3X5K9P2Q",
    hotline: "16247",
    footer: "© 2026 bKash, All Rights Reserved",
  },
  nagad: {
    brand: "#F16821",
    name: "Nagad",
    bangla: "নগদ",
    numberLabel: "Your Nagad Account Number",
    txLabel: "Nagad Transaction ID",
    txPlaceholder: "e.g. NAG1234567890",
    hotline: "16167",
    footer: "© 2026 Nagad, All Rights Reserved",
  },
  rocket: {
    brand: "#8B2FC9",
    name: "Rocket",
    bangla: "রকেট",
    numberLabel: "Your Rocket Account Number",
    txLabel: "Rocket Transaction ID",
    txPlaceholder: "e.g. TXN1234567890",
    hotline: "16216",
    footer: "© 2026 Dutch-Bangla Bank Limited",
  },
};

// ── Page inner ───────────────────────────────────────────────────────────────

function PaymentPageInner() {
  const params = useSearchParams();
  const router = useRouter();
  const { storeName } = useStoreSettings();

  const orderId = params.get("orderId") || "";
  const method = params.get("method") || "bkash";
  const amount = Number(params.get("amount") || 0);
  const merchant = params.get("merchant") || "";

  const cfg = CONFIG[method] || CONFIG.bkash;
  const Logo = LOGOS[method] || LOGOS.bkash;

  const [step, setStep] = useState(STEP.NUMBER);
  const [senderNumber, setSenderNumber] = useState("");
  const [txId, setTxId] = useState("");
  const [countdown, setCountdown] = useState(3);
  const [txError, setTxError] = useState("");
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [switching, setSwitching] = useState(false);
  const submitted = useRef(false);

  const handleSwitchToCOD = async () => {
    setSwitching(true);
    try {
      await fetch(`${API}/api/orders/${orderId}/switch-to-cod`, {
        method: "PATCH",
        credentials: "include",
      });
    } catch {}
    router.push(`/checkout/success?orderId=${orderId}&method=cash-on-delivery`);
  };

  // countdown + auto-submit on step 3
  useEffect(() => {
    if (step !== STEP.PROCESSING) return;
    if (countdown > 0) {
      const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
      return () => clearTimeout(t);
    }
    if (submitted.current) return;
    submitted.current = true;
    fetch(`${API}/api/orders/${orderId}/mobile-payment`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        senderNumber: senderNumber.trim(),
        transactionId: txId.trim(),
      }),
    })
      .catch(() => {})
      .finally(() => {
        router.push(`/checkout/success?orderId=${orderId}&method=${method}`);
      });
  }, [step, countdown, orderId, method, senderNumber, txId, router]);

  return (
    <div className="min-h-screen bg-gray-200 flex items-center justify-center p-4">
      <div className="relative w-full max-w-90 bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* ════════════════════════════════════════════════════
            STEP 1 — Account number  (like Rokomari/image-2)
            ════════════════════════════════════════════════════ */}
        {step === STEP.NUMBER && (
          <>
            {/* White logo header */}
            <div className="bg-white pt-8 pb-5 px-6 flex justify-center border-b border-gray-100">
              <Logo />
            </div>

            {/* Merchant row */}
            <div className="flex items-center gap-3 px-5 py-3 border-b border-gray-100">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                style={{ backgroundColor: cfg.brand }}
              >
                YH
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800 leading-tight">
                  {storeName || "Store"}
                </p>
              </div>
            </div>

            {/* Brand-colored input section */}
            <div className="px-5 py-5" style={{ backgroundColor: cfg.brand }}>
              <p className="text-white text-sm font-semibold mb-3">
                {cfg.numberLabel}
              </p>
              <input
                type="tel"
                value={senderNumber}
                onChange={(e) => setSenderNumber(e.target.value)}
                placeholder="e.g 01XXXXXXXXXX"
                className="w-full rounded-sm px-4 py-3 text-white text-sm font-medium focus:outline-none placeholder-gray-400 shadow-sm bg-white"
              />
              <p className="text-white/80 text-xs mt-3">
                Confirm and proceed,{" "}
                <span className="underline cursor-pointer">
                  terms &amp; conditions
                </span>
              </p>
            </div>

            {/* Cancel | Confirm buttons */}
            <div className="grid grid-cols-2 divide-x divide-gray-200  border-gray-200">
              <button
                onClick={() => setShowCancelConfirm(true)}
                className="py-4 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={() => setStep(STEP.TXID)}
                className="py-4 text-sm font-bold text-white transition active:opacity-80"
                style={{ backgroundColor: cfg.brand }}
              >
                Confirm
              </button>
            </div>

            {/* Hotline + footer */}
            <div className="pt-2 pb-4 text-center border-t border-gray-100">
              <div
                className="flex items-center justify-center gap-1.5 mt-2"
                style={{ color: cfg.brand }}
              >
                <svg
                  className="w-3.5 h-3.5"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
                </svg>
                <span className="text-xs font-semibold">{cfg.hotline}</span>
              </div>
              <p className="text-[10px] text-gray-400 mt-1">{cfg.footer}</p>
            </div>
          </>
        )}

        {/* ════════════════════════════════════════════════════
            STEP 2 — Instructions + Transaction ID
            ════════════════════════════════════════════════════ */}
        {step === STEP.TXID && (
          <>
            {/* Brand-colored compact header */}
            <div
              className="px-5 pt-5 pb-4"
              style={{ backgroundColor: cfg.brand }}
            >
              <div className="flex items-center justify-between">
                <span
                  className="text-2xl font-black text-white"
                  style={{ fontFamily: "'Noto Serif Bengali', Georgia, serif" }}
                >
                  {cfg.bangla}
                </span>
                <span className="text-white/70 text-xs">
                  {cfg.name} Payment
                </span>
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-white/80 text-xs">
                  Order #{orderId.slice(-8).toUpperCase()}
                </span>
                <span className="text-white font-bold text-lg">
                  ৳{amount.toLocaleString("en-BD")}
                </span>
              </div>
            </div>

            <div className="px-5 py-4">
              {/* Step-by-step instruction box */}
              {merchant ? (
                <div
                  className="rounded-xl border-2 p-4 mb-4"
                  style={{
                    borderColor: cfg.brand + "40",
                    backgroundColor: cfg.brand + "08",
                  }}
                >
                  <p
                    className="text-xs font-bold mb-2.5 flex items-center gap-1.5"
                    style={{ color: cfg.brand }}
                  >
                    <svg
                      className="w-3.5 h-3.5 shrink-0"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                    </svg>
                    কিভাবে পেমেন্ট করবেন
                  </p>
                  <ol className="space-y-1.5">
                    {[
                      `আপনার ${cfg.name} অ্যাপ খুলুন`,
                      <>
                        Send Money &rarr;{" "}
                        <span className="font-bold tracking-wider">
                          {merchant}
                        </span>
                      </>,
                      <>
                        Amount:{" "}
                        <span
                          className="font-bold"
                          style={{ color: cfg.brand }}
                        >
                          ৳{amount.toLocaleString("en-BD")}
                        </span>
                      </>,
                      "Transaction ID সংরক্ষণ করুন",
                    ].map((txt, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2 text-xs text-gray-600"
                      >
                        <span
                          className="w-4 h-4 rounded-full text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5"
                          style={{ backgroundColor: cfg.brand }}
                        >
                          {i + 1}
                        </span>
                        <span>{txt}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              ) : (
                <div className="rounded-xl p-3 mb-4 bg-amber-50 border border-amber-200 text-xs text-amber-700 text-center">
                  Merchant number not configured. Please contact support.
                </div>
              )}

              {/* TxID input */}
              <label
                className="block text-xs font-bold mb-1.5 uppercase tracking-wide"
                style={{ color: cfg.brand }}
              >
                {cfg.txLabel} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={txId}
                onChange={(e) => {
                  setTxId(e.target.value);
                  setTxError("");
                }}
                placeholder={cfg.txPlaceholder}
                className="w-full border-2 rounded-xl px-4 py-3 text-sm focus:outline-none transition-colors"
                style={{ borderColor: txId ? cfg.brand : "#e5e7eb" }}
              />
              {txError && (
                <p className="text-red-500 text-xs mt-1.5">{txError}</p>
              )}

              <p className="text-[11px] text-gray-400 mt-3 text-center leading-relaxed">
                পেমেন্ট করার পর Transaction ID দিয়ে Confirm করুন।
                <br />
                আমরা verify করে order process করব।
              </p>
            </div>

            {/* Back | Confirm */}
            <div className="grid grid-cols-2 divide-x divide-gray-200 border-t border-gray-200">
              <button
                onClick={() => setShowCancelConfirm(true)}
                className="py-4 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (!txId.trim()) {
                    setTxError("Transaction ID দিন।");
                    return;
                  }
                  setStep(STEP.PROCESSING);
                  setCountdown(3);
                }}
                className="py-4 text-sm font-bold text-white transition active:opacity-80"
                style={{ backgroundColor: cfg.brand }}
              >
                Confirm
              </button>
            </div>

            <div className="py-3 text-center border-t border-gray-100">
              <p className="text-[10px] text-gray-400">{cfg.footer}</p>
            </div>
          </>
        )}

        {/* ════════════════════════════════════════════════════
            STEP 3 — Processing / countdown
            ════════════════════════════════════════════════════ */}
        {step === STEP.PROCESSING && (
          <div
            className="flex flex-col items-center justify-center py-20 px-6"
            style={{ backgroundColor: cfg.brand, minHeight: "380px" }}
          >
            {/* Spinner ring with countdown number inside */}
            <div className="relative w-24 h-24 mb-7">
              {/* Static dim ring */}
              <div className="absolute inset-0 rounded-full border-4 border-white opacity-20" />
              {/* Spinning ring */}
              <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-white animate-spin" />
              {/* Countdown */}
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-white text-3xl font-black">
                  {countdown}
                </span>
              </div>
            </div>

            <p className="text-white text-xl font-bold mb-1.5">
              Verifying Payment
            </p>
            <p className="text-white/75 text-sm">Please wait…</p>

            {/* brand bangla name faint */}
            <p
              className="mt-10 text-5xl font-black opacity-20 select-none"
              style={{ fontFamily: "'Noto Serif Bengali', Georgia, serif" }}
            >
              {cfg.bangla}
            </p>
          </div>
        )}
        {/* ════════════════════════════════════════════════════
            Cancel confirmation overlay
            ════════════════════════════════════════════════════ */}
        {showCancelConfirm && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-20 rounded-2xl">
            <div className="bg-white mx-4 rounded-2xl shadow-xl overflow-hidden w-full max-w-xs">
              {/* Header */}
              <div className="px-5 py-4 border-b border-gray-100 text-center relative">
                {/* X close button */}
                <button
                  onClick={() => setShowCancelConfirm(false)}
                  className="absolute top-3 right-3 w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-600 transition"
                  aria-label="Close"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                  </svg>
                </div>
                <h3 className="font-bold text-gray-800 text-base">কী করতে চান?</h3>
                <p className="text-xs text-gray-500 mt-1">{cfg.name} payment বাতিল করবেন?</p>
              </div>

              {/* Options */}
              <div className="p-4 flex flex-col gap-2.5">
                {/* Option 1: stay and pay */}
                <button
                  onClick={() => setShowCancelConfirm(false)}
                  disabled={switching}
                  className="w-full py-3 rounded-xl border-2 text-sm font-semibold transition disabled:opacity-50"
                  style={{ borderColor: cfg.brand, color: cfg.brand }}
                >
                  না, {cfg.name} দিয়েই পেমেন্ট করব
                </button>

                {/* Option 2: switch to COD */}
                <button
                  onClick={handleSwitchToCOD}
                  disabled={switching}
                  className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold transition disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {switching ? (
                    <>
                      <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      সেভ হচ্ছে…
                    </>
                  ) : (
                    "Cash on Delivery তে পরিবর্তন করুন"
                  )}
                </button>

                {/* Option 3: leave without switching */}
                <button
                  onClick={() => router.push("/")}
                  disabled={switching}
                  className="w-full py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm font-medium transition disabled:opacity-50"
                >
                  Home এ ফিরে যাই
                </button>
              </div>

              <p className="text-[10px] text-gray-400 text-center pb-3 px-4">
                Home এ গেলেও অর্ডারটি সেভ থাকবে — My Orders থেকে দেখতে পারবেন।
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Export ───────────────────────────────────────────────────────────────────

export default function PaymentPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-200 flex items-center justify-center">
          <div className="text-gray-400 text-sm">Loading…</div>
        </div>
      }
    >
      <PaymentPageInner />
    </Suspense>
  );
}
