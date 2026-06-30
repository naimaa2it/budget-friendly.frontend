"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import ProductCard from "@/components/product/ProductCard";
import { useLanguage } from "@/components/context/LanguageContext";

// Returns how many cards fit at the current viewport width
function useVisibleCount() {
  const [count, setCount] = useState(2);
  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      if (w >= 1280) setCount(5);
      else if (w >= 1024) setCount(4);
      else if (w >= 768) setCount(3);
      else if (w >= 540) setCount(2);
      else setCount(2);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  return count;
}

function FeaturedSlider({ products }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const visibleCount = useVisibleCount();
  const maxIndex = Math.max(0, products.length - visibleCount);
  const autoRef = useRef(null);

  const startAuto = useCallback(() => {
    clearInterval(autoRef.current);
    autoRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
    }, 4000);
  }, [maxIndex]);

  useEffect(() => {
    startAuto();
    return () => clearInterval(autoRef.current);
  }, [startAuto]);

  const go = (dir) => {
    setCurrentIndex((prev) => {
      const next = prev + dir;
      if (next < 0) return maxIndex;
      if (next > maxIndex) return 0;
      return next;
    });
    startAuto();
  };

  const dots = Array.from({ length: maxIndex + 1 });
  const pct = 100 / visibleCount;

  return (
    <div
      className="relative"
      onMouseEnter={() => clearInterval(autoRef.current)}
      onMouseLeave={startAuto}
    >
      {/* Left arrow */}
      {maxIndex > 0 && (
        <button
          onClick={() => go(-1)}
          className="absolute left-1 sm:left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white shadow-md rounded-full flex items-center justify-center text-gray-600 hover:bg-rose-600 hover:text-white transition sm:-translate-x-4"
          aria-label="Previous"
        >
          ‹
        </button>
      )}

      {/* Track */}
      <div className="overflow-hidden">
        <div
          className="flex transition-transform duration-500 ease-in-out"
          style={{ transform: `translateX(-${currentIndex * pct}%)` }}
        >
          {products.map((product, i) => (
            <div
              key={product._id || i}
              className="shrink-0 px-2 h-90"
              style={{ width: `${pct}%` }}
            >
              <ProductCard
                product={product}
                showDiscount={true}
                maxTags={2}
                showActionsOnHover={true}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Right arrow */}
      {maxIndex > 0 && (
        <button
          onClick={() => go(1)}
          className="absolute right-1 sm:right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white shadow-md rounded-full flex items-center justify-center text-gray-600 hover:bg-rose-600 hover:text-white transition sm:translate-x-4"
          aria-label="Next"
        >
          ›
        </button>
      )}

      {/* Dots */}
      {dots.length > 1 && (
        <div className="flex justify-center gap-1.5 mt-4">
          {dots.map((_, i) => (
            <button
              key={i}
              onClick={() => {
                setCurrentIndex(i);
                startAuto();
              }}
              className={`w-2 h-2 rounded-full transition-all ${i === currentIndex ? "bg-rose-600 w-4" : "bg-gray-300"}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function FeaturedSections() {
  const API = process.env.NEXT_PUBLIC_API_URL || "https://api.pickob.com";
  const { t, lang } = useLanguage();
  const [sections, setSections] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch(`${API}/api/featured`)
      .then((r) => r.json())
      .then((b) =>
        setSections(
          (b.items || []).filter((s) => s.products && s.products.length > 0),
        ),
      )
      .catch(() => setSections([]))
      .finally(() => setLoaded(true));
  }, [API]);

  if (!loaded || sections.length === 0) return null;

  return (
    <section className="w-full py-6 space-y-10 bg-[#FFF5ED]">
      {sections.map((sec) => (
        <div key={sec._id} className="max-w-7xl mx-auto px-2">
          {/* Section header */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg md:text-3xl font-bold text-gray-800">
              {lang === "bn" ? sec.titleBn || sec.title : sec.title}
            </h2>
            {sec.viewAllLink && sec.viewAllLink !== "/" && (
              <a
                href={sec.viewAllLink}
                className="text-md  text-rose-500 font-semibold hover:underline whitespace-nowrap"
              >
                {t("home.view_all")}
              </a>
            )}
          </div>
          {/* Product slider */}
          <FeaturedSlider products={sec.products} />
        </div>
      ))}
    </section>
  );
}
