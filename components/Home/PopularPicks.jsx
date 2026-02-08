"use client";

import { useState, useEffect, useRef } from 'react';
import { FaEye, FaShoppingCart, FaHeart } from 'react-icons/fa';

export default function PopularPicks() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const slideInterval = useRef(null);
  const slideContainerRef = useRef(null);

  const products = [
    {
      id: 1,
      title: "Interior",
      subtitle: "Steering a car with a manual Wheel",
      originalPrice: "$92.99",
      currentPrice: "$83.99",
      rating: 5,
      reviews: "(5)",
      status: "In Stock",
      tag: "Hot",
      discount: "6% Off",
      category: "Car Wheel",
      image: "/assets/truck/Double Coin/Drive/RR202 10.00R20p-1.webp"
    },
    {
      id: 2,
      title: "Front",
      subtitle: "Toyota Starlet EP-82 HEAD Lights",
      originalPrice: "$100.99",
      currentPrice: "$90.99",
      rating: 5,
      reviews: "(5)",
      status: "In Stock",
      tag: null,
      discount: null,
      category: null,
      image: "/assets/fish/shrimp/shrimp.webp"
    },
    {
      id: 3,
      title: "Fuel",
      subtitle: "Advance 10w30 full synthetic fuel",
      price: "$85.99",
      rating: 4,
      reviews: "(4)",
      status: "Stock Out",
      tag: null,
      discount: null,
      category: null,
      image: "/assets/Metals/Copper/copper1.webp"
    },
    {
      id: 4,
      title: "Wheel",
      subtitle: '14" Urban X Phantom Wheel Cover Set',
      price: "$80.99",
      rating: 5,
      reviews: "(5)",
      status: "In Stock",
      tag: null,
      discount: null,
      category: null,
      image: "/assets/dryFruit/nuts/cashew_roasted.webp"
    }
  ];

  const slidesToShow = 3;
  const totalSlides = Math.ceil(products.length / slidesToShow);

  const startAutoSlide = () => {
    stopAutoSlide();
    slideInterval.current = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % totalSlides);
    }, 5000);
  };

  const stopAutoSlide = () => {
    if (slideInterval.current) {
      clearInterval(slideInterval.current);
    }
  };

  const goToSlide = (index) => {
    setCurrentSlide(index);
    startAutoSlide();
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % totalSlides);
    startAutoSlide();
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
    startAutoSlide();
  };

  useEffect(() => {
    startAutoSlide();
    return () => stopAutoSlide();
  }, []);

  const renderStars = (rating) => {
    return (
      <div className="flex">
        {[...Array(5)].map((_, i) => (
          <span key={i} className={i < rating ? "text-yellow-400" : "text-gray-300"}>
            ★
          </span>
        ))}
      </div>
    );
  };

  const visibleProducts = products.slice(
    currentSlide * slidesToShow,
    (currentSlide + 1) * slidesToShow
  );

  return (
    <div 
      className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
      onMouseEnter={stopAutoSlide}
      onMouseLeave={startAutoSlide}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-3 h-3 bg-red-600 rounded-full"></div>
        <h1 className="text-3xl font-bold text-gray-900">
          <span className="font-bold">TODAY'S</span> <span className="font-normal">POPULAR PICKS</span>
        </h1>
      </div>

      {/* Carousel Container with Left Panel */}
      <div className="relative flex gap-6">
        {/* Left Panel */}
        <div className="hidden lg:block w-64 bg-gray-50 rounded-lg p-6">
          <div className="text-center">
            <p className="text-sm font-semibold text-gray-600 mb-2">Car Wheel</p>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Buy the Grills</h2>
            <button className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition font-medium">
              View All
            </button>
          </div>
          <div className="mt-6">
            <img 
              src="/assets/truck/Double Coin/Drive/RR202 10.00R20p-1.webp" 
              alt="Featured Product" 
              className="w-full h-auto object-contain rounded-lg"
            />
          </div>
        </div>

        {/* Products Grid */}
        <div className="flex-1">
          {/* Navigation Buttons */}
          <button
            onClick={prevSlide}
            className="absolute -left-4 top-1/2 transform -translate-y-1/2 z-10 bg-white rounded-full w-10 h-10 flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow"
          >
            <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <button
            onClick={nextSlide}
            className="absolute -right-4 top-1/2 transform -translate-y-1/2 z-10 bg-white rounded-full w-10 h-10 flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow"
          >
            <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <div 
            ref={slideContainerRef}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 transition-all duration-500 ease-in-out"
          >
            {visibleProducts.map((product) => (
              <div 
                key={product.id} 
                className="bg-white rounded-lg border border-gray-200 overflow-hidden group hover:shadow-xl transition-all duration-300"
              >
                {/* Product Image Container */}
                <div className="relative bg-gray-50 p-6 h-64 flex items-center justify-center overflow-hidden">
                  <img
                    src={product.image}
                    alt={product.subtitle}
                    className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-300"
                  />
                  
                  {/* Tags */}
                  <div className="absolute top-3 left-3 flex flex-col gap-1">
                    {product.discount && (
                      <span className="bg-green-600 text-white text-xs font-bold px-2 py-1 rounded">
                        {product.discount}
                      </span>
                    )}
                    {product.tag && (
                      <span className="bg-red-600 text-white text-xs font-bold px-2 py-1 rounded">
                        {product.tag}
                      </span>
                    )}
                  </div>

                  {/* Hover Icons */}
                  <div className="absolute top-3 right-3 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <button className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md hover:bg-red-600 hover:text-white transition-colors">
                      <FaEye className="w-4 h-4" />
                    </button>
                    <button className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md hover:bg-red-600 hover:text-white transition-colors">
                      <FaShoppingCart className="w-4 h-4" />
                    </button>
                    <button className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md hover:bg-red-600 hover:text-white transition-colors">
                      <FaHeart className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Stock Status Badge */}
                  {product.status === "Stock Out" && (
                    <div className="absolute inset-0 bg-black bg-opacity-10 flex items-center justify-center">
                      <span className="bg-red-600 text-white px-4 py-2 rounded font-semibold">
                        Stock Out
                      </span>
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <div className="p-4">
                  <p className="text-sm text-gray-600 mb-1">{product.title}</p>
                  <h3 className="text-base font-semibold text-gray-900 mb-1 line-clamp-2">
                    {product.subtitle}
                  </h3>

                  {/* Price */}
                  <div className="mb-2"> 
                    {product.currentPrice ? (
                      <div className="flex items-center gap-1">
                        <span className="text-xl font-bold text-red-600">{product.currentPrice}</span>
                        <span className="text-sm text-gray-500 line-through">{product.originalPrice}</span>
                      </div>
                    ) : (
                      <span className="text-xl font-bold text-red-600">{product.price}</span>
                    )}
                  </div>

                  {/* Rating and Reviews */}
                  <div className="flex items-center gap-2 mb-3">
                    {renderStars(product.rating)}
                    <span className="text-sm text-gray-600">{product.reviews}</span>
                  </div>

                  {/* Stock Status */}
                  {product.status === "In Stock" && (
                    <div className="flex items-center gap-2 text-green-600 text-sm mb-3">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                      </svg>
                      <span className="font-medium">{product.status}</span>
                    </div>
                  )}

                  {/* Add to Cart Button - Visible on Hover */}
                  <button className="w-full bg-red-600 text-white py-2 rounded-md font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-red-700">
                    Add to Cart
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Slide Indicators */}
          <div className="flex justify-center gap-3 mt-8">
            {Array.from({ length: totalSlides }).map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`w-3 h-3 rounded-full transition-all ${
                  index === currentSlide 
                    ? "bg-red-600 w-8" 
                    : "bg-gray-300 hover:bg-gray-400"
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}