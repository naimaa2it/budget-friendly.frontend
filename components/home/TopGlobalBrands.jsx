"use client";

import React, { useEffect, useState } from "react";
import { useLanguage } from "@/components/context/LanguageContext";
import { cdnImageUrl } from "@/lib/cdnImage";

const API = process.env.NEXT_PUBLIC_API_URL || "https://api.pickob.com";
const SLIDE_INTERVAL = 5000;

export default function TopGlobalBrands() {
  const { t } = useLanguage();
  const [brands, setBrands] = useState([]);
  const [perPage, setPerPage] = useState(5);
  const [page, setPage] = useState(0);

  useEffect(() => {
    fetch(`${API}/api/brands?limit=40`)
      .then((r) => r.json())
      .then((d) => setBrands((d.brands || []).filter((b) => b.logo)))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const updatePerPage = () => setPerPage(window.innerWidth >= 768 ? 10 : 5);
    updatePerPage();
    window.addEventListener("resize", updatePerPage);
    return () => window.removeEventListener("resize", updatePerPage);
  }, []);

  const pages = [];
  for (let i = 0; i < brands.length; i += perPage) {
    pages.push(brands.slice(i, i + perPage));
  }
  const pageCount = pages.length;

  useEffect(() => {
    if (pageCount <= 1) return;
    const id = setInterval(() => {
      setPage((p) => (p + 1) % pageCount);
    }, SLIDE_INTERVAL);
    return () => clearInterval(id);
  }, [pageCount]);

  if (!brands.length) return null;

  const safePage = pageCount ? page % pageCount : 0;

  return (
    <div className="max-w-screen-xl mx-auto px-3 md:px-6 py-6">
      {/* Header */}
      <h2 className="flex items-center justify-center gap-2 text-sm md:text-xl font-bold text-gray-900 uppercase tracking-wide mb-5">
        <span aria-hidden="true">⭐</span>
        {t("home.top_brands_title")}
      </h2>

      {/* Sliding logo track */}
      <div className="overflow-hidden">
        <div
          className="flex transition-transform duration-700 ease-in-out"
          style={{ transform: `translateX(-${safePage * 100}%)` }}
        >
          {pages.map((group, i) => (
            <div
              key={i}
              className="grid grid-cols-5 md:grid-cols-10 items-center justify-items-center gap-x-2 gap-y-5 md:gap-x-4 w-full shrink-0"
            >
              {group.map((brand) => (
                <img
                  key={brand._id}
                  src={cdnImageUrl(brand.logo, 300)}
                  alt={brand.name}
                  title={brand.name}
                  loading="lazy"
                  className="h-10 md:h-16 w-auto max-w-30 object-contain hover:scale-105 transition duration-300"
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Dots */}
      {pageCount > 1 && (
        <div className="flex items-center justify-center gap-1.5 mt-4">
          {pages.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setPage(i)}
              aria-label={`Go to slide ${i + 1}`}
              className={`h-1.5 rounded-full transition-all ${
                i === safePage ? "w-5 bg-gray-800" : "w-1.5 bg-gray-300"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
