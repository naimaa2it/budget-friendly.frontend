"use client";

import Image from 'next/image';
import { useState, useEffect } from 'react';
import { FaHeart, FaShuffle, FaChevronUp, FaChevronDown } from 'react-icons/fa6';
import { useRouter } from 'next/navigation';
import { useCart } from '@/components/context/CartContext';
import { useUser } from '@/components/context/UserContext';
import AuthModal from '../authentication/AuthModal';

export default function DealsOfDay() {
  const [selectedImage, setSelectedImage] = useState(0);
  const [sidebarScroll, setSidebarScroll] = useState(0);
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  const [productImages, setProductImages] = useState(['/assets/placeholder.svg']);
  const [mainProduct, setMainProduct] = useState(null);
  const [bestsellerProducts, setBestsellerProducts] = useState([]);
  const router = useRouter();
  const { addToCart, addToWishlist } = useCart();
  const { user } = useUser();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [pendingWishlist, setPendingWishlist] = useState(null);

  // fetch deals-of-day product (pick first) and bestseller list
  useEffect(() => {
    const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    const fetchData = async () => {
      try {
        const dealResp = await fetch(`${API}/api/products?badge=deals_of_the_day&limit=1`);
        const dealJson = await dealResp.json();
        const deal = (dealJson.items || [])[0];
        if (deal) {
          setMainProduct(deal);
          setProductImages((deal.images || []).map(i => i.url));
          // optionally set countdown from deal.expiry or similar; leaving existing timer
        }
        const bestResp = await fetch(`${API}/api/products?badge=bestseller&limit=20`);
        const bestJson = await bestResp.json();
        const bests = (bestJson.items || []).map(p => ({
          id: p._id || p.id,
          name: p.title,
          // keep numeric price for calculations and attach display string if needed
          price: typeof p.price === 'number' ? p.price : parseFloat(p.price) || 0,
          displayPrice: p.price ? `৳${p.price}` : '',
          rating: p.averageRating || 0,
          image: (p.images && p.images[0] && p.images[0].url) || '/assets/placeholder.svg'
        }));
        setBestsellerProducts(bests);
      } catch (err) {
        console.error('error loading deals/bestsellers', err);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        const newTime = { ...prev };
        
        if (newTime.seconds > 0) {
          newTime.seconds -= 1;
        } else {
          newTime.seconds = 59;
          if (newTime.minutes > 0) {
            newTime.minutes -= 1;
          } else {
            newTime.minutes = 59;
            if (newTime.hours > 0) {
              newTime.hours -= 1;
            } else {
              newTime.hours = 23;
              if (newTime.days > 0) {
                newTime.days -= 1;
              }
            }
          }
        }
        
        return newTime;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);
  
  // handle pending wishlist after login
  useEffect(() => {
    if (user && pendingWishlist) {
      addToWishlist(pendingWishlist);
      setPendingWishlist(null);
    }
  }, [user, pendingWishlist, addToWishlist]);

  const handleSidebarScroll = (direction) => {
    const itemsToShow = 4;
    if (direction === 'down' && sidebarScroll < bestsellerProducts.length - itemsToShow) {
      setSidebarScroll(prev => prev + 1);
    } else if (direction === 'up' && sidebarScroll > 0) {
      setSidebarScroll(prev => prev - 1);
    }
  };

  // reset selected thumbnail when images change
  useEffect(() => {
    setSelectedImage(0);
  }, [productImages]);

  const renderStars = (rating) => {
    return (
      <div className="flex items-center">
        {[...Array(5)].map((_, i) => (
          <span
            key={i}
            className={`${i < rating ? 'text-red-500' : 'text-gray-300'}`}
          >
            ★
          </span>
        ))}
      </div>
    );
  };

  const visibleBestsellers = bestsellerProducts.slice(sidebarScroll, sidebarScroll + 4);

  if (!mainProduct) {
    return <div className="py-24 text-center text-gray-500">Loading deal...</div>;
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-3 h-3 bg-red-600 rounded-full"></div>
        <h1 className="text-3xl font-bold text-gray-900">
          <span className="font-bold">DEAL OF</span> <span className="font-normal">THE DAY</span>
        </h1>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Product Section - Left Side */}
        <div className="lg:col-span-9">
          <div className="border-2 border-red-500 rounded-lg p-4 bg-gradient-to-br from-pink-50 to-white h-full">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Product Image Section */}
              <div>
                {/* Main Product Image */}
                <div className="relative bg-white rounded-lg mb-4 h-96 flex items-center justify-center">
                  <Image
                    src={encodeURI(productImages[selectedImage])}
                    alt="Product"
                    loading="lazy"
                    decoding="async"
                    width={1400}
                    height={1200}
                    onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/assets/placeholder.svg'; }}
                    className="absolute inset-0 w-full h-full object-contain"
                  />
                </div>

                {/* Thumbnail Gallery */}
                <div className="grid grid-cols-5 gap-2">
                  {productImages.map((img, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={`border-2 rounded-lg p-1 hover:border-red-500 transition ${
                        selectedImage === index ? 'border-red-500' : 'border-gray-300'
                      }`}
                    >
                      <Image
                        src={encodeURI(img)}
                        alt={`Thumbnail ${index + 1}`}
                        loading="lazy"
                        decoding="async"
                        width={80}
                        height={80}
                        onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/assets/placeholder.svg'; }}
                        className="w-full h-14 object-contain"
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Product Details Section */}
              <div>
                {/* Rating and Reviews */}
                <div className="flex items-center gap-2 mb-3">
                  {renderStars(mainProduct?.averageRating || 0)}
                  <span className="text-gray-600 text-sm">({mainProduct?.reviewCount || 0}) Review</span>
                </div>

                {/* Product Title */}
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  {mainProduct?.title || 'Deal Product'}
                </h2>

                {/* Price */}
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-3xl font-bold text-red-600">{mainProduct?.price ? `৳${mainProduct.price}` : '-'}</span>
                  {mainProduct?.compareAtPrice && (
                    <span className="text-xl text-gray-500 line-through">৳{mainProduct.compareAtPrice}</span>
                  )}
                </div>

                {/* Availability and Units Sold */}
                <div className="flex items-center gap-8 mb-6">
                  <div>
                    <span className="text-gray-600">Available: </span>
                    <span className="font-bold text-gray-900">{mainProduct?.inventory || 0}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Units Sold: </span>
                    <span className="font-bold text-gray-900">{mainProduct?.monthlySold || 0}</span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
                  <div className="bg-red-600 h-2 rounded-full" style={{ width: '30%' }}></div>
                </div>

                {/* Countdown Timer */}
                <div className="flex gap-4 mb-6">
                  <div className="text-center">
                    <div className="bg-gray-900 text-white rounded px-3 py-2 font-bold text-lg">
                      {timeLeft.days}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">Days</div>
                  </div>
                  <div className="text-center">
                    <div className="bg-gray-900 text-white rounded px-3 py-2 font-bold text-lg">
                      {timeLeft.hours}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">Hrs</div>
                  </div>
                  <div className="text-center">
                    <div className="bg-gray-900 text-white rounded px-3 py-2 font-bold text-lg">
                      {timeLeft.minutes}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">Mins</div>
                  </div>
                  <div className="text-center">
                    <div className="bg-gray-900 text-white rounded px-3 py-2 font-bold text-lg">
                      {timeLeft.seconds}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">Secs</div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 mb-4">
                  <button
                    onClick={() => {
                      if (mainProduct) addToCart(mainProduct, 1);
                    }}
                    className="flex-1 bg-gray-900 text-white py-3 rounded-lg font-semibold hover:bg-red-600 transition"
                  >
                    Add To Cart
                  </button>
                  <button
                    onClick={() => {
                      if (!user) {
                        setPendingWishlist(mainProduct);
                        setShowAuthModal(true);
                      } else if (mainProduct) {
                        addToWishlist(mainProduct);
                      }
                    }}
                    className="w-12 h-12 border-2 border-gray-300 rounded-lg flex items-center justify-center hover:border-red-500 hover:text-red-500 transition"
                  >
                    <FaHeart />
                  </button>
                  <button className="w-12 h-12 border-2 border-gray-300 rounded-lg flex items-center justify-center hover:border-red-500 hover:text-red-500 transition">
                    <FaShuffle />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bestseller Sidebar - Right Side */}
        <div className="lg:col-span-3">
          <div className="flex flex-col h-full">
            <div className="bg-red-600 text-white rounded-t-lg p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold">Bestseller product</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleSidebarScroll('up')}
                    disabled={sidebarScroll === 0}
                    className="w-7 h-7 bg-white text-red-600 rounded flex items-center justify-center hover:bg-gray-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FaChevronUp />
                  </button>
                  <button
                    onClick={() => handleSidebarScroll('down')}
                    disabled={sidebarScroll >= bestsellerProducts.length - 4}
                    className="w-7 h-7 bg-white text-red-600 rounded flex items-center justify-center hover:bg-gray-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FaChevronDown />
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-b-lg px-3 py-1 space-y-2 flex-1">
              {visibleBestsellers.map((product) => (
                <div
                  key={product.id}
                  onClick={() => router.push(`/product/${product.id}`)}
                  className="flex gap-4 pb-4 border-b border-gray-200 last:border-b-0 cursor-pointer hover:bg-gray-50 transition"
                >
                  <Image
                    src={product.image}
                    alt={product.name}
                    loading="lazy"
                    width={80}
                    height={80}
                    className="w-20 h-20 object-contain bg-gray-50 rounded"
                  />
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 mb-1">{product.name}</h4>
                    <div className="flex items-center gap-1 mb-1 text-sm">
                      {renderStars(product.rating)}
                    </div>
                    <p className="text-red-600 font-bold">৳{product.price}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}