"use client";

import React, { useState, useEffect } from "react";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { useLanguage } from "@/components/context/LanguageContext";

const API = process.env.NEXT_PUBLIC_API_URL || "https://api.pickob.com";

// How many cards visible per breakpoint
const VISIBLE = { default: 1, sm: 2, md: 4 };

function useVisibleCount() {
  const [count, setCount] = useState(VISIBLE.md);
  useEffect(() => {
    const calc = () => {
      const w = window.innerWidth;
      if (w < 640) setCount(VISIBLE.default);
      else if (w < 768) setCount(VISIBLE.sm);
      else setCount(VISIBLE.md);
    };
    calc();
    window.addEventListener("resize", calc);
    return () => window.removeEventListener("resize", calc);
  }, []);
  return count;
}

const COLOR_THEMES = {
  pink: {
    bgColor: "from-pink-50 to-white",
    textColor: "text-pink-600",
    borderColor: "border-pink-400",
  },
  blue: {
    bgColor: "from-blue-50 to-white",
    textColor: "text-blue-600",
    borderColor: "border-blue-400",
  },
  orange: {
    bgColor: "from-orange-50 to-white",
    textColor: "text-orange-600",
    borderColor: "border-orange-400",
  },
  green: {
    bgColor: "from-green-50 to-white",
    textColor: "text-green-600",
    borderColor: "border-green-400",
  },
  purple: {
    bgColor: "from-purple-50 to-white",
    textColor: "text-purple-600",
    borderColor: "border-purple-400",
  },
  red: {
    bgColor: "from-red-50 to-white",
    textColor: "text-red-600",
    borderColor: "border-red-400",
  },
  teal: {
    bgColor: "from-teal-50 to-white",
    textColor: "text-teal-600",
    borderColor: "border-teal-400",
  },
};

function CouponCopy({ code }) {
  const [copied, setCopied] = useState(false);
  const { t } = useLanguage();
  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button
      onClick={copy}
      className="mt-1 flex items-center justify-between gap-1 w-full bg-white border border-dashed border-gray-400 rounded px-2 py-0.5 text-xs font-mono font-bold text-gray-700 hover:bg-gray-50 transition"
    >
      <span className="truncate">{code}</span>
      <span className="shrink-0 text-gray-400">
        {copied ? t("offers.copied") : t("offers.copy")}
      </span>
    </button>
  );
}

function OfferCard({ offer }) {
  const { t: tr } = useLanguage();
  const t = COLOR_THEMES[offer.theme] || COLOR_THEMES.pink;
  return (
    <div
      className={`relative border-2 ${t.borderColor} rounded-lg px-4 py-5 bg-linear-to-br ${t.bgColor} overflow-hidden h-40`}
    >
      <div
        className={`absolute -top-3 left-2/3 -translate-x-1/2 w-6 h-6 bg-white border-2 ${t.borderColor} rounded-full z-10`}
      />
      <div
        className={`absolute -bottom-3 left-2/3 -translate-x-1/2 w-6 h-6 bg-white border-2 ${t.borderColor} rounded-full z-10`}
      />
      {/* Dashed divider — w-0.5 + -translate-x-1/2 centers the 2px line on the left-2/3 axis */}
      <div className="absolute left-2/3 -translate-x-1/2 top-0 bottom-0 w-0.5 border-l-2 border-dashed border-orange-300" />
      <div className="flex h-full">
        {/* Left 2/3 */}
        <div className="w-2/3 pr-4 flex flex-col justify-center">
          <p className="text-sm text-gray-600 mb-1">
            {tr("offers.spend_label")} {offer.spend}
          </p>
          {offer.highlightSecondary ? (
            <>
              <h2 className={`text-3xl font-bold ${t.textColor} mb-1`}>
                {offer.highlight}
              </h2>
              <h3 className={`text-2xl font-bold ${t.textColor}`}>
                {offer.highlightSecondary}
              </h3>
            </>
          ) : (
            <h2 className={`text-4xl font-bold ${t.textColor}`}>
              {offer.highlight}
            </h2>
          )}
          <p className="text-sm text-gray-600 mt-1">{offer.subtitle}</p>
        </div>
        {/* Right 1/3 */}
        <div className="w-1/3 pl-3 flex flex-col justify-center">
          <h3 className="text-sm font-semibold text-gray-900 mb-1">
            {offer.title}
          </h3>
          {offer.description && (
            <p className="text-[11px] text-gray-600 leading-relaxed">
              {offer.description}
            </p>
          )}
          {offer.couponCode && <CouponCopy code={offer.couponCode} />}
        </div>
      </div>
    </div>
  );
}

export default function OffersToSayYes() {
  const { t } = useLanguage();
  const [current, setCurrent] = useState(0);
  const [offers, setOffers] = useState([]);
  const visCount = useVisibleCount();

  useEffect(() => {
    fetch(`${API}/api/discounts`)
      .then((r) => r.json())
      .then((d) => setOffers(d.items || []))
      .catch(() => setOffers([]));
  }, []);

  const maxIndex = Math.max(0, offers.length - visCount);
  // Clamp during render so a visCount change never leaves us out of range
  const index = Math.min(current, maxIndex);

  // Auto-play
  useEffect(() => {
    if (offers.length <= visCount) return;
    const timer = setInterval(() => {
      setCurrent((c) => (Math.min(c, maxIndex) >= maxIndex ? 0 : c + 1));
    }, 5000);
    return () => clearInterval(timer);
  }, [maxIndex, offers.length, visCount]);

  const next = () => setCurrent(index >= maxIndex ? 0 : index + 1);
  const prev = () => setCurrent(index <= 0 ? maxIndex : index - 1);

  if (offers.length === 0) return null;

  const showArrows = offers.length > visCount;
  // Each card takes 1/visCount of the track width
  const cardPct = 100 / visCount;

  return (
    <div className="w-full max-w-7xl mx-auto px-1 md:px-2 lg:px-3 py-6 md:py-8">
      {/* Header */}
      <div className="mb-3 md:mb-6">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">
          <span className="text-red-500">{t("offers.title_highlight")}</span>{" "}
          <span className="font-normal">{t("offers.title_rest")}</span>
        </h1>
      </div>

      {/* ── Responsive slider: 1 card (mobile) / 2 (sm) / 4 (md+) ── */}
      <div className="relative">
        {showArrows && (
          <button
            onClick={prev}
            aria-label="Previous"
            className="absolute -left-2 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full w-9 h-9 flex items-center justify-center shadow-lg hover:shadow-xl hover:border hover:border-red-600 transition"
          >
            <FaChevronLeft className="w-4 h-4" />
          </button>
        )}
        {showArrows && (
          <button
            onClick={next}
            aria-label="Next"
            className="absolute -right-2 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full w-9 h-9 flex items-center justify-center shadow-lg hover:shadow-xl hover:border hover:border-red-600 transition"
          >
            <FaChevronRight className="w-4 h-4" />
          </button>
        )}

        {/* Sliding track */}
        <div className="overflow-hidden rounded-lg">
          <div
            className="flex transition-transform duration-500 ease-in-out"
            style={{ transform: `translateX(-${index * cardPct}%)` }}
          >
            {offers.map((offer) => (
              <div
                key={offer._id}
                className="shrink-0 px-1"
                style={{ width: `${cardPct}%` }}
              >
                <OfferCard offer={offer} />
              </div>
            ))}
          </div>
        </div>

        {/* Dots */}
        {showArrows && (
          <div className="flex justify-center gap-2 mt-4">
            {Array.from({ length: maxIndex + 1 }).map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`h-2 rounded-full transition-all ${
                  i === index
                    ? "bg-red-600 w-8"
                    : "bg-gray-300 w-2 hover:bg-gray-400"
                }`}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
