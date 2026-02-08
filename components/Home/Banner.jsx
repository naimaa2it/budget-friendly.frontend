"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";

const Banner = () => {
  const [displayText, setDisplayText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showCursor, setShowCursor] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedModel, setSelectedModel] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [selectedPrice, setSelectedPrice] = useState("");

  const fullText = "Ultimate Protection";

  // Typing animation effect
  useEffect(() => {
    if (typeof window === "undefined") return;

    if (currentIndex < fullText.length) {
      const timer = setTimeout(() => {
        setDisplayText(fullText.substring(0, currentIndex + 1));
        setCurrentIndex(currentIndex + 1);
      }, 80);

      return () => clearTimeout(timer);
    } else {
      const cursorTimer = setInterval(() => {
        setShowCursor((prev) => !prev);
      }, 500);

      return () => clearInterval(cursorTimer);
    }
  }, [currentIndex, fullText]);

  const handleSearch = () => {
    console.log("Search:", {
      category: selectedCategory,
      model: selectedModel,
      type: selectedType,
      price: selectedPrice,
    });
  };

  return (
    <div className="relative w-full h-[400px] md:h-[450px] lg:h-[500px] overflow-hidden pt-20">
      {/* Background Image */}
      <Image
        src="/assets/banner.png"
        alt="Ultimate Protection Banner"
        fill
        priority
        quality={100}
        sizes="100vw"
        className="object-cover object-center"
      />

      {/* Content Overlay */}
      <div className="relative z-10 w-full h-full flex flex-col justify-between px-4 pt-4">
        {/* Main Heading with Typing Effect - Centered */}
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-3xl">
            <h1 className=" font-bold leading-tight">
              <div className="text-black mb-2 text-3xl md:text-4xl lg:text-4xl">Comes With The</div>
              <div className="text-red-600 text-4xl md:text-5xl lg:text-6xl">
                {displayText}
                <span
                  className={`inline-block w-1 h-10 md:h-12 lg:h-14 bg-red-600 align-middle ml-1 ${
                    showCursor ? "opacity-100" : "opacity-0"
                  } transition-opacity duration-300`}
                ></span>
              </div>
            </h1>
          </div>
        </div>

        {/* Search Form - Bottom Attached */}
        <div className="w-full max-w-6xl mx-auto ">
          <div className="text-center mb-4">
            <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-1">
              Search your desire
            </h2>
            <p className="text-sm md:text-base text-gray-700">
              Filter your results by entering your seeking to ensure you find the perfect fit.
            </p>
          </div>

          {/* Search Form */}
          <div className="bg-gradient-to-r from-[#fce8ed] to-[#d6d6d6] backdrop-blur-sm rounded-t-md shadow-2xl p-4 md:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
              {/* Select Category */}
              <div className="flex flex-col">
                <label className="text-xs font-semibold text-gray-700 mb-1.5">
                  Select Category
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg focus:border-red-500 focus:ring-2 focus:ring-red-200 outline-none transition-all duration-300 bg-white text-gray-800 font-medium text-sm"
                >
                  <option value="">Select Category</option>
                  <option value="parts">Auto Parts</option>
                  <option value="accessories">Accessories</option>
                  <option value="tools">Tools</option>
                  <option value="electronics">Electronics</option>
                </select>
              </div>

              {/* Select Model */}
              <div className="flex flex-col">
                <label className="text-xs font-semibold text-gray-700 mb-1.5">
                  Select Model
                </label>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg focus:border-red-500 focus:ring-2 focus:ring-red-200 outline-none transition-all duration-300 bg-white text-gray-800 font-medium text-sm"
                >
                  <option value="">Select Model</option>
                  <option value="2024">2024</option>
                  <option value="2023">2023</option>
                  <option value="2022">2022</option>
                  <option value="2021">2021</option>
                </select>
              </div>

              {/* Type */}
              <div className="flex flex-col">
                <label className="text-xs font-semibold text-gray-700 mb-1.5">
                  Type
                </label>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg focus:border-red-500 focus:ring-2 focus:ring-red-200 outline-none transition-all duration-300 bg-white text-gray-800 font-medium text-sm"
                >
                  <option value="">Select Type</option>
                  <option value="sedan">Sedan</option>
                  <option value="suv">SUV</option>
                  <option value="truck">Truck</option>
                  <option value="van">Van</option>
                </select>
              </div>

              {/* Price */}
              <div className="flex flex-col">
                <label className="text-xs font-semibold text-gray-700 mb-1.5">
                  Price
                </label>
                <select
                  value={selectedPrice}
                  onChange={(e) => setSelectedPrice(e.target.value)}
                  className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg focus:border-red-500 focus:ring-2 focus:ring-red-200 outline-none transition-all duration-300 bg-white text-gray-800 font-medium text-sm"
                >
                  <option value="">Select Price</option>
                  <option value="0-50">$0 - $50</option>
                  <option value="50-100">$50 - $100</option>
                  <option value="100-200">$100 - $200</option>
                  <option value="200+">$200+</option>
                </select>
              </div>

              {/* Search Button */}
              <div className="flex flex-col">
                <label className="text-xs font-semibold text-transparent mb-1.5 hidden lg:block">
                  Search
                </label>
                <button
                  onClick={handleSearch}
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center gap-2 text-sm"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    ></path>
                  </svg>
                  Search
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Banner;
