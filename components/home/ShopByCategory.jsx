"use client";

import React, { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { PiFishThin, PiTireThin, PiLeafThin } from "react-icons/pi";
import { GiRopeCoil, GiPeanut, GiWoodPile } from "react-icons/gi";
import { FaArrowRight, FaTrash } from "react-icons/fa";
import { useUser } from "@/components/context/UserContext";
import { useCategories } from "@/components/context/CategoryContext";
import { useLanguage } from "@/components/context/LanguageContext";
import Image from "next/image";

const API = process.env.NEXT_PUBLIC_API_URL || "https://api.pickob.com";

// Icon and image mapping for categories
const categoryAssets = {
  "Vehicle Parts & Accessories": {
    image: "/assets/placeholder.svg",
    icon: <PiTireThin />,
    nameBn: "যানবাহন যন্ত্রাংশ ও আনুষঙ্গিক",
  },
  "Frozen Fish": {
    image: "/assets/placeholder.svg",
    icon: <PiFishThin />,
    nameBn: "হিমায়িত মাছ",
  },
  "Metals & Metal Products": {
    image: "/assets/placeholder.svg",
    icon: <GiRopeCoil />,
    nameBn: "ধাতু ও ধাতব পণ্য",
  },
  "Dry Food": {
    image: "/assets/placeholder.svg",
    icon: <GiPeanut />,
    nameBn: "শুকনো খাবার",
  },
  Agriculture: {
    image: "/assets/placeholder.svg",
    icon: <PiLeafThin />,
    nameBn: "কৃষি",
  },
  "Wood Products": {
    image: "/assets/placeholder.svg",
    icon: <GiWoodPile />,
    nameBn: "কাঠের পণ্য",
  },
};

export default function ShopByCategory() {
  const { categories: rawCategories, loading } = useCategories();
  const { user } = useUser();
  const { t, lang } = useLanguage();
  const scrollContainerRef = useRef(null);
  const [page, setPage] = useState(0);

  // determine page size based on window width: mobile 4, tablet 5, large 6
  const [pageSize, setPageSize] = useState(4);
  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      if (w >= 1024)
        setPageSize(6); // large devices
      else if (w >= 768)
        setPageSize(5); // tablets
      else setPageSize(4); // mobiles
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const totalPages = Math.ceil(rawCategories.length / pageSize);

  const scrollLeft = () => {
    setPage((prev) => Math.max(prev - 1, 0));
  };

  const scrollRight = () => {
    setPage((prev) => Math.min(prev + 1, totalPages - 1));
  };

  // Convert context categories to display format
  const categories = rawCategories.map((c) => ({
    _id: c._id,
    name: c.name,
    nameBn: c.nameBn,
    slug: c.slug,
    image:
      c.images && c.images[0] && c.images[0].url ? c.images[0].url : undefined,
  }));

  const rendered = (categories || []).map((category) => {
    const assets = categoryAssets[category.name] || {};
    const slug = category.slug || (category.name || "").replace(/\s+/g, "-");
    const image = category.image || assets.image || "/assets/placeholder.svg";
    const displayName =
      lang === "bn"
        ? category.nameBn || assets.nameBn || category.name
        : category.name;
    return {
      name: displayName,
      image,
      icon: assets.icon || null,
      link: `/category/${slug}/`,
      _id: category._id,
    };
  });

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 mt-6 mb-6">
      <div className="max-w-6xl mx-auto flex justify-between items-center mt-2 mb-4 px-6 ">
        <h1 className="text-xl md:text-3xl font-bold text-gray-900 text-center mt-4">
          <span className="border-b-2 border-red-500">
            {t("home.category")}
          </span>
        </h1>
        <div className="flex gap-2 mt-4">
          <button
            onClick={scrollLeft}
            className="bg-white rounded-full p-2 shadow-lg hover:bg-rose-50 border border-rose-400"
            aria-label="Scroll left"
            disabled={page === 0}
          >
            <svg
              className="md:w-4 md:h-4 w-3 h-3 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <button
            onClick={scrollRight}
            className="bg-white rounded-full p-2 shadow-lg hover:bg-rose-50 border border-rose-400"
            aria-label="Scroll right"
            disabled={page === totalPages - 1}
          >
            <svg
              className="md:w-4 md:h-4 w-3 h-3 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>
      </div>

      <div className="relative max-w-6xl mx-auto">
        {/* unified paginated layout */}
        {loading ? (
          <div className="text-gray-500 py-8 w-full text-center">
            {t("home.loading_categories")}
          </div>
        ) : rendered.length === 0 ? (
          <div className="text-gray-500 py-8 w-full text-center">
            {t("home.no_categories")}
          </div>
        ) : (
          <div className="grid  mb-4 grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-6">
            {rendered
              .slice(page * pageSize, (page + 1) * pageSize)
              .map((cat) => (
                <div key={cat._id} className="flex flex-col items-center group">
                  <Link
                    href={cat.link}
                    className="cursor-pointer flex flex-col items-center gap-1"
                  >
                    <div className="relative rounded-full border-2 border-white shadow-lg bg-gradient-to-r from-[#fff3dc] to-rose-100 group-hover:scale-105 transition-transform overflow-visible w-16 h-16 sm:w-20 sm:h-20 md:w-28 md:h-28 lg:w-32 lg:h-32">
                      <div className="absolute inset-0 rounded-full overflow-hidden w-full h-full">
                        <Image
                          src={encodeURI(cat.image)}
                          alt={cat.name}
                          fill
                          style={{ objectFit: "cover" }}
                          loading="lazy"
                          decoding="async"
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = "/assets/placeholder.svg";
                          }}
                          className="group-hover:blur-sm transition-all duration-300 object-cover"
                        />
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-r from-[#fff3dc] to-rose-100 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 hidden sm:flex items-center justify-center shadow-lg">
                        <span className="text-[#fd6b66] font-bold text-center px-1 text-xs md:text-sm leading-tight">
                          {cat.name}
                        </span>
                      </div>
                      {cat.icon && (
                        <div className="absolute top-1 left-1 bg-white rounded-full p-1 shadow z-20 border border-gray-100">
                          {typeof cat.icon === "string" ? (
                            <img
                              src={cat.icon}
                              alt=""
                              className="w-4 h-4 md:w-5 md:h-5 object-cover"
                            />
                          ) : (
                            React.cloneElement(cat.icon, {
                              className: "w-4 h-4 md:w-5 md:h-5 text-gray-700",
                            })
                          )}
                        </div>
                      )}
                    </div>
                    {/* Permanent name label — always visible (hover overlay only shows on sm+) */}
                    <span className="text-center text-[10px] sm:text-xs md:text-sm font-medium text-gray-700 leading-tight line-clamp-2 max-w-18 sm:max-w-full group-hover:text-rose-600 transition-colors">
                      {cat.name}
                    </span>
                  </Link>
                </div>
              ))}
          </div>
        )}
      </div>

      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
