"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const Banner = () => {
  const [displayText, setDisplayText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showCursor, setShowCursor] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSubcategory, setSelectedSubcategory] = useState("");
  const [categories, setCategories] = useState([]);
  const [subcategoriesList, setSubcategoriesList] = useState([]);
  const [subSubcategoriesList, setSubSubcategoriesList] = useState([]);
  const [selectedModel, setSelectedModel] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [selectedPrice, setSelectedPrice] = useState("");

  const fullText = "Ultimate Protection";

  // fetch categories for search
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API}/api/products/categories`);
        const json = await res.json();
        const tops = (json.categories || []).map(c => ({
          _id: c._id,
          name: c.name,
          slug: c.slug,
          children: c.children || []
        }));
        setCategories(tops);
      } catch (err) {
        console.error('banner fetch categories', err);
      }
    })();
  }, []);

  // update subcategories when selectedCategory changes
  useEffect(() => {
    if (!selectedCategory) {
      setSubcategoriesList([]);
      setSelectedSubcategory("");
      setSubSubcategoriesList([]);
      return;
    }
    const cat = categories.find(c => c._id === selectedCategory || c.slug === selectedCategory);
    const subs = cat ? cat.children : [];
    setSubcategoriesList(subs);
    setSelectedSubcategory("");
    setSubSubcategoriesList([]);
  }, [selectedCategory, categories]);

  // update sub-subcategories when selectedSubcategory changes
  useEffect(() => {
    if (!selectedSubcategory) {
      setSubSubcategoriesList([]);
      setSelectedType("");
      return;
    }
    // find subcategory inside existing subcategoriesList or categories
    let sub = subcategoriesList.find(s => s._id === selectedSubcategory || s.slug === selectedSubcategory);
    if (!sub) {
      // maybe need to search in all categories
      for (const c of categories) {
        const found = (c.children||[]).find(s => s._id===selectedSubcategory || s.slug===selectedSubcategory);
        if (found) { sub = found; break; }
      }
    }
    const subs = sub ? sub.children || [] : [];
    setSubSubcategoriesList(subs);
    setSelectedType("");
  }, [selectedSubcategory, subcategoriesList, categories]);

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
    // assemble query parameters based on selections
    const params = new URLSearchParams();
    if (selectedCategory) params.append('category', selectedCategory);
    if (selectedSubcategory) params.append('subcategory', selectedSubcategory);
    if (selectedType) params.append('type', selectedType);
    if (selectedPrice) params.append('price', selectedPrice);

    const url = `/products${params.toString() ? `?${params.toString()}` : ''}`;
    router.push(url);
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
              {/* Select Main Category */}
              <div className="flex flex-col">
                <label className="text-xs font-semibold text-gray-700 mb-1.5">
                  Category
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg focus:border-red-500 focus:ring-2 focus:ring-red-200 outline-none transition-all duration-300 bg-white text-gray-800 font-medium text-sm"
                >
                  <option value="">All Categories</option>
                  {categories.map(c => (
                    <option key={c._id} value={c._id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Select Subcategory */}
              <div className="flex flex-col">
                <label className="text-xs font-semibold text-gray-700 mb-1.5">
                  Subcategory
                </label>
                <select
                  value={selectedSubcategory}
                  onChange={(e) => setSelectedSubcategory(e.target.value)}
                  disabled={!subcategoriesList.length}
                  className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg focus:border-red-500 focus:ring-2 focus:ring-red-200 outline-none transition-all duration-300 bg-white text-gray-800 font-medium text-sm"
                >
                  <option value="">All Subcategories</option>
                  {subcategoriesList.map(s => (
                    <option key={s._id} value={s._id}>{s.name}</option>
                  ))}
                </select>
              </div>

              {/* Type (sub‑subcategory) */}
              <div className="flex flex-col">
                <label className="text-xs font-semibold text-gray-700 mb-1.5">
                  Type
                </label>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  disabled={!subSubcategoriesList.length}
                  className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg focus:border-red-500 focus:ring-2 focus:ring-red-200 outline-none transition-all duration-300 bg-white text-gray-800 font-medium text-sm"
                >
                  <option value="">{subSubcategoriesList.length ? 'Select Type' : 'No types available'}</option>
                  {subSubcategoriesList.map(s => (
                    <option key={s._id} value={s._id}>{s.name}</option>
                  ))}
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
