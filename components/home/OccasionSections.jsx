"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { useLanguage } from "@/components/context/LanguageContext";
import { cdnImageUrl } from "@/lib/cdnImage";

// How many cards visible per breakpoint (used for step calculation)
const VISIBLE = { default: 2, sm: 3, md: 4, lg: 5 };

function useVisibleCount() {
  const [count, setCount] = useState(VISIBLE.lg);
  useEffect(() => {
    const calc = () => {
      const w = window.innerWidth;
      if (w < 640) setCount(VISIBLE.default);
      else if (w < 768) setCount(VISIBLE.sm);
      else if (w < 1024) setCount(VISIBLE.md);
      else setCount(VISIBLE.lg);
    };
    calc();
    window.addEventListener("resize", calc);
    return () => window.removeEventListener("resize", calc);
  }, []);
  return count;
}

function OccasionSlider({ section }) {
  const cards = section.cards || [];
  const visCount = useVisibleCount();
  const maxIndex = Math.max(0, cards.length - visCount);
  const [current, setCurrent] = useState(0);
  const paused = useRef(false);
  const timerRef = useRef(null);

  const next = useCallback(
    () => setCurrent((c) => (c >= maxIndex ? 0 : c + 1)),
    [maxIndex],
  );
  const prev = useCallback(
    () => setCurrent((c) => (c <= 0 ? maxIndex : c - 1)),
    [maxIndex],
  );

  // Auto-advance
  useEffect(() => {
    if (cards.length <= visCount) return;
    timerRef.current = setInterval(() => {
      if (!paused.current) next();
    }, 3000);
    return () => clearInterval(timerRef.current);
  }, [next, cards.length, visCount]);

  // Clamp current when visCount changes
  useEffect(() => {
    setCurrent((c) => Math.min(c, maxIndex));
  }, [maxIndex]);

  const showArrows = cards.length > visCount;
  // Each card takes 1/visCount of the track width
  const cardPct = 100 / visCount;
  const translateX = current * cardPct;

  return (
    <div
      className="relative"
      onMouseEnter={() => {
        paused.current = true;
      }}
      onMouseLeave={() => {
        paused.current = false;
      }}
    >
      {/* Left arrow */}
      {showArrows && (
        <button
          onClick={prev}
          aria-label="Previous"
          className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 z-10 w-9 h-9 rounded-full bg-white shadow-md border border-gray-200 flex items-center justify-center text-gray-600 hover:border hover:border-red-600 transition-colors"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
      )}

      {/* Right arrow */}
      {showArrows && (
        <button
          onClick={next}
          aria-label="Next"
          className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 z-10 w-9 h-9 rounded-full bg-white shadow-md border border-gray-200 flex items-center justify-center text-gray-600 hover:border hover:border-red-600 transition-colors"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      )}

      {/* Track wrapper — hides overflow */}
      <div className="overflow-hidden">
        <div
          className="flex transition-transform duration-500 ease-in-out"
          style={{ transform: `translateX(-${translateX}%)` }}
        >
          {cards.map((card, idx) => (
            <div
              key={card._id || idx}
              className="flex-shrink-0 px-2"
              style={{ width: `${cardPct}%` }}
            >
              <Link href={card.link || "#"} className="group block h-full">
                {/* Fixed-height card */}
                <div className="border border-gray-200 rounded-xl overflow-hidden  shadow-sm hover:shadow-md transition-shadow flex flex-col h-full">
                  {/* Image — fixed height */}
                  <div className="w-full h-40  overflow-hidden flex-shrink-0">
                    {card.image?.url ? (
                      <img
                        src={cdnImageUrl(card.image.url, 640)}
                        alt={card.label}
                        className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300 text-3xl">
                        🎁
                      </div>
                    )}
                  </div>

                  {/* Subtitle — fixed height so all cards align */}
                  <div className="px-3 py-2 flex-1 flex items-center justify-center bg-[#FFF5ED]">
                    <p className="text-xs text-gray-500 text-center leading-relaxed line-clamp-2">
                      {card.subtitle || "\u00A0"}
                    </p>
                  </div>

                  {/* Label bar */}
                  <div className="bg-[#FFE3CC] text-red-600 text-xs sm:text-sm font-semibold text-center py-2 px-2 truncate group-hover:bg-[#fed0ab] transition-colors flex-shrink-0">
                    {card.label || "\u00A0"}
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* Dot indicators */}
      {showArrows && (
        <div className="flex justify-center gap-1.5 mt-3">
          {Array.from({ length: maxIndex + 1 }).map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`w-1.5 h-1.5 rounded-full transition-all ${i === current ? "bg-[#fd9d4f] w-4" : "bg-gray-300"}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function OccasionSections() {
  const API = process.env.NEXT_PUBLIC_API_URL || "https://api.pickob.com";
  const { t, lang } = useLanguage();
  const [sections, setSections] = useState([]);

  useEffect(() => {
    fetch(`${API}/api/occasions`)
      .then((r) => r.json())
      .then((b) => setSections(b.items || []))
      .catch(() => {});
  }, [API]);

  if (!sections.length) return null;

  return (
    <div className="space-y-10 px-3 md:px-6 max-w-screen-xl mx-auto py-6">
      {sections.map((section) => (
        <div key={section._id}>
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg md:text-3xl font-bold text-gray-900">
              {lang === "bn" ? section.titleBn || section.title : section.title}
            </h2>
            {section.viewAllLink && section.viewAllLink !== "/" && (
              <Link
                href={section.viewAllLink}
                className="text-md  text-rose-500 font-semibold hover:underline whitespace-nowrap"
              >
                {t("home.view_all")}
              </Link>
            )}
          </div>

          <OccasionSlider section={section} />
        </div>
      ))}
    </div>
  );
}
