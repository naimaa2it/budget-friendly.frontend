"use client";

import React, { useState, useEffect } from "react";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { useLanguage } from "@/components/context/LanguageContext";

const API = process.env.NEXT_PUBLIC_API_URL || "https://api.pickob.com";

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
      className={`relative border-2 ${t.borderColor} rounded-lg px-4 py-5 bg-linear-to-br ${t.bgColor} overflow-hidden h-44`}
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
            <h2 className={`text-5xl font-bold ${t.textColor}`}>
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
            <p className="text-xs text-gray-600 leading-relaxed">
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
  const [currentSlide, setCurrentSlide] = useState(0);
  const [mobileIndex, setMobileIndex] = useState(0);
  const [offers, setOffers] = useState([]);

  useEffect(() => {
    fetch(`${API}/api/discounts`)
      .then((r) => r.json())
      .then((d) => setOffers(d.items || []))
      .catch(() => setOffers([]));
  }, []);

  const slidesToShow = 3;
  const totalSlides = Math.max(1, Math.ceil(offers.length / slidesToShow));

  // Desktop auto-play
  useEffect(() => {
    if (offers.length === 0) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % totalSlides);
    }, 5000);
    return () => clearInterval(timer);
  }, [totalSlides, offers.length]);

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % totalSlides);
  const prevSlide = () =>
    setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);

  const nextMobile = () => setMobileIndex((prev) => (prev + 1) % offers.length);
  const prevMobile = () =>
    setMobileIndex((prev) => (prev - 1 + offers.length) % offers.length);

  const visibleOffers = Array.from(
    { length: slidesToShow },
    (_, i) => offers[(currentSlide * slidesToShow + i) % offers.length],
  );

  if (offers.length === 0) return null;

  return (
    <div className="w-full max-w-7xl mx-auto px-3 md:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">
          <span className="text-red-500">{t("offers.title_highlight")}</span>{" "}
          <span className="font-normal">{t("offers.title_rest")}</span>
        </h1>
      </div>

      {/* ── Mobile slider: one card at a time (hidden on md+) ── */}
      <div className="relative md:hidden">
        <button
          onClick={prevMobile}
          className="absolute -left-4 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full w-9 h-9 flex items-center justify-center shadow-lg hover:border hover:border-red-600 transition"
        >
          <FaChevronLeft className="w-4 h-4" />
        </button>
        <button
          onClick={nextMobile}
          className="absolute -right-4 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full w-9 h-9 flex items-center justify-center shadow-lg hover:border hover:border-red-600 transition"
        >
          <FaChevronRight className="w-4 h-4" />
        </button>

        {/* Sliding track */}
        <div className="overflow-hidden rounded-lg">
          <div
            className="flex transition-transform duration-500 ease-in-out"
            style={{ transform: `translateX(-${mobileIndex * 100}%)` }}
          >
            {offers.map((offer) => (
              <div key={offer._id} className="w-full shrink-0">
                <OfferCard offer={offer} />
              </div>
            ))}
          </div>
        </div>

        {/* Dots */}
        <div className="flex justify-center gap-2 mt-4">
          {offers.map((_, index) => (
            <button
              key={index}
              onClick={() => setMobileIndex(index)}
              className={`h-2 rounded-full transition-all ${
                index === mobileIndex
                  ? "bg-red-600 w-8"
                  : "bg-gray-300 w-2 hover:bg-gray-400"
              }`}
              aria-label={`Go to offer ${index + 1}`}
            />
          ))}
        </div>
      </div>

      {/* ── Desktop slider: groups of 3 (shown on md+) ── */}
      <div className="relative hidden md:block">
        <button
          onClick={prevSlide}
          className="absolute -left-4 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full w-9 h-9 flex items-center justify-center shadow-lg hover:shadow-xl hover:border hover:border-red-600 transition"
        >
          <FaChevronLeft className="w-4 h-4" />
        </button>
        <button
          onClick={nextSlide}
          className="absolute -right-4 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full w-9 h-9 flex items-center justify-center shadow-lg hover:shadow-xl hover:border hover:border-red-600 transition"
        >
          <FaChevronRight className="w-4 h-4" />
        </button>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 transition-all duration-500">
          {visibleOffers.map((offer) => (
            <OfferCard key={offer._id} offer={offer} />
          ))}
        </div>

        <div className="flex justify-center gap-2 mt-6">
          {Array.from({ length: totalSlides }).map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`h-2 rounded-full transition-all ${
                index === currentSlide
                  ? "bg-red-600 w-8"
                  : "bg-gray-300 w-2 hover:bg-gray-400"
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
