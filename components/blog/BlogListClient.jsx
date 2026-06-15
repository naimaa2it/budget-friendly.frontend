"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useStoreSettings } from "@/components/context/StoreSettingsContext";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

// Helper function to safely get image URL from featuredImage (object or string)
const getImageUrl = (featuredImage, thumbnail = null) => {
  if (!featuredImage && !thumbnail) return null;

  // If featuredImage is an object with url property
  if (featuredImage && typeof featuredImage === "object" && featuredImage.url) {
    return featuredImage.url;
  }

  // If featuredImage is a string
  if (featuredImage && typeof featuredImage === "string") {
    return featuredImage;
  }

  // Fall back to thumbnail
  return thumbnail || null;
};

export default function BlogListClient() {
  const { storeName } = useStoreSettings();
  const [blogs, setBlogs] = useState([]);
  const [featuredBlogs, setFeaturedBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [categories, setCategories] = useState([]);
  const [currentFeaturedIndex, setCurrentFeaturedIndex] = useState(0);
  const blogGridRef = useRef(null);
  const featureSectionRef = useRef(null);
  const [featureSectionHeight, setFeatureSectionHeight] = useState(400);
  const [hasLoadedFeatured, setHasLoadedFeatured] = useState(false);

  const BLOGS_PER_PAGE = 9;

  // Fetch featured blogs only once on component mount
  useEffect(() => {
    const fetchFeaturedBlogs = async () => {
      try {
        const featuredResp = await fetch(
          `${API}/api/blog?featured=true&limit=10`,
        );
        if (featuredResp.ok) {
          const featuredData = await featuredResp.json();
          setFeaturedBlogs(featuredData.items || []);
          setHasLoadedFeatured(true);
        }
      } catch (err) {
        console.error("Error fetching featured blogs:", err);
      }
    };

    fetchFeaturedBlogs();
  }, []);

  // Fetch regular blogs when category or page changes
  useEffect(() => {
    const fetchBlogs = async () => {
      setLoadingCategories(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        params.set("page", String(currentPage));
        params.set("limit", String(BLOGS_PER_PAGE));
        params.set("featured", "false"); // Only non-featured blogs
        if (selectedCategory) {
          params.set("tag", selectedCategory);
        }

        const resp = await fetch(`${API}/api/blog?${params.toString()}`);
        const data = await resp.json();

        if (!resp.ok) {
          throw new Error(data.error || "Failed to fetch blogs");
        }

        const items = data.items || [];
        setBlogs(items);
        setTotalPages(Math.ceil((data.total || 0) / BLOGS_PER_PAGE));

        // Extract unique tags from blogs for category filtering
        if (categories.length === 0 && items.length > 0) {
          const allTags = items.flatMap((blog) => blog.tags || []);
          const uniqueTags = [...new Set(allTags)];
          setCategories(uniqueTags);
        }
      } catch (err) {
        console.error("Error fetching blogs:", err);
        setError(err.message);
      } finally {
        setLoadingCategories(false);
        setLoading(false);
      }
    };

    fetchBlogs();
  }, [currentPage, selectedCategory]);

  // Auto-advance featured blog slider
  useEffect(() => {
    if (featuredBlogs.length > 1) {
      const interval = setInterval(() => {
        setCurrentFeaturedIndex((prev) => (prev + 1) % featuredBlogs.length);
      }, 10000); // Change every 10 seconds

      return () => clearInterval(interval);
    }
  }, [featuredBlogs.length]);

  // Fetch blog categories for hero section display
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const resp = await fetch(`${API}/api/blog/categories`);
        if (resp.ok) {
          const data = await resp.json();
          console.log("Fetched categories:", data); // Debug log
          setCategories(data.categories || []);
        } else {
          console.error(
            "Failed to fetch categories:",
            resp.status,
            resp.statusText,
          );
        }
      } catch (err) {
        console.error("Error fetching blog categories:", err);
      }
    };
    fetchCategories();
  }, []);

  // Measure and set feature section height when featured blogs load
  useEffect(() => {
    if (featureSectionRef.current && hasLoadedFeatured) {
      const updateHeight = () => {
        if (featureSectionRef.current) {
          const height = featureSectionRef.current.offsetHeight;
          setFeatureSectionHeight(height);
        }
      };

      // Update height after content loads
      setTimeout(updateHeight, 100);

      // Also update on window resize
      window.addEventListener("resize", updateHeight);
      return () => window.removeEventListener("resize", updateHeight);
    }
  }, [featuredBlogs, hasLoadedFeatured]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
    });
  };

  const truncateText = (text, maxLength = 120) => {
    if (!text) return "";
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + "...";
  };

  // Function to handle category change with scroll
  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    setCurrentPage(1);

    // Scroll to blog grid after state update
    setTimeout(() => {
      if (blogGridRef.current) {
        // Get the position of the blog grid
        const elementPosition = blogGridRef.current.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - 100; // 100px offset from top

        window.scrollTo({
          top: offsetPosition,
          behavior: "smooth",
        });
      }
    }, 150);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="relative text-white py-8 md:py-10  overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          <Image
            src="/banner/blogbanner.jpg"
            alt="Electronics Blog Hero Background"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-black/70"></div>
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/30"></div>
        </div>

        {/* Content */}
        <div className="relative max-w-6xl mx-auto px-2 md:px-4 lg:px-6 text-center">
          <div className="max-w-2xl mx-auto">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 leading-tight">
              Tech{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-pink-400">
                Insights
              </span>
            </h1>
            <p className="text-base md:text-lg opacity-90 mb-6 leading-relaxed">
              Discover the latest electronics, gadget reviews, tech guides, and
              digital trends
            </p>

            <div className="flex flex-wrap justify-center gap-3 text-sm">
              {categories.length > 0 ? (
                categories
                  .filter((category) => {
                    const name = category.name || category;
                    return (
                      name && typeof name === "string" && name.trim().length > 2
                    );
                  })
                  .slice(0, 6)
                  .map((category, index) => (
                    <span
                      key={index}
                      className="px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-full border border-white/20 text-white/90"
                    >
                      {category.name || category}
                    </span>
                  ))
              ) : (
                // Fallback if no categories are loaded yet
                <>
                  <span className="px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-full border border-white/20 text-white/90">
                    Electronics
                  </span>
                  <span className="px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-full border border-white/20 text-white/90">
                    Reviews
                  </span>
                  <span className="px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-full border border-white/20 text-white/90">
                    Tech Trends
                  </span>
                  <span className="px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-full border border-white/20 text-white/90">
                    Buying Guides
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-2 md:px-4 lg:px-6 py-4 md:py-6 ">
        {/* Flex container for sidebar and featured post */}
        <div className="flex flex-col md:flex-row gap-8 md:gap-10 mb-8">
          {/* Category Sidebar */}
          <aside
            className="md:w-64 w-full md:sticky md:top-24 bg-white rounded-2xl shadow-md p-4 mb-4 md:mb-0 overflow-y-auto"
            style={{
              maxHeight: `${featureSectionHeight}px`,
              minHeight: `${Math.min(featureSectionHeight, 420)}px`,
              height: "100%",
            }}
          >
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <span className="text-rose-600">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </span>
              Categories
            </h3>
            <div className="flex flex-col gap-1">
              <button
                onClick={() => handleCategoryChange("")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors text-left ${
                  selectedCategory === ""
                    ? "bg-rose-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <span>All Posts</span>
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => handleCategoryChange(cat)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors text-left ${
                    selectedCategory === cat
                      ? "bg-rose-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  <span>{cat}</span>
                </button>
              ))}
            </div>
          </aside>

          {/* Featured Blog Section - Static, never re-renders with category changes */}
          <div ref={featureSectionRef} className="flex-1">
            {hasLoadedFeatured && featuredBlogs.length > 0 && (
              <div className="mb-6 md:mb-10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-px bg-gradient-to-r from-transparent to-orange-400"></div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-r from-orange-400 to-pink-400 rounded-full flex items-center justify-center shadow-lg">
                      <svg
                        className="w-4 h-4 text-white"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    </div>
                    <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-rose-600 to-pink-400">
                      Featured Post
                    </h2>
                  </div>
                  <div className="w-8 h-px bg-gradient-to-l from-transparent to-orange-400"></div>
                </div>

                {featuredBlogs.length === 1 ? (
                  /* Single Featured Post */
                  <Link
                    href={`/blog/${featuredBlogs[0].slug}`}
                    className="block"
                  >
                    <div className="relative h-[280px] md:h-[320px] lg:h-[360px] rounded-2xl overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 group cursor-pointer shadow-2xl">
                      {/* Background Image */}
                      {getImageUrl(
                        featuredBlogs[0].featuredImage,
                        featuredBlogs[0].thumbnail,
                      ) && (
                        <Image
                          src={getImageUrl(
                            featuredBlogs[0].featuredImage,
                            featuredBlogs[0].thumbnail,
                          )}
                          alt={featuredBlogs[0].title}
                          fill
                          className="object-cover group-hover:scale-110 transition-transform duration-700"
                          priority
                        />
                      )}

                      {/* Enhanced Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/40 group-hover:from-black/70 transition-all duration-300" />
                      <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-transparent to-black/30" />

                      {/* Content */}
                      <div className="absolute inset-0 flex items-end">
                        <div className="p-2 sm:p-2 md:p-4 lg:p-8 text-white w-full">
                          <div className="flex flex-wrap items-center gap-4 text-white/80 text-sm mb-4">
                            <span className="flex items-center gap-1 bg-white/10 backdrop-blur-sm px-3 py-1 rounded-full">
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                />
                              </svg>
                              {formatDate(
                                featuredBlogs[0].publishDate ||
                                  featuredBlogs[0].createdAt,
                              )}
                            </span>
                            {featuredBlogs[0].author && (
                              <span className="flex items-center gap-1 bg-white/10 backdrop-blur-sm px-3 py-1 rounded-full">
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                  />
                                </svg>
                                {storeName || "Store"}
                              </span>
                            )}
                            <span className="flex items-center gap-1 bg-white/10 backdrop-blur-sm px-3 py-1 rounded-full">
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                              {featuredBlogs[0].readingTime || 5} min read
                            </span>
                          </div>

                          {featuredBlogs[0].tags &&
                            featuredBlogs[0].tags[0] && (
                              <span className="inline-block bg-gradient-to-r from-orange-500 to-pink-500 text-white text-xs sm:text-sm font-semibold px-3 sm:px-4 py-1.5 sm:py-2 rounded-full mb-3 sm:mb-4 shadow-lg">
                                {featuredBlogs[0].tags[0]}
                              </span>
                            )}

                          <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-2 sm:mb-3 leading-tight">
                            {featuredBlogs[0].title}
                          </h1>

                          <p className="text-white/90 text-base md:text-lg mb-6 line-clamp-2 max-w-4xl">
                            {truncateText(
                              featuredBlogs[0].excerpt ||
                                featuredBlogs[0].content?.replace(
                                  /<[^>]*>/g,
                                  "",
                                ),
                              150,
                            )}
                          </p>

                          <div className="flex items-center gap-2 text-white font-semibold group-hover:text-orange-300 transition-colors">
                            <span className="text-lg">Read full story</span>
                            <svg
                              className="w-6 h-6 transform group-hover:translate-x-2 transition-transform duration-300"
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
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                ) : (
                  /* Multiple Featured Posts Slider */
                  <div className="relative">
                    <div className="overflow-hidden rounded-2xl shadow-2xl">
                      <div
                        className="flex transition-transform duration-500 ease-out"
                        style={{
                          transform: `translateX(-${currentFeaturedIndex * 100}%)`,
                        }}
                      >
                        {featuredBlogs.map((featured, index) => (
                          <div
                            key={featured._id}
                            className="w-full flex-shrink-0"
                          >
                            <Link
                              href={`/blog/${featured.slug}`}
                              className="block"
                            >
                              <div className="relative h-[280px] md:h-[320px] lg:h-[360px] bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 group cursor-pointer">
                                {/* Background Image */}
                                {getImageUrl(
                                  featured.featuredImage,
                                  featured.thumbnail,
                                ) && (
                                  <Image
                                    src={getImageUrl(
                                      featured.featuredImage,
                                      featured.thumbnail,
                                    )}
                                    alt={featured.title}
                                    fill
                                    className="object-cover group-hover:scale-110 transition-transform duration-700"
                                    priority={index === 0}
                                  />
                                )}

                                {/* Enhanced Overlay */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/40 group-hover:from-black/70 transition-all duration-300" />

                                {/* Content */}
                                <div className="absolute inset-0 flex items-end">
                                  <div className="p-4 sm:p-6 md:p-8 lg:p-10 text-white w-full">
                                    <div className="flex flex-wrap items-center gap-4 text-white/80 text-sm mb-4">
                                      <span className="flex items-center gap-1 bg-white/10 backdrop-blur-sm px-3 py-1 rounded-full">
                                        <svg
                                          className="w-4 h-4"
                                          fill="none"
                                          stroke="currentColor"
                                          viewBox="0 0 24 24"
                                        >
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="2"
                                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                          />
                                        </svg>
                                        {formatDate(featured.createdAt)}
                                      </span>
                                      <span className="bg-white/10 backdrop-blur-sm px-3 py-1 rounded-full">
                                        {storeName || "Store"} Author
                                      </span>
                                      {featured.readTime && (
                                        <span className="bg-white/10 backdrop-blur-sm px-3 py-1 rounded-full">
                                          {featured.readTime} min read
                                        </span>
                                      )}
                                    </div>

                                    {featured.tags && featured.tags[0] && (
                                      <span className="inline-block bg-gradient-to-r from-orange-500 to-pink-500 text-white text-xs sm:text-sm font-semibold px-3 sm:px-4 py-1.5 sm:py-2 rounded-full mb-3 sm:mb-4 shadow-lg">
                                        {featured.tags[0]}
                                      </span>
                                    )}

                                    <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold mb-2 sm:mb-3 leading-tight">
                                      {featured.title}
                                    </h1>

                                    <p className="text-white/90 text-base md:text-lg mb-6 line-clamp-2 max-w-4xl">
                                      {truncateText(
                                        featured.excerpt ||
                                          featured.content?.replace(
                                            /<[^>]*>/g,
                                            "",
                                          ),
                                        150,
                                      )}
                                    </p>

                                    <div className="flex items-center gap-2 text-rose-600 font-semibold group-hover:text-white transition-colors">
                                      <span className="text-lg">
                                        Read full story
                                      </span>
                                      <svg
                                        className="w-6 h-6 transform group-hover:translate-x-2 transition-transform duration-300"
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
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </Link>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Enhanced Slider Controls */}
                    <button
                      onClick={() =>
                        setCurrentFeaturedIndex(
                          (prev) =>
                            (prev - 1 + featuredBlogs.length) %
                            featuredBlogs.length,
                        )
                      }
                      className="absolute left-1 sm:left-1 top-1/2 -translate-y-1/2 w-8 sm:w-10 h-8 sm:h-10 bg-rose-600/20 hover:bg-rose-600/30 text-white rounded-full flex items-center justify-center backdrop-blur-sm border border-white/20 transition-all shadow-lg"
                    >
                      <svg
                        className="w-5 sm:w-6 h-5 sm:h-6"
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
                      onClick={() =>
                        setCurrentFeaturedIndex(
                          (prev) => (prev + 1) % featuredBlogs.length,
                        )
                      }
                      className="absolute right-1 sm:right-1 top-1/2 -translate-y-1/2 w-8 sm:w-10 h-8 sm:h-10 bg-rose-600/20 hover:bg-rose-600/30 text-white rounded-full flex items-center justify-center backdrop-blur-sm border border-white/20 transition-all shadow-lg"
                    >
                      <svg
                        className="w-5 sm:w-6 h-5 sm:h-6"
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

                    {/* Enhanced Dots Indicator */}
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
                      {featuredBlogs.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentFeaturedIndex(index)}
                          className={`w-3 h-3 rounded-full transition-all ${
                            index === currentFeaturedIndex
                              ? "bg-rose-600 shadow-lg"
                              : "bg-white/50 hover:bg-white/70"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Blog Grid Section */}
        <div ref={blogGridRef} className="scroll-mt-24">
          {/* Loading State for Categories */}
          {loadingCategories && (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-rose-500 border-t-transparent"></div>
            </div>
          )}

          {/* Error State */}
          {error && !loadingCategories && (
            <div className="text-center py-20">
              <p className="text-red-600 text-lg mb-4">Failed to load blogs</p>
              <p className="text-gray-500">{error}</p>
              <button
                onClick={() => setCurrentPage(1)}
                className="mt-4 px-6 py-2 bg-rose-600 text-white rounded-full hover:bg-rose-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Empty State */}
          {!loadingCategories && !error && blogs.length === 0 && (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">📝</div>
              <h2 className="text-2xl font-semibold text-gray-800 mb-2">
                No blogs found
              </h2>
              <p className="text-gray-500">
                Check back later for new articles!
              </p>
            </div>
          )}

          {/* Blog Grid */}
          {!loadingCategories && !error && blogs.length > 0 && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 lg:gap-8">
                {blogs.map((blog) => (
                  <Link
                    key={blog._id || blog.id}
                    href={`/blog/${blog.slug}`}
                    className="group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col"
                  >
                    {/* Thumbnail */}
                    <div className="relative aspect-[16/10] overflow-hidden bg-gray-100">
                      {getImageUrl(blog.featuredImage, blog.thumbnail) ? (
                        <Image
                          src={getImageUrl(blog.featuredImage, blog.thumbnail)}
                          alt={blog.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-rose-100 to-pink-100">
                          <span className="text-4xl">📖</span>
                        </div>
                      )}
                      {blog.tags && blog.tags.length > 0 && (
                        <span className="absolute top-2 sm:top-3 left-2 sm:left-3 bg-rose-600 text-white text-xs font-medium px-2 sm:px-3 py-1 rounded-full">
                          {blog.tags[0]}
                        </span>
                      )}
                    </div>

                    {/* Content */}
                    <div className="px-3 sm:px-5 py-1 sm:py-2 flex flex-col flex-grow">
                      <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-rose-600 transition-colors">
                        {blog.title}
                      </h2>
                      <p className="text-gray-600 text-sm mb-1 line-clamp-3 flex-grow">
                        {truncateText(
                          blog.excerpt || blog.content?.replace(/<[^>]*>/g, ""),
                          120,
                        )}
                      </p>
                      <div className="flex items-center justify-between text-sm text-gray-500 mt-auto pt-1 border-t border-gray-300">
                        <span className="flex items-center gap-1 text-xs">
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                          {formatDate(blog.createdAt || blog.publishedAt)}
                        </span>

                        <p className="text-rose-600 font-medium text-xs hover:text-rose-700 transition-colors">
                          Read more
                        </p>
                        {blog.readTime && (
                          <span className="flex items-center gap-1">
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                            {blog.readTime} min read
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-12 flex justify-center items-center gap-2">
                  <button
                    onClick={() => {
                      setCurrentPage((p) => Math.max(1, p - 1));
                      setTimeout(() => {
                        if (blogGridRef.current) {
                          const elementPosition =
                            blogGridRef.current.getBoundingClientRect().top;
                          const offsetPosition =
                            elementPosition + window.pageYOffset - 100;
                          window.scrollTo({
                            top: offsetPosition,
                            behavior: "smooth",
                          });
                        }
                      }, 100);
                    }}
                    disabled={currentPage === 1}
                    className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Previous
                  </button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }

                      return (
                        <button
                          key={pageNum}
                          onClick={() => {
                            setCurrentPage(pageNum);
                            setTimeout(() => {
                              if (blogGridRef.current) {
                                const elementPosition =
                                  blogGridRef.current.getBoundingClientRect()
                                    .top;
                                const offsetPosition =
                                  elementPosition + window.pageYOffset - 100;
                                window.scrollTo({
                                  top: offsetPosition,
                                  behavior: "smooth",
                                });
                              }
                            }, 100);
                          }}
                          className={`w-8 sm:w-10 h-8 sm:h-10 rounded-lg font-medium transition-colors ${
                            currentPage === pageNum
                              ? "bg-rose-600 text-white"
                              : "text-gray-700 hover:bg-gray-100"
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => {
                      setCurrentPage((p) => Math.min(totalPages, p + 1));
                      setTimeout(() => {
                        if (blogGridRef.current) {
                          const elementPosition =
                            blogGridRef.current.getBoundingClientRect().top;
                          const offsetPosition =
                            elementPosition + window.pageYOffset - 100;
                          window.scrollTo({
                            top: offsetPosition,
                            behavior: "smooth",
                          });
                        }
                      }, 100);
                    }}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
