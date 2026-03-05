"use client";

import React, { useState, useEffect } from 'react';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';

export default function OffersToSayYes() {
  const [currentSlide, setCurrentSlide] = useState(0);

  const offers = [
    {
      id: 1,
      title: "Free Delivery",
      subtitle: "Max Discount",
      spend: "899 TK",
      highlight: "Free",
      highlightSecondary: "Delivery",
      bgColor: "from-pink-50 to-white",
      textColor: "text-pink-600",
      borderColor: "border-orange-400"
    },
    {
      id: 2,
      title: "Free Gift Offer",
      subtitle: "Max Discount",
      spend: "2000 TK",
      highlight: "৳150",
      description: "Free Gift 🎁 Get Nineless A-Control Azelaic Acid Serum (2ml) on orders above 2000 BDT",
      bgColor: "from-orange-50 to-white",
      textColor: "text-orange-600",
      borderColor: "border-orange-400"
    },
    {
      id: 3,
      title: "Free Gift Offer",
      subtitle: "Max Discount",
      spend: "2000 TK",
      highlight: "৳150",
      description: "Free Gift 🎁 Nineless Hydra-Max Deep Infusion Serum (2ml) on orders above 2000 BDT",
      bgColor: "from-orange-50 to-white",
      textColor: "text-orange-600",
      borderColor: "border-orange-400"
    },
    {
      id: 4,
      title: "Cashback Offer",
      subtitle: "Max Discount",
      spend: "3000 TK",
      highlight: "৳200",
      description: "Get ৳200 cashback on orders above 3000 BDT. Limited time offer!",
      bgColor: "from-green-50 to-white",
      textColor: "text-green-600",
      borderColor: "border-green-400"
    },
    {
      id: 5,
      title: "Bundle Deal",
      subtitle: "Max Discount",
      spend: "1500 TK",
      highlight: "30%",
      description: "Save 30% on bundle purchases. Buy more, save more!",
      bgColor: "from-blue-50 to-white",
      textColor: "text-blue-600",
      borderColor: "border-blue-400"
    },
    {
      id: 6,
      title: "Flash Sale",
      subtitle: "Max Discount",
      spend: "500 TK",
      highlight: "50%",
      description: "Flash sale! Get up to 50% off on selected items",
      bgColor: "from-red-50 to-white",
      textColor: "text-red-600",
      borderColor: "border-red-400"
    }
  ];

  const slidesToShow = 3;
  const totalSlides = Math.ceil(offers.length / slidesToShow);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % totalSlides);
    }, 5000);

    return () => clearInterval(timer);
  }, [totalSlides]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % totalSlides);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
  };

  const visibleOffers = offers.slice(
    currentSlide * slidesToShow,
    (currentSlide + 1) * slidesToShow
  );

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          <span className=" text-red-500 ">OFFERS!</span>{" "}
          <span className="font-normal">Your Can't Miss!!</span>
        </h1>
      </div>

      {/* Offers Slider */}
      <div className="relative">
        {/* Navigation Buttons */}
        <button
          onClick={prevSlide}
          className="absolute -left-4 top-1/2 transform -translate-y-1/2 z-10 bg-white rounded-full w-10 h-10 flex items-center justify-center shadow-lg hover:shadow-xl hover:bg-red-600 hover:text-white transition"
        >
          <FaChevronLeft className="w-5 h-5" />
        </button>

        <button
          onClick={nextSlide}
          className="absolute -right-4 top-1/2 transform -translate-y-1/2 z-10 bg-white rounded-full w-10 h-10 flex items-center justify-center shadow-lg hover:shadow-xl hover:bg-red-600 hover:text-white transition"
        >
          <FaChevronRight className="w-5 h-5" />
        </button>

        {/* Offers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 transition-all duration-500">
          {visibleOffers.map((offer) => (
            <div
              key={offer.id}
              className={`relative border-2 ${offer.borderColor} rounded-lg p-6 bg-gradient-to-br ${offer.bgColor} overflow-hidden h-44`}
            >
              {/* Decorative circles */}
              <div className={`absolute -top-3 left-1/2 transform -translate-x-1/2 w-6 h-6 bg-white border-2 ${offer.borderColor} rounded-full z-10`}></div>
              <div className={`absolute -bottom-3 left-1/2 transform -translate-x-1/2 w-6 h-6 bg-white border-2 ${offer.borderColor} rounded-full z-10`}></div>

              {/* Vertical dashed line */}
              <div className="absolute right-1/3 top-0 bottom-0 border-r-2 border-dashed border-orange-300"></div>

              {/* Left Section */}
              <div className="pr-20">
                <p className="text-sm text-gray-600 mb-2">Spend: {offer.spend}</p>
                
                {offer.id === 1 ? (
                  <>
                    <h2 className={`text-4xl font-bold ${offer.textColor} mb-1`}>
                      {offer.highlight}
                    </h2>
                    <h3 className={`text-3xl font-bold ${offer.textColor}`}>
                      {offer.highlightSecondary}
                    </h3>
                  </>
                ) : (
                  <h2 className={`text-5xl font-bold ${offer.textColor}`}>
                    {offer.highlight}
                  </h2>
                )}
                
                <p className="text-sm text-gray-600 mt-2">{offer.subtitle}</p>
              </div>

              {/* Right Section */}
              <div className="absolute right-6 top-6 w-32">
                <h3 className="text-sm font-semibold text-gray-900 mb-2">
                  {offer.title}
                </h3>
                {offer.description && (
                  <p className="text-xs text-gray-600 leading-relaxed">
                    {offer.description}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Slide Indicators */}
        <div className="flex justify-center gap-2 mt-6">
          {Array.from({ length: totalSlides }).map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`h-2 rounded-full transition-all ${
                index === currentSlide 
                  ? "bg-red-600 w-8" 
                  : "bg-gray-300 w-2 hover:bg-gray-400"
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
