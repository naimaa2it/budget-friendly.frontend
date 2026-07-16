"use client";

import React, { useEffect, useState } from "react";
import { useLanguage } from "@/components/context/LanguageContext";
import { cdnImageUrl } from "@/lib/cdnImage";

const API = process.env.NEXT_PUBLIC_API_URL || "https://api.pickob.com";

export default function TopGlobalBrands() {
  const { t } = useLanguage();
  const [brands, setBrands] = useState([]);

  useEffect(() => {
    fetch(`${API}/api/brands?limit=40`)
      .then((r) => r.json())
      .then((d) => setBrands((d.brands || []).filter((b) => b.logo)))
      .catch(() => {});
  }, []);

  if (!brands.length) return null;

  const shown = brands.slice(0, 10);

  return (
    <div className="max-w-screen-xl mx-auto px-3 md:px-6 py-6">
      {/* Header */}
      <h2 className="flex items-center justify-center gap-2 text-sm md:text-2xl font-bold text-gray-900 uppercase tracking-wide mb-5">
        <span aria-hidden="true">⭐</span>
        {t("home.top_brands_title")}
      </h2>

      {/* Logo row */}
      <div className="grid grid-cols-5 md:grid-cols-10 items-center justify-items-center gap-x-2 gap-y-5 md:gap-x-4">
        {shown.map((brand) => (
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
    </div>
  );
}
