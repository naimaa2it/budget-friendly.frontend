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

    <div className="relative flex flex-col md:flex-row w-full bg-[#FAFAF7]">
      {/* Sidebar (desktop only) — overflow-visible so flyout panel isn't clipped */}
      <div className="hidden md:block md:w-[240px] min-w-[200px] sticky top-[56px] h-[calc(100vh-56px)] overflow-visible">
        <CategorySidebar />
      </div>

      {/* Mobile Category Drawer — full component height overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileMenuOpen(false)}
          />
          {/* Drawer panel */}
          <div className="relative w-[80%] max-w-xs bg-white h-full shadow-2xl flex flex-col z-10">
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
            {/* Category list — full remaining height */}
            <div className="flex-1 overflow-hidden">
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
        <div className="relative h-[180px] md:h-[380px] rounded-lg overflow-hidden ">
          <Image
            src="/assets/banner/banner-bg2.webp"
            alt="Stay home & delivered your daily needs"
            fill
            priority
            quality={90}
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 ">
            <div className="h-full flex items-start pt-6 md:pt-8 px-6 md:px-12">
              <div className="max-w-xl bg-white/0 backdrop-blur-0 p-4 rounded-lg">
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold -mt-4 -ml-4  md:-mt-0 bg-gradient-to-r from-yellow-400 to-orange-600 bg-clip-text text-transparent mb-2 leading-tight " >
                  Stay Home & Delivered
                </h2>
                <h3 className="text-2xl md:text-3xl font-semibold text-black mb-3 hidden md:block -ml-4">
                  your daily need's All at one place
                </h3>
                
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Slider Section - 2 Rotating images side by side */}
        <div className="relative md:grid md:grid-cols-2 gap-4 -mt-1 mb-3">
          {/* Mobile: Show all images (4 total) one at a time */}
          <div className="md:hidden">
            {sliderData.flatMap((slideSet, slideIndex) => [
              // Left Image
              <div 
                key={`left-${slideIndex}`}
                className={`relative h-[220px] rounded-lg overflow-hidden shadow-lg mb-4 ${
                  slideIndex * 2 === currentSlide ? 'block' : 'hidden'
                }`}
              >
                <Image
                  src={slideSet.leftImage.image}
                  alt={slideSet.leftImage.title}
                  fill
                  quality={90}
                  sizes="100vw"
                  className="object-fill"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/10 via-transparent to-transparent">
                  <div className="h-full flex items-center px-4">
                    <div className="max-w-md bg-white/30 backdrop-blur-sm p-3 rounded-lg">
                      {slideSet.leftImage.badge && (
                        <span className="inline-block bg-secondary text-white text-xs font-bold px-3 py-1 rounded-full mb-2 uppercase tracking-wider shadow-lg">
                          {slideSet.leftImage.badge}
                        </span>
                      )}
                      <h2 className="text-xl font-bold text-black mb-1 leading-tight">
                        {slideSet.leftImage.title}
                      </h2>
                      <p className="text-xs text-white mb-2 font-medium">
                        {slideSet.leftImage.subtitle}
                      </p>
                      <Link
                        href={slideSet.leftImage.buttonLink}
                        className="inline-flex items-center gap-2 bg-[#D4E157] hover:bg-[#C0CA33] bg-gradient-to-r from-primary to-brand-olive hover:from-brand-olive hover:to-primary text-white font-semibold py-2 px-4 rounded-md shadow-lg transition-all duration-300 text-xs"
                      >
                        {slideSet.leftImage.buttonText}
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>,
              // Right Image
              <div 
                key={`right-${slideIndex}`}
                className={`relative h-[220px] rounded-lg overflow-hidden shadow-lg mb-4 ${
                  slideIndex * 2 + 1 === currentSlide ? 'block' : 'hidden'
                }`}
              >
                <Image
                  src={slideSet.rightImage.image}
                  alt={slideSet.rightImage.title}
                  fill
                  quality={90}
                  sizes="100vw"
                  className="object-fill"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/10 via-transparent to-transparent">
                  <div className="h-full flex items-center px-4">
                    <div className="max-w-md bg-white/30 backdrop-blur-sm p-3 rounded-lg">
                      {slideSet.rightImage.badge && (
                        <span className="inline-block bg-green-600 text-white text-xs font-bold px-3 py-1 rounded-full mb-2 uppercase tracking-wider shadow-lg">
                          {slideSet.rightImage.badge}
                        </span>
                      )}
                      <h2 className="text-xl font-bold text-black mb-1 leading-tight">
                        {slideSet.rightImage.title}
                      </h2>
                      <p className="text-xs text-white mb-2 font-medium">
                        {slideSet.rightImage.subtitle}
                      </p>
                      <Link
                        href={slideSet.rightImage.buttonLink}
                        className="inline-flex items-center gap-2 bg-gradient-to-r from-primary to-brand-olive hover:from-brand-olive hover:to-primary text-white font-semibold py-2 px-4 rounded-md shadow-lg transition-all duration-300 text-xs"
                      >
                        {slideSet.rightImage.buttonText}
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ])}
          </div>

          {/* Desktop: Show two images side by side */}
          <div className="hidden md:contents">
          {sliderData.map((slideSet, slideIndex) => (
            <React.Fragment key={slideIndex}>
              {slideIndex === currentSlide && (
                <>
                  {/* Left Image */}
                  <div className="relative h-[220px] md:h-[280px] rounded-lg overflow-hidden shadow-lg">
                    <Image
                      src={slideSet.leftImage.image}
                      alt={slideSet.leftImage.title}
                      fill
                      quality={90}
                      sizes="50vw"
                      className="object-fill"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/10 via-transparent to-transparent ">
                      <div className="h-full flex items-center px-4 md:px-6">
                        <div className="max-w-md bg-white/30 backdrop-blur-sm p-3 rounded-lg">
                          {slideSet.leftImage.badge && (
                            <span className="inline-block bg-secondary text-white text-xs font-bold px-3 py-1 rounded-full mb-2 uppercase tracking-wider shadow-lg">
                              {slideSet.leftImage.badge}
                            </span>
                          )}
                          <h2 className="text-xl md:text-xl lg:text-xl font-bold text-black mb-1 leading-tight">
                            {slideSet.leftImage.title}
                          </h2>
                          <p className="text-xs  text-white mb-2 font-medium" >
                            {slideSet.leftImage.subtitle}
                          </p>
                          <Link
                            href={slideSet.leftImage.buttonLink}
                            className="inline-flex items-center gap-2 bg-gradient-to-r from-primary to-brand-olive hover:from-brand-olive hover:to-primary text-white font-semibold py-2 px-4 md:px-6 rounded-md shadow-lg transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl text-xs md:text-sm"
                          >
                            {slideSet.leftImage.buttonText}
                            <svg
                              className="w-3 h-3 md:w-4 md:h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M17 8l4 4m0 0l-4 4m4-4H3"
                              />
                            </svg>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Image */}
                  <div className="relative h-[220px] md:h-[280px] rounded-lg overflow-hidden shadow-lg">
                    <Image
                      src={slideSet.rightImage.image}
                      alt={slideSet.rightImage.title}
                      fill
                      quality={90}
                      sizes="50vw"
                      className="object-fill"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/10 via-transparent to-transparent">
                      <div className="h-full flex items-center px-4 md:px-6">
                        <div className="max-w-md bg-white/30 backdrop-blur-sm p-3 rounded-lg">
                          {slideSet.rightImage.badge && (
                            <span className="inline-block bg-green-600 text-white text-xs font-bold px-3 py-1 rounded-full mb-2 uppercase tracking-wider shadow-lg">
                              {slideSet.rightImage.badge}
                            </span>
                          )}
                          <h2 className="text-xl md:text-xl lg:text-xl font-bold text-black mb-1 leading-tight">
                            {slideSet.rightImage.title}
                          </h2>
                          <p className="text-xs text-white mb-2 font-medium" >
                            {slideSet.rightImage.subtitle}
                          </p>
                          <Link
                            href={slideSet.rightImage.buttonLink}
                            className="inline-flex items-center gap-2 bg-gradient-to-r from-primary to-brand-olive hover:from-brand-olive hover:to-primary text-white font-semibold py-2 px-4 md:px-6 rounded-md shadow-lg transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl text-xs md:text-sm"
                          >
                            {slideSet.rightImage.buttonText}
                            <svg
                              className="w-3 h-3 md:w-4 md:h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M17 8l4 4m0 0l-4 4m4-4H3"
                              />
                            </svg>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </React.Fragment>
          ))}
          </div>

          {/* Navigation Arrows - Positioned to control both images */}
          <button
            onClick={prevSlide}
            className="absolute left-1 top-1/2 -translate-y-1/2 z-20 bg-white/80 p-2 rounded-full shadow-lg transition-all duration-300 hover:scale-110 md:block"
            aria-label="Previous slide"
          >
            <svg
              className="w-5 h-5 text-gray-800"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>

          <button
            onClick={nextSlide}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-20 bg-white/80 hover:bg-white p-2 rounded-full shadow-lg transition-all duration-300 hover:scale-110 md:block"
            aria-label="Next slide"
          >
            <svg
              className="w-5 h-5 text-gray-800"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
    </>
  );
};

export default Banner;