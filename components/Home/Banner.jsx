"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import CategorySidebar from "./CategorySidebar";

const Banner = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

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


  return (
    <>

    <div className="relative flex flex-col md:flex-row md:items-start w-full bg-[#FAFAF7]">
      {/* Sidebar (desktop only) — h-fit so height = category list content only */}
      <div className="hidden md:block md:w-[240px] min-w-[200px] overflow-visible z-10 relative h-fit">
        <CategorySidebar />
      </div>

      {/* Banner Section */}
      <div className="flex-1 flex flex-col gap-4 mt-2">
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