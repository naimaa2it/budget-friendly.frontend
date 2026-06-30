"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import CategorySidebar from "./CategorySidebar";

const FALLBACK = [
  {
    _id: "fallback-1",
    image: { url: "/banner/Oven_Big_banner_1.jpg" },
    title: "",
    subtitle: "",
    buttonText: "",
    buttonLink: "/",
    badge: "",
  },
];

const Banner = () => {
  const API = process.env.NEXT_PUBLIC_API_URL || "https://api.pickob.com";
  const [slides, setSlides] = useState([]);
  const [current, setCurrent] = useState(0);
  const autoRef = useRef(null);

  useEffect(() => {
    fetch(`${API}/api/banners`)
      .then((r) => r.json())
      .then((b) => setSlides((b.items || []).length > 0 ? b.items : FALLBACK))
      .catch(() => setSlides(FALLBACK));
  }, [API]);

  const total = slides.length;

  const startAuto = useCallback(() => {
    clearInterval(autoRef.current);
    if (total <= 1) return;
    autoRef.current = setInterval(
      () => setCurrent((p) => (p + 1) % total),
      4000,
    );
  }, [total]);

  useEffect(() => {
    startAuto();
    return () => clearInterval(autoRef.current);
  }, [startAuto]);

  const go = (dir) => {
    setCurrent((p) => (p + dir + total) % total);
    startAuto();
  };

  const slide = slides[current] || slides[0];

  return (
    <section className="bg-[#FFF5ED] ">
      <div className="relative flex flex-col md:flex-row md:items-start max-w-7xl mx-auto  md:h-[356px]">
        {/* Sidebar (desktop only) */}
        <div className="hidden md:block md:w-[240px] min-w-[200px] overflow-visible z-10 relative md:h-full">
          <CategorySidebar />
        </div>

        {/* Banner Section */}
        <div className="flex-1 flex flex-col gap-4 px-2 md:px-4 ">
          <div
            className="relative mt-1 mb-1 h-47 sm:h-58.5 md:h-87 rounded-2xl overflow-hidden w-full mx-auto cursor-pointer"
            onMouseEnter={() => clearInterval(autoRef.current)}
            onMouseLeave={startAuto}
            onClick={() => {
              if (slide?.buttonLink) window.location.href = slide.buttonLink;
            }}
          >
            {slide && (
              <Image
                key={slide._id || current}
                src={slide.image?.url || "/assets/placeholder.svg"}
                alt={slide.title || "Banner"}
                fill
                priority
                quality={100}
                sizes="100vw"
                className="object-cover transition-opacity duration-500"
              />
            )}

            {/* Overlay content */}
            {(slide?.title || slide?.badge || slide?.buttonText) && (
              <div className="absolute inset-0 flex flex-col justify-center px-8 md:px-14 bg-gradient-to-r from-black/40 via-black/10 to-transparent">
                {slide.badge && (
                  <span className="inline-block  text-white text-lg font-bold  rounded-full w-fit mb-2">
                    {slide.badge}
                  </span>
                )}
                {slide.title && (
                  <h2 className="text-white text-xl md:text-3xl font-bold drop-shadow mb-1">
                    {slide.title}
                  </h2>
                )}
                {slide.subtitle && (
                  <p className="text-white/90 text-sm md:text-base mb-4 drop-shadow">
                    {slide.subtitle}
                  </p>
                )}
                {slide.buttonText && slide.buttonLink && (
                  <Link
                    href={slide.buttonLink}
                    className="inline-block bg-white text-gray-900 font-semibold text-sm px-5 py-2 rounded-full hover:bg-gray-100 transition w-fit"
                  >
                    {slide.buttonText}
                  </Link>
                )}
              </div>
            )}

            {/* Prev / Next arrows */}
            {total > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    go(-1);
                  }}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 hover:bg-white rounded-full flex items-center justify-center shadow text-gray-700 transition z-10"
                >
                  ‹
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    go(1);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 hover:bg-white rounded-full flex items-center justify-center shadow text-gray-700 transition z-10"
                >
                  ›
                </button>
              </>
            )}

            {/* Dots */}
            {total > 1 && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                {slides.map((_, i) => (
                  <button
                    key={i}
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrent(i);
                      startAuto();
                    }}
                    className={`h-1.5 rounded-full transition-all ${i === current ? "bg-white w-5" : "bg-white/50 w-1.5"}`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Banner;
