"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useUser } from "@/components/context/UserContext";
import { useCart } from "@/components/context/CartContext";
import AuthModal from "@/components/auth/AuthModal";
import {
  FaTicketAlt,
  FaCheckCircle,
  FaCopy,
  FaClock,
  FaUser,
  FaShoppingCart,
  FaLock,
  FaGift,
} from "react-icons/fa";
import { useLanguage } from "@/components/context/LanguageContext";

const API = process.env.NEXT_PUBLIC_API_URL || "https://api.pickob.com";

const COLOR_THEMES = {
  pink: {
    bgColor: "from-pink-50 to-white",
    textColor: "text-pink-600",
    borderColor: "border-pink-400",
    badgeBg: "bg-pink-50",
    badgeText: "text-pink-700",
    badgeBorder: "border-pink-300",
    progressBg: "bg-pink-500",
  },
  blue: {
    bgColor: "from-blue-50 to-white",
    textColor: "text-blue-600",
    borderColor: "border-blue-400",
    badgeBg: "bg-blue-50",
    badgeText: "text-blue-700",
    badgeBorder: "border-blue-300",
    progressBg: "bg-blue-500",
  },
  orange: {
    bgColor: "from-orange-50 to-white",
    textColor: "text-orange-600",
    borderColor: "border-orange-400",
    badgeBg: "bg-orange-50",
    badgeText: "text-orange-700",
    badgeBorder: "border-orange-300",
    progressBg: "bg-orange-500",
  },
  green: {
    bgColor: "from-green-50 to-white",
    textColor: "text-green-600",
    borderColor: "border-green-400",
    badgeBg: "bg-green-50",
    badgeText: "text-green-700",
    badgeBorder: "border-green-300",
    progressBg: "bg-green-500",
  },
  purple: {
    bgColor: "from-purple-50 to-white",
    textColor: "text-purple-600",
    borderColor: "border-purple-400",
    badgeBg: "bg-purple-50",
    badgeText: "text-purple-700",
    badgeBorder: "border-purple-300",
    progressBg: "bg-purple-500",
  },
  red: {
    bgColor: "from-red-50 to-white",
    textColor: "text-red-600",
    borderColor: "border-red-400",
    badgeBg: "bg-red-50",
    badgeText: "text-red-700",
    badgeBorder: "border-red-300",
    progressBg: "bg-red-500",
  },
  teal: {
    bgColor: "from-teal-50 to-white",
    textColor: "text-teal-600",
    borderColor: "border-teal-400",
    badgeBg: "bg-teal-50",
    badgeText: "text-teal-700",
    badgeBorder: "border-teal-300",
    progressBg: "bg-teal-500",
  },
};

function CouponCard({ coupon, cartSubtotal = 0 }) {
  const [copied, setCopied] = useState(false);
  const { t: tr } = useLanguage();
  const t = COLOR_THEMES[coupon.theme] || COLOR_THEMES.pink;

  const copy = () => {
    navigator.clipboard.writeText(coupon.couponCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isUnlocked = !coupon.progress || coupon.progress.remaining <= 0;
  const progressPercent = coupon.progress?.percentage || 100;

  return (
    <div
      className={`relative border-2 ${t.borderColor} rounded-xl bg-gradient-to-br ${t.bgColor} overflow-hidden ${!coupon.eligible ? "opacity-60" : ""}`}
    >
      {/* Top notch */}
      <div
        className={`absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 bg-white border-2 ${t.borderColor} rounded-full z-10`}
      />

      {/* Eligibility badge */}
      {coupon.canApply && (
        <div className="absolute top-2 right-2 z-10">
          <span className="bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
            <FaCheckCircle className="w-3 h-3" /> {tr("coupons.ready")}
          </span>
        </div>
      )}

      {/* Offer details */}
      <div className="px-5 pt-6 pb-4">
        <p className="text-xs text-gray-500 mb-1">
          {coupon.spend || `Min. ৳${coupon.minOrderAmount || 0}`}
        </p>
        <div
          className={`text-4xl font-extrabold ${t.textColor} leading-tight mb-1`}
        >
          {coupon.highlight}
          {coupon.highlightSecondary && (
            <span className="block text-3xl">{coupon.highlightSecondary}</span>
          )}
        </div>
        <p className="text-sm font-semibold text-gray-800 mt-1">
          {coupon.title}
        </p>
        {coupon.description && (
          <p className="text-xs text-gray-500 mt-0.5">{coupon.description}</p>
        )}

        {/* Tags */}
        <div className="flex flex-wrap gap-1 mt-2">
          {coupon.isNewUserOnly && (
            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full flex items-center gap-1">
              <FaUser className="w-2.5 h-2.5" /> New Users
            </span>
          )}
          {coupon.isFirstOrderOnly && (
            <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full flex items-center gap-1">
              <FaGift className="w-2.5 h-2.5" /> First Order
            </span>
          )}
          {coupon.stackable && (
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
              allowMultiple
            </span>
          )}
          {coupon.expiresAt && (
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full flex items-center gap-1">
              <FaClock className="w-2.5 h-2.5" />
              {tr("coupons.expires")}{" "}
              {new Date(coupon.expiresAt).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>

      {/* Progress bar (if not yet unlocked) */}
      {coupon.progress && coupon.progress.remaining > 0 && (
        <div className="px-5 pb-3">
          <div className="flex justify-between text-xs text-gray-600 mb-1">
            <span>{coupon.progress.message}</span>
            <span>{Math.round(progressPercent)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`${t.progressBg} h-2 rounded-full transition-all duration-300`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Dashed separator */}
      <div className={`border-t-2 border-dashed ${t.borderColor} mx-0`} />

      {/* Bottom notch */}
      <div
        className={`absolute -bottom-3 left-1/2 -translate-x-1/2 w-6 h-6 bg-white border-2 ${t.borderColor} rounded-full z-10`}
      />

      {/* Coupon code section */}
      <div className="px-5 py-4">
        {!coupon.eligible ? (
          <div className="flex items-center gap-2 text-gray-500 text-sm">
            <FaLock className="shrink-0" />
            <span>{coupon.eligibilityReason}</span>
          </div>
        ) : (
          <>
            <p className="text-xs text-gray-500 mb-2">
              {isUnlocked
                ? tr("coupons.use_at_checkout")
                : tr("coupons.add_more")}
            </p>
            <button
              onClick={copy}
              disabled={!isUnlocked}
              className={`w-full flex items-center justify-between gap-3 border-2 border-dashed ${t.badgeBorder} ${t.badgeBg} rounded-lg px-4 py-2.5 transition ${isUnlocked ? "hover:opacity-80 cursor-pointer" : "cursor-not-allowed opacity-70"}`}
            >
              <span
                className={`text-lg font-mono font-extrabold tracking-widest ${t.badgeText}`}
              >
                {coupon.couponCode}
              </span>
              <span
                className={`text-xs font-semibold shrink-0 px-2 py-1 rounded-md bg-white border ${t.badgeBorder} ${t.badgeText} transition flex items-center gap-1`}
              >
                {copied ? (
                  <>
                    <FaCheckCircle className="w-3 h-3" /> {tr("coupons.copied")}
                  </>
                ) : (
                  <>
                    <FaCopy className="w-3 h-3" /> {tr("coupons.copy")}
                  </>
                )}
              </span>
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function CouponsPage() {
  const { user } = useUser();
  const { cartItems } = useCart();
  const { t } = useLanguage();
  const [data, setData] = useState({
    eligible: [],
    other: [],
    almostUnlocked: [],
  });
  const [loading, setLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Calculate cart subtotal
  const cartSubtotal = cartItems.reduce((sum, item) => {
    const price = item.product?.price || 0;
    return sum + price * item.quantity;
  }, 0);

  useEffect(() => {
    const fetchCoupons = async () => {
      try {
        const resp = await fetch(
          `${API}/api/coupons?subtotal=${cartSubtotal}`,
          {
            credentials: "include",
          },
        );
        const result = await resp.json();
        setData(result);
      } catch (err) {
        console.error("Failed to fetch coupons:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCoupons();
  }, [cartSubtotal]);

  const readyToUse = data.eligible?.filter((c) => c.canApply) || [];
  const almostUnlocked = data.almostUnlocked || [];
  const otherEligible =
    data.eligible?.filter(
      (c) => !c.canApply && !almostUnlocked.some((a) => a._id === c._id),
    ) || [];

  // All coupons combined for the "All Coupons" section
  const allCoupons = [...(data.eligible || []), ...(data.other || [])];

  // View mode state
  const [viewMode, setViewMode] = useState("smart"); // 'smart' or 'all'

  return (
    <div className="w-full max-w-6xl mx-auto px-2 md:px-4 lg:px-6 py-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <FaTicketAlt className="text-red-500" />
          <span>{t("coupons.title")}</span>
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {user ? (
            <>{t("coupons.desc")}</>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setShowAuthModal(true)}
                className="text-blue-600 underline"
              >
                {t("nav.login")}
              </button>{" "}
              {t("coupons.login_msg")}
            </>
          )}
        </p>
      </div>

      {/* User status banner */}
      {user && (
        <div className="mb-6 flex flex-wrap gap-3">
          {data.isNewUser && (
            <div className="flex items-center gap-2 bg-purple-50 text-purple-700 px-4 py-2 rounded-lg text-sm">
              <FaUser />
              <span>
                <strong>New User!</strong> You&apos;re eligible for new user
                discounts.
              </span>
            </div>
          )}
          {data.isFirstOrder && (
            <div className="flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-lg text-sm">
              <FaGift />
              <span>
                <strong>First Order!</strong> Special discounts await you.
              </span>
            </div>
          )}
          {cartSubtotal > 0 && (
            <div className="flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-lg text-sm">
              <FaShoppingCart />
              <span>
                {t("coupons.cart_subtotal")}{" "}
                <strong>৳{cartSubtotal.toFixed(0)}</strong>
              </span>
            </div>
          )}
        </div>
      )}

      {/* View Mode Toggle */}
      <div className="mb-6 flex items-center gap-2">
        <span className="text-sm text-gray-500">View:</span>
        <button
          onClick={() => setViewMode("smart")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            viewMode === "smart"
              ? "bg-red-600 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          {t("coupons.smart_view")}
        </button>
        <button
          onClick={() => setViewMode("all")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            viewMode === "all"
              ? "bg-red-600 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          {t("coupons.all_coupons")} ({allCoupons.length})
        </button>
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-64 rounded-xl bg-gray-100 animate-pulse"
            />
          ))}
        </div>
      ) : viewMode === "all" ? (
        /* All Coupons View */
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-gray-800">
            {t("coupons.all_coupons")}
          </h2>
          {allCoupons.length === 0 ? (
            <div className="text-center py-20 border-2 border-dashed border-gray-200 rounded-xl text-gray-400">
              <FaTicketAlt className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">{t("coupons.no_coupons")}</p>
              <p className="text-sm mt-1">{t("coupons.check_back")}</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {allCoupons.map((coupon) => (
                <CouponCard
                  key={coupon._id}
                  coupon={coupon}
                  cartSubtotal={cartSubtotal}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Smart View - categorized sections */
        <div className="space-y-10">
          {/* Ready to Use */}
          {readyToUse.length > 0 && (
            <section>
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <FaCheckCircle className="text-green-500" />
                {t("coupons.ready_to_use")}
              </h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {readyToUse.map((coupon) => (
                  <CouponCard
                    key={coupon._id}
                    coupon={coupon}
                    cartSubtotal={cartSubtotal}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Almost Unlocked */}
          {almostUnlocked.length > 0 && (
            <section>
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <FaGift className="text-orange-500" />
                {t("coupons.almost_unlocked")}
              </h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {almostUnlocked.map((coupon) => (
                  <CouponCard
                    key={coupon._id}
                    coupon={coupon}
                    cartSubtotal={cartSubtotal}
                  />
                ))}
              </div>
            </section>
          )}

          {/* More Coupons */}
          {otherEligible.length > 0 && (
            <section>
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                {t("coupons.more_for_you")}
              </h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {otherEligible.map((coupon) => (
                  <CouponCard
                    key={coupon._id}
                    coupon={coupon}
                    cartSubtotal={cartSubtotal}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Unavailable Coupons */}
          {data.other?.length > 0 && (
            <section>
              <h2 className="text-xl font-bold text-gray-500 mb-4">
                {t("coupons.other_coupons")}
              </h2>
              <p className="text-sm text-gray-400 mb-4">
                {t("coupons.requirements_msg")}
              </p>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {data.other.map((coupon) => (
                  <CouponCard
                    key={coupon._id}
                    coupon={coupon}
                    cartSubtotal={cartSubtotal}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Empty state for smart view */}
          {data.eligible?.length === 0 && data.other?.length === 0 && (
            <div className="text-center py-20 border-2 border-dashed border-gray-200 rounded-xl text-gray-400">
              <FaTicketAlt className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">{t("coupons.no_coupons")}</p>
              <p className="text-sm mt-1">{t("coupons.check_back")}</p>
            </div>
          )}
        </div>
      )}

      {/* CTA to checkout */}
      {cartItems.length > 0 && readyToUse.length > 0 && (
        <div className="mt-10 text-center">
          <Link
            href="/checkout"
            className="inline-flex items-center gap-2 px-8 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold transition"
          >
            <FaShoppingCart />
            {t("coupons.apply_checkout")}
          </Link>
        </div>
      )}

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </div>
  );
}
