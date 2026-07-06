"use client";

import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { FaEye, FaShoppingCart, FaHeart, FaBell } from "react-icons/fa";
import { useCart } from "@/components/context/CartContext";
import { useUser } from "@/components/context/UserContext";
import AuthModal from "@/components/auth/AuthModal";
import Skeleton from "@/components/ui/Skeleton";
import WaitlistModal from "@/components/cart/WaitlistModal";
import Link from "next/link";
import { getDisplayPrice } from "@/lib/pricing";
import { useLanguage } from "@/components/context/LanguageContext";

export default function PopularPicks() {
  const router = useRouter();
  const { addToCart, addToWishlist } = useCart();
  const { user } = useUser();
  const { t } = useLanguage();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [pendingWishlist, setPendingWishlist] = useState(null);
  const [waitlistProduct, setWaitlistProduct] = useState(null);

  const [currentSlide, setCurrentSlide] = useState(0);
  const slideInterval = useRef(null);
  const slideContainerRef = useRef(null);

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hoveredId, setHoveredId] = useState(null);
  const [activeImageIndex, setActiveImageIndex] = useState({});
  const [promoPanels, setPromoPanels] = useState([]);
  const [slidesToShow, setSlidesToShow] = useState(2);

  // fetch popular picks from backend
  useEffect(() => {
    const API = process.env.NEXT_PUBLIC_API_URL || "https://api.pickob.com";
    const normalizeProduct = (p) => {
      // Show the product's own main price — never a variant's price.
      // Only fall back to variant pricing when the product has no main price.
      const hasMainPrice = Number(p.price) > 0;
      const variantPricing = getDisplayPrice(p);
      const price = hasMainPrice ? Number(p.price) : variantPricing.price;
      const compareAtPrice = hasMainPrice
        ? Number(p.compareAtPrice) > 0
          ? Number(p.compareAtPrice)
          : null
        : variantPricing.compareAtPrice;
      const discountPct =
        compareAtPrice && compareAtPrice > price
          ? Math.round(((compareAtPrice - price) / compareAtPrice) * 100)
          : null;

      // Collect every image so the card can page through them via dots.
      const gallery = (
        (p.Images && p.Images.length ? p.Images : p.images) || []
      )
        .map((im) => im && im.url)
        .filter(Boolean);

      return {
        ...p,
        id: p._id || p.id,
        title: p.title,
        subtitle: p.description || p.subtitle || "",
        originalPrice: compareAtPrice ? `৳${compareAtPrice}` : null,
        currentPrice: price ? `৳${price}` : null,
        price,
        compareAtPrice: compareAtPrice || price,
        status: p.availability === "out_of_stock" ? "Stock Out" : "In Stock",
        badges: p.badges || [],
        discount: discountPct,
        image: gallery[0] || "/assets/placeholder.svg",
        secondImage: gallery[1] || null,
        images: gallery.length ? gallery : ["/assets/placeholder.svg"],
        rating: p.averageRating || 0,
        reviews: `(${p.reviewCount || 0})`,
      };
    };

    const fetchPopular = async () => {
      setLoading(true);
      try {
        // First check if any promo panel has manually selected products
        let items = [];
        try {
          const panelResp = await fetch(`${API}/api/promo-panels`);
          const panelJson = await panelResp.json();
          const firstActive = (panelJson.items || []).find(
            (p) =>
              p.isActive &&
              Array.isArray(p.productIds) &&
              p.productIds.length > 0,
          );
          if (firstActive) {
            items = firstActive.productIds.map(normalizeProduct);
          }
        } catch {
          /* ignore */
        }

        // Fall back to badge-based fetch
        if (items.length === 0) {
          const resp = await fetch(
            `${API}/api/products?badge=popular_pics&limit=50`,
          );
          const json = await resp.json();
          items = (json.items || []).map(normalizeProduct);
        }

        setProducts(items);
      } catch (err) {
        console.error("failed to fetch popular picks", err);
      } finally {
        setLoading(false);
      }
    };

    const fetchPromoPanel = async () => {
      try {
        const resp = await fetch(`${API}/api/promo-panels`);
        const json = await resp.json();
        const items = Array.isArray(json.items) ? json.items : [];
        setPromoPanels(items);
      } catch {
        setPromoPanels([]);
      }
    };

    fetchPopular();
    fetchPromoPanel();
  }, []);

  // number of "pages" we can scroll through. we still wrap using modulo
  const totalSlides =
    products.length > 0 ? Math.ceil(products.length / slidesToShow) : 1;
  const activePromoPanel =
    promoPanels.length > 0
      ? promoPanels[currentSlide % promoPanels.length]
      : null;

  useEffect(() => {
    const updateSlidesToShow = () => {
      if (window.innerWidth < 640) {
        setSlidesToShow(2);
      } else if (window.innerWidth < 1024) {
        setSlidesToShow(2);
      } else {
        setSlidesToShow(3);
      }
    };

    updateSlidesToShow();
    window.addEventListener("resize", updateSlidesToShow);
    return () => window.removeEventListener("resize", updateSlidesToShow);
  }, []);

  useEffect(() => {
    if (currentSlide >= totalSlides) {
      setCurrentSlide(0);
    }
  }, [currentSlide, totalSlides]);

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
  }, [totalSlides]);

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
          <span
            key={i}
            className={i < rating ? "text-yellow-400" : "text-gray-300"}
          >
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
          className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8"
          onMouseEnter={stopAutoSlide}
          onMouseLeave={startAutoSlide}
        >
          {/* Header */}
          <div className="flex items-center justify-between gap-3 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-red-600 rounded-full"></div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                {t("home.popular_picks")}
              </h1>
            </div>
            <Link
              href="/tag/popular-pics/"
              className="text-md text-rose-500 font-semibold hover:underline whitespace-nowrap"
            >
              {t("home.view_all")}
            </Link>
          </div>

          {/* Carousel Container with Left Panel */}
          <div className="relative flex gap-6 items-stretch">
            {/* Left Panel — shown only when a promo panel is configured */}
            {activePromoPanel && (
              <div className="hidden lg:block w-64 self-stretch">
                <div className="relative h-full rounded-lg overflow-hidden">
                  <Image
                    src={
                      activePromoPanel.image?.url || "/assets/placeholder.svg"
                    }
                    alt={activePromoPanel.title || "Promo"}
                    fill
                    sizes="256px"
                    loading="lazy"
                    decoding="async"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = "/assets/placeholder.svg";
                    }}
                    className="object-cover"
                  />

                  <div className="absolute inset-0 z-10 p-4 text-center flex flex-col justify-end">
                    {activePromoPanel.title && (
                      <h2 className="text-xl font-bold text-orange-600 mb-1">
                        {activePromoPanel.title}
                      </h2>
                    )}
                    {activePromoPanel.buttonText &&
                      activePromoPanel.buttonLink && (
                        <a
                          href={activePromoPanel.buttonLink}
                          className="inline-block px-6 py-1.5 bg-red-600 text-white rounded-md hover:bg-red-700 transition font-medium self-center"
                        >
                          {activePromoPanel.buttonText}
                        </a>
                      )}
                  </div>
                </div>
              </div>
            )}

            {/* Products Grid */}
            <div className="relative flex-1 self-stretch">
              {/* Navigation Buttons */}
              <button
                onClick={() => prevSlide(true)}
                className="absolute left-1 sm:-left-4 top-1/2 transform -translate-y-1/2 z-10 bg-white rounded-full w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center shadow-lg hover:shadow-xl hover:border hover:border-red-600 transition-shadow"
              >
                <svg
                  className="w-4 h-4 text-gray-700"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>

              <button
                onClick={() => nextSlide(true)}
                className="absolute right-1 sm:-right-4 top-1/2 transform -translate-y-1/2 z-10 bg-white rounded-full w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center shadow-lg hover:shadow-xl hover:border hover:border-red-600 transition-shadow"
              >
                <svg
                  className="w-4 h-4 text-gray-700"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>

              <div
                ref={slideContainerRef}
                className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 transition-all duration-500 ease-in-out"
              >
                {loading
                  ? Array(slidesToShow)
                      .fill(0)
                      .map((_, i) => (
                        <div
                          key={i}
                          className="bg-white border border-[#F1E4D8] rounded-xl shadow-sm overflow-hidden group hover:shadow-xl transition-all duration-300 cursor-pointer h-full"
                        >
                          <Skeleton className="w-full h-full" />
                        </div>
                      ))
                  : visibleProducts.map((product, index) => (
                      <div
                        key={`${product.id}-${currentSlide}-${index}`}
                        onClick={() => router.push(`/product/${product.id}/`)}
                        onMouseEnter={() => setHoveredId(product.id)}
                        onMouseLeave={() => setHoveredId(null)}
                        onMouseDown={() => setHoveredId(product.id)}
                        className="bg-white border border-[#F1E4D8] rounded-xl shadow-sm overflow-hidden group hover:shadow-xl transition-all duration-300 cursor-pointer h-full flex flex-col"
                      >
                        {/* Product Image Container */}
                        <div className="relative bg-white  rounded-xl p-6 h-54 flex items-center justify-center overflow-hidden">
                          <Image
                            src={encodeURI(
                              activeImageIndex[product.id] != null
                                ? product.images[activeImageIndex[product.id]]
                                : hoveredId === product.id &&
                                    product.secondImage
                                  ? product.secondImage
                                  : product.image,
                            )}
                            alt={product.subtitle}
                            width={300}
                            height={300}
                            loading="lazy"
                            decoding="async"
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = "/assets/placeholder.svg";
                            }}
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
                            const BADGE_PRIORITY = [
                              "hot",
                              "best_seller",
                              "new_arrival",
                              "trending",
                              "limited",
                              "popular_pics",
                              "deals_of_the_day",
                            ];
                            const BADGE_MAP = {
                              best_seller: {
                                label: "Best Seller",
                                cls: "bg-yellow-400 text-yellow-900",
                              },
                              hot: {
                                label: "Hot",
                                cls: "bg-red-500 text-white",
                              },
                              new_arrival: {
                                label: "New",
                                cls: "bg-blue-500 text-white",
                              },
                              trending: {
                                label: "Trending",
                                cls: "bg-purple-500 text-white",
                              },
                              limited: {
                                label: "Limited",
                                cls: "bg-orange-500 text-white",
                              },
                              popular_pics: {
                                label: "Popular",
                                cls: "bg-pink-500 text-white",
                              },
                              deals_of_the_day: {
                                label: "Deal",
                                cls: "bg-emerald-500 text-white",
                              },
                            };
                            const visible = BADGE_PRIORITY.filter((b) =>
                              (product.badges || []).includes(b),
                            ).slice(0, 2);
                            return visible.length > 0 ? (
                              <div className="absolute top-1.5 right-1.5 flex flex-col items-end gap-0.5 pointer-events-none group-hover:opacity-0 transition-opacity duration-200">
                                {visible.map((b) => (
                                  <span
                                    key={b}
                                    className={`${BADGE_MAP[b].cls} text-[9px] font-bold px-1.5 py-0.5 rounded-sm leading-none`}
                                  >
                                    {BADGE_MAP[b].label}
                                  </span>
                                ))}
                              </div>
                            ) : null;
                          })()}

                          {/* Hover Icons */}
                          <div className="absolute top-3 right-3 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/product/${product.id}/`);
                              }}
                              className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md hover:bg-red-600 hover:text-white transition-colors"
                              title="View"
                            >
                              <FaEye className="w-4 h-4" />
                            </button>
                            {product.status !== "Stock Out" && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  addToCart(product, 1);
                                }}
                                className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md hover:bg-red-600 hover:text-white transition-colors"
                                title="Add to cart"
                              >
                                <FaShoppingCart className="w-4 h-4" />
                              </button>
                            )}
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

                          {/* Image dots — click to browse all product images */}
                          {product.images && product.images.length > 1 && (
                            <div className="absolute bottom-2 left-0 right-0 z-20 flex justify-center gap-1.5">
                              {product.images.map((_, i) => (
                                <button
                                  key={i}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveImageIndex((prev) => ({
                                      ...prev,
                                      [product.id]: i,
                                    }));
                                  }}
                                  aria-label={`View image ${i + 1}`}
                                  className={`h-2 rounded-full transition-all ${
                                    (activeImageIndex[product.id] ?? 0) === i
                                      ? "w-4 bg-red-600"
                                      : "w-2 bg-gray-300 hover:bg-gray-400"
                                  }`}
                                />
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Product Info */}
                        <div className="px-4 py-2 relative flex-1">
                          <p className="text-sm text-gray-600 mb-1">
                            {product.title}
                          </p>
                          <h3 className="text-base font-semibold text-gray-900 mb-1 line-clamp-2">
                            {product.subtitle}
                          </h3>
                          {/* Price */}
                          <div className="mb-2 flex items-baseline gap-2 flex-wrap">
                            <span className="text-lg font-bold text-red-600">
                              ৳{product.price?.toLocaleString()}
                            </span>
                            {product.compareAtPrice &&
                              product.compareAtPrice > product.price && (
                                <span className="text-sm text-gray-400 line-through">
                                  ৳{product.compareAtPrice?.toLocaleString()}
                                </span>
                              )}
                          </div>
                          {product.freeShipping && (
                            <p className="text-sm font-semibold text-green-700">
                              {t("home.free_shipping")}
                            </p>
                          )}

                          {/* Rating and Reviews */}
                          <div className="flex items-center gap-2 mb-2">
                            {renderStars(product.rating)}
                          </div>

                          {/* Stock Status */}
                          {product.status === "In Stock" ? (
                            <div className="flex items-center gap-2 text-green-600 text-sm mb-2">
                              <svg
                                className="w-4 h-4"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              <span className="font-medium">
                                {t("product.in_stock")}
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-red-600 text-sm mb-3">
                              <svg
                                className="w-4 h-4"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              <span className="font-medium">
                                {t("home.out_of_stock")}
                              </span>
                            </div>
                          )}

                          {/* Add to Cart / Out of Stock Button - appears on hover */}
                          {product.status === "Stock Out" ? (
                            <div className="absolute bottom-4 left-4 right-4 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                              <button
                                disabled
                                className="flex-none bg-gray-100 text-red-500 py-2 px-2 rounded-md text-xs font-medium cursor-not-allowed whitespace-nowrap"
                              >
                                {t("home.out_of_stock")}
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setWaitlistProduct(product);
                                }}
                                className="flex-1 flex items-center justify-center gap-1 border border-teal-500 text-teal-700 py-2 rounded-md text-xs font-semibold hover:bg-teal-50 transition"
                              >
                                <FaBell className="w-3 h-3" /> Join Waitlist
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                addToCart(product, 1);
                              }}
                              className="absolute bottom-4 left-4 right-4 bg-red-600 text-white py-2 rounded-md font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-red-700"
                            >
                              {t("home.add_to_cart")}
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
              </div>
            </div>
          </div>

          <AuthModal
            isOpen={showAuthModal}
            onClose={() => setShowAuthModal(false)}
          />
          {waitlistProduct && (
            <WaitlistModal
              product={waitlistProduct}
              onClose={() => setWaitlistProduct(null)}
            />
          )}
        </div>
      </section>
    </>
  );
}
