"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import CategorySidebar from "./CategorySidebar";

const Banner = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const router = useRouter();

  // Slider data - Each slide has 2 images side by side
  const sliderData = [
    {
      leftImage: {
        image: "/assets/banner/banner-bg.webp",
        title: "35% Cashback !!",
        subtitle: "Start your daily shopping diversity!",
        buttonText: "Order Now",
        buttonLink: "/products/",
        badge: "FREE DELIVERY",
      },
      rightImage: {
        image: "/assets/banner/banner-bg3.webp",
        title: "Organic Foods",
        subtitle: "Start your daily shopping organic foods",
        buttonText: "Order Now",
        buttonLink: "/products/c/agriculture/",
        badge: "SAVE UPTO 20%", 
      },
    },
    {
      leftImage: {
        image: "/assets/banner/banner-bg4.webp",
        title: "Premium Quality",
        subtitle: "Discover our wide range of products",
        buttonText: "Order Now",
        buttonLink: "/products/",
        badge: "BEST DEALS",
      },
      rightImage: {
        image: "/assets/banner/banner-bg5.webp",
        title: "Special Offers",
        subtitle: "Get the best deals on bulk orders today",
        buttonText: "Order Now",
        buttonLink: "/products/",
        badge: "LIMITED TIME",
      },
    },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      // On mobile, cycle through 4 slides (2 sets × 2 images each)
      // On desktop, cycle through 2 slides (each showing 2 images side by side)
      const totalSlides = typeof window !== 'undefined' && window.innerWidth < 768 
        ? sliderData.length * 2 
        : sliderData.length;
      setCurrentSlide((prev) => (prev + 1) % totalSlides);
    }, 4000); // Changed to 4 seconds

    return () => clearInterval(timer);
  }, [sliderData.length]);

  const nextSlide = () => {
    const totalSlides = typeof window !== 'undefined' && window.innerWidth < 768 
      ? sliderData.length * 2 
      : sliderData.length;
    setCurrentSlide((prev) => (prev + 1) % totalSlides);
  };

  const prevSlide = () => {
    const totalSlides = typeof window !== 'undefined' && window.innerWidth < 768 
      ? sliderData.length * 2 
      : sliderData.length;
    setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
  };


  return (
    <>

    <div className="relative flex flex-col md:flex-row md:items-start w-full bg-[#FAFAF7]">
      {/* Sidebar (desktop only) — h-fit so height = category list content only */}
      <div className="hidden md:block md:w-[240px] min-w-[200px] overflow-visible z-10 relative h-fit">
        <CategorySidebar />
      </div>

      {/* Mobile Category Drawer — content height, not full height */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-0 left-0 right-0 z-50">
          {/* Backdrop covers the whole banner area */}
          <div
            className="fixed inset-0 bg-black/40"
            onClick={() => setMobileMenuOpen(false)}
          />
          {/* Drawer panel — natural content height, no flex stretching */}
          <div className="relative w-[80%] max-w-xs bg-white shadow-2xl z-10">
            {/* Drawer header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-rose-600">
              <span className="text-white font-bold text-sm tracking-wide">All Categories</span>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="text-white hover:text-rose-100 transition-colors"
                aria-label="Close menu"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {/* Category list — scrollable only if content overflows viewport */}
            <div style={{ maxHeight: "80vh", overflowY: "auto" }}>
              <CategorySidebar onLinkClick={() => setMobileMenuOpen(false)} />
            </div>
          </div>
        </div>
      )}

      {/* Banner Section */}
      <div className="flex-1 flex flex-col gap-4 mt-2">
        {/* Mobile hamburger button — opens category drawer */}
        <div className="md:hidden flex items-center gap-2 px-3 py-2 bg-white border-b border-gray-100">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="flex items-center gap-2 text-gray-700 hover:text-rose-600 transition-colors"
            aria-label="Open categories"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            <span className="text-sm font-semibold">All Categories</span>
          </button>
        </div>

        {/* Default Top Banner - Static (banner-bg2) */}
        <div className="relative h-[180px] md:h-[380px] rounded-2xl overflow-hidden max-w-6xl">
          <Image
            src="/banner/Oven_Big_banner_1.jpg"
            alt="Stay home & delivered your daily needs"
            fill
            priority
            quality={90}
            sizes="100vw"
            className="object-fit"
          />
        </div> 
      </div>
    </div>
    </>
  );
};

export default Banner;