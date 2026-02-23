"use client";

import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';
import { FaEye, FaShoppingCart, FaHeart } from 'react-icons/fa';

export default function PopularPicks() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const slideInterval = useRef(null);
  const slideContainerRef = useRef(null);

  const [products, setProducts] = useState([]);

  // fetch popular picks from backend
  useEffect(() => {
    const fetchPopular = async () => {
      try {
        const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
        const resp = await fetch(`${API}/api/products?badge=popular_pics&limit=50`);
        const json = await resp.json();
        const items = (json.items || []).map(p => ({
          ...p,
          id: p._id || p.id,
          title: p.title,
          subtitle: p.description || p.subtitle || '',
          originalPrice: p.compareAtPrice ? `৳${p.compareAtPrice}` : null,
          currentPrice: p.price ? `৳${p.price}` : null,
          price: p.price ? `৳${p.price}` : null,
          status: p.availability === 'out_of_stock' ? 'Stock Out' : 'In Stock',
          tag: p.badges && p.badges.includes('hot') ? 'Hot' : null,
          discount: p.compareAtPrice && p.price ? `${Math.round((p.compareAtPrice-p.price)/p.compareAtPrice*100)}% Off` : null,
          image: (p.images && p.images[0] && p.images[0].url) || '/assets/placeholder.svg',
          rating: p.averageRating || 0,
          reviews: `(${p.reviewCount || 0})`,
        }));
        setProducts(items);
      } catch (err) {
        console.error('failed to fetch popular picks', err);
      }
    };
    fetchPopular();
  }, []);

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
          <span className="font-bold">TODAY&apos;S</span> <span className="font-normal">POPULAR PICKS</span>
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
            <Image 
              src="/assets/placeholder.svg" 
              alt="Featured Product"
              width={256} 
              height={256}
              loading="lazy"
              decoding="async"
              onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/assets/placeholder.svg'; }}
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
                  <Image
                    src={encodeURI(product.image)}
                    alt={product.subtitle}
                    width={300}
                    height={300}
                    loading="lazy"
                    decoding="async"
                    onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/assets/placeholder.svg'; }}
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

          
        </div>
      </div>
    </div>
  );
}