"use client";

import React, { useEffect, useRef, useState } from "react";
import { useLanguage } from "@/components/context/LanguageContext";
import { cdnImageUrl } from "@/lib/cdnImage";

const API = process.env.NEXT_PUBLIC_API_URL || "https://api.pickob.com";
const SLIDE_INTERVAL = 3000;

export default function TopGlobalBrands() {
  const { t } = useLanguage();
  const [brands, setBrands] = useState([]);
  const [perPage, setPerPage] = useState(5);
  const [current, setCurrent] = useState(0);
  const paused = useRef(false);

  useEffect(() => {
    fetch(`${API}/api/brands?limit=40`)
      .then((r) => r.json())
      .then((d) => setBrands((d.brands || []).filter((b) => b.logo)))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const updatePerPage = () => {
      const w = window.innerWidth;
      if (w < 400) setPerPage(3);
      else if (w < 640) setPerPage(4);
      else if (w < 768) setPerPage(5);
      else if (w < 1024) setPerPage(8);
      else setPerPage(10);
    };
    updatePerPage();
    window.addEventListener("resize", updatePerPage);
    return () => window.removeEventListener("resize", updatePerPage);
  }, []);

  const maxIndex = Math.max(0, brands.length - perPage);

  useEffect(() => {
    if (maxIndex <= 0) return;
    const id = setInterval(() => {
      if (paused.current) return;
      setCurrent((c) => (c >= maxIndex ? 0 : c + 1));
    }, SLIDE_INTERVAL);
    return () => clearInterval(id);
  }, [maxIndex]);

  if (!brands.length) return null;

  const safeCurrent = Math.min(current, maxIndex);
  const cardPct = 100 / perPage;

  return (
    <div className="max-w-screen-xl mx-auto px-3 md:px-6 py-6">
      {/* Header */}
      <h2 className="flex items-center justify-center gap-2 text-sm md:text-xl font-bold text-gray-900 uppercase tracking-wide mb-5">
        <span aria-hidden="true">⭐</span>
        {t("home.top_brands_title")}
      </h2>

      {/* Sliding logo track */}
      <div
        className="overflow-hidden"
        onMouseEnter={() => {
          paused.current = true;
        }}
        onMouseLeave={() => {
          paused.current = false;
        }}
      >
        <div
          className="flex transition-transform duration-700 ease-in-out"
          style={{ transform: `translateX(-${safeCurrent * cardPct}%)` }}
        >
          {brands.map((brand) => (
            <div
              key={brand._id}
              className="flex items-center justify-center shrink-0 px-2 sm:px-3"
              style={{ width: `${cardPct}%` }}
            >
              <img
                src={cdnImageUrl(brand.logo, 300)}
                alt={brand.name}
                title={brand.name}
                loading="lazy"
                className="h-7 sm:h-9 md:h-12 lg:h-16 w-auto max-w-full object-contain hover:scale-105 transition duration-300"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
