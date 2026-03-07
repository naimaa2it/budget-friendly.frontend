"use client";

import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { FaEye, FaShoppingCart, FaHeart } from 'react-icons/fa';
import { useCart } from '@/components/context/CartContext';
import { useUser } from '@/components/context/UserContext';
import AuthModal from '@/components/auth/AuthModal';
import Skeleton from '@/components/ui/Skeleton';

export default function PopularPicks() {
  const router = useRouter();
  const { addToCart, addToWishlist } = useCart();
  const { user } = useUser();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [pendingWishlist, setPendingWishlist] = useState(null);

  const [currentSlide, setCurrentSlide] = useState(0);
  const slideInterval = useRef(null);
  const slideContainerRef = useRef(null);

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hoveredId, setHoveredId] = useState(null); // for image swap on hover/click

  // fetch popular picks from backend
  useEffect(() => {
    const fetchPopular = async () => {
      setLoading(true);
      try {
        const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
        const resp = await fetch(`${API}/api/products?badge=popular_pics&limit=50`);
        const json = await resp.json();
        const items = (json.items || []).map(p => ({
          ...p,
          id: p._id || p.id,
          title: p.title,
          subtitle: p.description || p.subtitle || '',
          // human-readable strings for display in the carousel
          originalPrice: p.compareAtPrice ? `৳${p.compareAtPrice}` : null,
          currentPrice: p.price ? `৳${p.price}` : null,
          // keep the raw numeric values for cart calculations
          price: typeof p.price === 'number' ? p.price : parseFloat(p.price) || 0,
          compareAtPrice: typeof p.compareAtPrice === 'number' ? p.compareAtPrice : parseFloat(p.compareAtPrice) || (p.price || 0),
          status: p.availability === 'out_of_stock' ? 'Stock Out' : 'In Stock',
          badges: p.badges || [],
          discount: p.compareAtPrice && p.price && p.compareAtPrice > p.price
            ? Math.round((p.compareAtPrice - p.price) / p.compareAtPrice * 100)
            : null,
          image: (p.Images && p.Images[0] && p.Images[0].url) || (p.images && p.images[0] && p.images[0].url) || '/assets/placeholder.svg',
          secondImage: (p.images && p.images[1] && p.images[1].url) || null,
          rating: p.averageRating || 0,
          reviews: `(${p.reviewCount || 0})`,
        }));
        setProducts(items);
      } catch (err) {
        console.error('failed to fetch popular picks', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPopular();
  }, []);

  const slidesToShow = 3;
  // number of "pages" we can scroll through. we still wrap using modulo
  const totalSlides = products.length > 0 ? Math.ceil(products.length / slidesToShow) : 1;

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

  const goToSlide = (index, manual = false) => {
    setCurrentSlide(index);
    if (!manual) startAutoSlide();
  };

  const nextSlide = (manual = false) => {
    setCurrentSlide((prev) => (prev + 1) % totalSlides);
    if (!manual) startAutoSlide();
  };

  const prevSlide = (manual = false) => {
    setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
    if (!manual) startAutoSlide();
  };

  useEffect(() => {
    startAutoSlide();
    return () => stopAutoSlide();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // if login happens and a wishlist item was pending
  useEffect(() => {
    if (user && pendingWishlist) {
      addToWishlist(pendingWishlist);
      setPendingWishlist(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, pendingWishlist]);

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

  // build a sliding window that wraps around the products array
  const visibleProducts = [];
  if (products.length > 0) {
    for (let i = 0; i < slidesToShow; i++) {
      const idx = (currentSlide * slidesToShow + i) % products.length;
      visibleProducts.push(products[idx]);
    }
  }

  return (
    <>
    <section className="w-full bg-[#FFF5ED] ">
    <div 
      className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 "
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
            onClick={() => prevSlide(true)}
            className="absolute -left-4 top-1/2 transform -translate-y-1/2 z-10 bg-white rounded-full w-10 h-10 flex items-center justify-center shadow-lg hover:shadow-xl hover:border hover:border-red-600 transition-shadow"
          >
            <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <button
            onClick={() => nextSlide(true)}
            className="absolute -right-4 top-1/2 transform -translate-y-1/2 z-10 bg-white rounded-full w-10 h-10 flex items-center justify-center shadow-lg hover:shadow-xl hover:border hover:border-red-600 transition-shadow"
          >
            <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <div 
            ref={slideContainerRef}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 transition-all duration-500 ease-in-out"
          >
            {loading ? (
              Array(3).fill(0).map((_, i) => (
                <div key={i} className="bg-white border border-[#F1E4D8] rounded-xl shadow-sm overflow-hidden group hover:shadow-xl transition-all duration-300 cursor-pointer h-64">
                  <Skeleton className="w-full h-full" />
                </div>
              ))
            ) : visibleProducts.map((product) => (
              <div 
                key={product.id} 
                onClick={() => router.push(`/product/${product.id}`)}
                onMouseEnter={() => setHoveredId(product.id)}
                onMouseLeave={() => setHoveredId(null)}
                onMouseDown={() => setHoveredId(product.id)}
                className="bg-white border border-[#F1E4D8] rounded-xl shadow-sm overflow-hidden group hover:shadow-xl transition-all duration-300 cursor-pointer"
              >
                {/* Product Image Container */}
                <div className="relative bg-white  rounded-xl p-6 h-54 flex items-center justify-center overflow-hidden">
                  <Image
                    src={encodeURI(
                      hoveredId === product.id && product.secondImage
                        ? product.secondImage
                        : product.image
                    )}
                    alt={product.subtitle}
                    width={300}
                    height={300}
                    loading="lazy"
                    decoding="async"
                    onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/assets/placeholder.svg'; }}
                    className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-300"
                  />
                  
                  {/* Discount badge — top left (always visible) */}
                  {product.discount && (
                    <div className="absolute top-1.5 left-1.5 z-10 pointer-events-none">
                      <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-sm leading-none">
                        -{product.discount}%
                      </span>
                    </div>
                  )}

                  {/* Badge tags — top right, hidden on hover */}
                  {(() => {
                    const BADGE_PRIORITY = ['hot','best_seller','new_arrival','trending','limited','popular_pics','deals_of_the_day'];
                    const BADGE_MAP = {
                      best_seller:      { label: 'Best Seller', cls: 'bg-yellow-400 text-yellow-900' },
                      hot:              { label: 'Hot',         cls: 'bg-red-500 text-white' },
                      new_arrival:      { label: 'New',         cls: 'bg-blue-500 text-white' },
                      trending:         { label: 'Trending',    cls: 'bg-purple-500 text-white' },
                      limited:          { label: 'Limited',     cls: 'bg-orange-500 text-white' },
                      popular_pics:     { label: 'Popular',     cls: 'bg-pink-500 text-white' },
                      deals_of_the_day: { label: 'Deal',        cls: 'bg-emerald-500 text-white' },
                    };
                    const visible = BADGE_PRIORITY.filter(b => (product.badges || []).includes(b)).slice(0, 2);
                    return visible.length > 0 ? (
                      <div className="absolute top-1.5 right-1.5 flex flex-col items-end gap-0.5 pointer-events-none group-hover:opacity-0 transition-opacity duration-200">
                        {visible.map(b => (
                          <span key={b} className={`${BADGE_MAP[b].cls} text-[9px] font-bold px-1.5 py-0.5 rounded-sm leading-none`}>
                            {BADGE_MAP[b].label}
                          </span>
                        ))}
                      </div>
                    ) : null;
                  })()}

                  {/* Hover Icons */}
                  <div className="absolute top-3 right-3 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <button 
                      onClick={(e) => { e.stopPropagation(); router.push(`/product/${product.id}`); }}
                      className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md hover:bg-red-600 hover:text-white transition-colors"
                      title="View"
                    >
                      <FaEye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); addToCart(product, 1); }}
                      className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md hover:bg-red-600 hover:text-white transition-colors"
                      title="Add to cart"
                    >
                      <FaShoppingCart className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!user) {
                          setPendingWishlist(product);
                          setShowAuthModal(true);
                        } else {
                          addToWishlist(product);
                        }
                      }}
                      className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md hover:bg-red-600 hover:text-white transition-colors"
                      title="Add to wishlist"
                    >
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
                <div className="p-4 relative">
                  <p className="text-sm text-gray-600 mb-1">{product.title}</p>
                  <h3 className="text-base font-semibold text-gray-900 mb-1 line-clamp-2">
                    {product.subtitle}
                  </h3>
                  {/* Price */}
                  <div className="mb-2 flex items-baseline gap-2 flex-wrap">
                    <span className="text-lg font-bold text-red-600">
                      ৳{product.price?.toLocaleString()}
                    </span>
                    {product.compareAtPrice && product.compareAtPrice > product.price && (
                      <span className="text-sm text-gray-400 line-through">
                        ৳{product.compareAtPrice?.toLocaleString()}
                      </span>
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

                  {/* Add to Cart Button - Absolute, appears on hover */}
                  <button
                    onClick={(e) => { e.stopPropagation(); addToCart(product, 1); }}
                    className="absolute bottom-4 left-4 right-4 bg-red-600 text-white py-2 rounded-md font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-red-700"
                  >
                    Add to Cart
                  </button>
                </div>
              </div>
            ))}
          </div>

          
        </div>
      </div>
    
    <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </div>
    </section>
    </>
  );
}