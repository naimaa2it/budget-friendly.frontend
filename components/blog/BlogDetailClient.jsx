"use client";

import React, { useEffect, useState } from "react";
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

const getVideoUrl = (video) => {
  if (!video) return "";
  if (typeof video === "string") return video;
  return video.url || "";
};

const getEmbedUrl = (rawUrl) => {
  if (!rawUrl) return null;

  try {
    const url = new URL(rawUrl);
    const host = url.hostname.replace("www.", "").toLowerCase();

    if (host === "youtu.be") {
      const id = url.pathname.split("/").filter(Boolean)[0];
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }

    if (host.includes("youtube.com")) {
      const watchId = url.searchParams.get("v");
      if (watchId) return `https://www.youtube.com/embed/${watchId}`;

      const parts = url.pathname.split("/").filter(Boolean);
      const shortsIndex = parts.indexOf("shorts");
      if (shortsIndex !== -1 && parts[shortsIndex + 1]) {
        return `https://www.youtube.com/embed/${parts[shortsIndex + 1]}`;
      }

      const embedIndex = parts.indexOf("embed");
      if (embedIndex !== -1 && parts[embedIndex + 1]) {
        return `https://www.youtube.com/embed/${parts[embedIndex + 1]}`;
      }
    }

    if (host.includes("vimeo.com")) {
      const parts = url.pathname.split("/").filter(Boolean);
      const id = parts.find((part) => /^\d+$/.test(part));
      return id ? `https://player.vimeo.com/video/${id}` : null;
    }

    if (host.includes("facebook.com")) {
      return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(rawUrl)}&show_text=false`;
    }

    if (host.includes("drive.google.com")) {
      const match = rawUrl.match(/\/d\/([^/]+)/);
      if (match?.[1])
        return `https://drive.google.com/file/d/${match[1]}/preview`;
    }

    return null;
  } catch {
    return null;
  }
};

export default function BlogDetailClient({ slug }) {
  const { storeName, logoUrl } = useStoreSettings();
  const [blog, setBlog] = useState(null);
  const [relatedBlogs, setRelatedBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lightboxImage, setLightboxImage] = useState(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  useEffect(() => {
    if (!slug) return;

    const fetchBlog = async () => {
      setLoading(true);
      setError(null);
      try {
        const resp = await fetch(`${API}/api/blog/${slug}`);
        const data = await resp.json();

        if (!resp.ok) {
          throw new Error(data.error || "Blog not found");
        }

        console.log("Blog data received:", data.post);
        console.log("Featured Image:", data.post?.featuredImage);
        console.log("Featured Image Type:", typeof data.post?.featuredImage);

        setBlog(data.post);

        // Fetch related blogs using smart matching (categories + tags)
        try {
          const relResp = await fetch(
            `${API}/api/blog/${slug}/related?limit=3`,
          );
          if (relResp.ok) {
            const relData = await relResp.json();
            setRelatedBlogs(relData.relatedPosts || []);
          }
        } catch (relError) {
          console.error("Error fetching related blogs:", relError);
          // If the new endpoint fails, fall back to tag-based approach
          if (data.post?.tags && data.post.tags.length > 0) {
            const tag = data.post.tags[0];
            const relResp = await fetch(
              `${API}/api/blog?tag=${encodeURIComponent(tag)}&limit=4`,
            );
            if (relResp.ok) {
              const relData = await relResp.json();
              const related = (relData.items || []).filter(
                (b) => b.slug !== slug,
              );
              setRelatedBlogs(related.slice(0, 3));
            }
          }
        }
      } catch (err) {
        console.error("Error fetching blog:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchBlog();
  }, [slug]);

  // Update document title, meta tags, canonical link, and inject BlogPosting
  // JSON-LD client-side — for __placeholder__ pages (new posts added after
  // build), this ensures Google sees real metadata on its JS-rendering pass.
  useEffect(() => {
    if (!blog) return;

    const SITE_URL =
      process.env.NEXT_PUBLIC_SITE_URL || "https://smartproductbuy.com";

    const seoTitle = blog.seo?.title || blog.title;
    const seoDesc =
      blog.seo?.description ||
      blog.excerpt ||
      truncateText(blog.content?.replace(/<[^>]*>/g, ""), 160) ||
      `Read ${blog.title} on the Pickob blog.`;
    const seoKeywords = (blog.seo?.keywords || blog.tags || []).join(", ");
    const imageUrl = getImageUrl(blog.featuredImage, blog.thumbnail);
    const seoImage = imageUrl || `${SITE_URL}/mainLogo.png`;
    const blogUrl = `${SITE_URL}/blog/${slug}`;

    const prevTitle = document.title;
    document.title = `${seoTitle} | Pickob`;

    const setMeta = (selector, attr, value) => {
      let el = document.querySelector(selector);
      if (!el) {
        el = document.createElement("meta");
        const match = selector.match(/\[([^=]+)="([^"]+)"\]/);
        if (match) el.setAttribute(match[1], match[2]);
        document.head.appendChild(el);
      }
      el.setAttribute(attr, value);
    };

    setMeta('meta[name="description"]', "content", seoDesc);
    if (seoKeywords) setMeta('meta[name="keywords"]', "content", seoKeywords);
    setMeta('meta[property="og:title"]', "content", `${seoTitle} | Pickob`);
    setMeta('meta[property="og:description"]', "content", seoDesc);
    setMeta('meta[property="og:image"]', "content", seoImage);
    setMeta('meta[property="og:url"]', "content", blogUrl);
    setMeta('meta[property="og:type"]', "content", "article");
    setMeta('meta[name="twitter:title"]', "content", `${seoTitle} | Pickob`);
    setMeta('meta[name="twitter:description"]', "content", seoDesc);
    setMeta('meta[name="twitter:image"]', "content", seoImage);

    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", blogUrl);

    const schema = {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: seoTitle,
      description: seoDesc,
      image: imageUrl ? [imageUrl] : undefined,
      datePublished: blog.publishedAt || blog.publishDate || blog.createdAt,
      dateModified: blog.updatedAt || blog.publishedAt || blog.createdAt,
      author: { "@type": "Organization", name: "Pickob" },
      publisher: { "@type": "Organization", name: "Pickob" },
      mainEntityOfPage: blogUrl,
    };
    const existing = document.getElementById("blog-jsonld");
    if (existing) existing.remove();
    const script = document.createElement("script");
    script.id = "blog-jsonld";
    script.type = "application/ld+json";
    script.textContent = JSON.stringify(schema);
    document.head.appendChild(script);

    return () => {
      document.title = prevTitle;
      script.remove();
    };
  }, [blog, slug]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
    });
  };

  const truncateText = (text, maxLength = 100) => {
    if (!text) return "";
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + "...";
  };

  // Share functions
  const shareOnFacebook = () => {
    const url = encodeURIComponent(window.location.href);
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${url}`,
      "_blank",
      "width=600,height=400",
    );
  };

  const shareOnTwitter = () => {
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(blog?.title || "");
    window.open(
      `https://twitter.com/intent/tweet?url=${url}&text=${text}`,
      "_blank",
      "width=600,height=400",
    );
  };

  const shareOnWhatsApp = () => {
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(blog?.title || "");
    window.open(`https://wa.me/?text=${text}%20${url}`, "_blank");
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    alert("Link copied to clipboard!");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-rose-500 border-t-transparent"></div>
      </div>
    );
  }

  if (error || !blog) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center py-20 px-4">
        <div className="text-6xl mb-4">😔</div>
        <h1 className="text-2xl font-semibold text-gray-800 mb-2">
          Blog Not Found
        </h1>
        <p className="text-gray-500 mb-6">
          {error || "The blog you are looking for does not exist."}
        </p>
        <Link
          href="/blog"
          className="px-6 py-2 bg-rose-600 text-white rounded-full hover:bg-rose-700 transition-colors"
        >
          Back to Blog
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Enhanced Breadcrumb */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/60 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-2 md:px-4 lg:px-6 py-4">
          <nav className="flex items-center gap-2 text-sm text-gray-600">
            <Link
              href="/"
              className="hover:text-orange-600 transition-colors flex items-center gap-1"
            >
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
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
              Home
            </Link>
            <svg
              className="w-4 h-4 text-gray-400"
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
            <Link
              href="/blog"
              className="hover:text-orange-600 transition-colors"
            >
              Blog
            </Link>
            <svg
              className="w-4 h-4 text-gray-400"
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
            <span className="text-gray-900 truncate max-w-[200px] font-medium">
              {blog.title}
            </span>
          </nav>
        </div>
      </div>

      {/* Article */}
      <article className="max-w-7xl mx-auto px-2 md:px-4 lg:px-6 py-2 sm:py-4 md:py-8">
        {/* Enhanced Header */}
        <header className="mb-1">
          <div className="text-center mb-2">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2 leading-tight">
              <span className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent">
                {blog.title}
              </span>
            </h1>

            {/* Enhanced Author & Meta Info */}
            <div className="flex flex-col sm:flex-row flex-wrap justify-center sm:justify-between items-center gap-3 sm:gap-6 text-gray-600 mb-2 px-2 sm:px-4 md:px-0">
              <div className="flex items-center gap-2 sm:gap-3">
                {logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={logoUrl}
                    alt={storeName || "Store"}
                    className="w-10 sm:w-12 h-10 sm:h-12 rounded-full object-contain bg-white border border-gray-200 shadow-lg p-1"
                  />
                ) : (
                  <div className="w-10 sm:w-12 h-10 sm:h-12 rounded-full bg-gradient-to-r from-orange-400 to-pink-400 flex items-center justify-center shadow-lg">
                    <span className="text-white font-bold text-xs sm:text-sm">
                      {storeName ? storeName.charAt(0).toUpperCase() : "B"}
                    </span>
                  </div>
                )}
                <div className="text-left">
                  <div className="font-semibold text-gray-900 text-xs sm:text-sm">
                    {storeName || "Store"}
                  </div>
                  <div className="text-xs text-gray-500">Author</div>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 md:gap-6">
                <span className="flex items-center gap-1.5 sm:gap-2 bg-white px-2 sm:px-3 md:px-4 py-1.5 rounded-full shadow-sm border border-gray-200 text-xs">
                  <svg
                    className="w-4 sm:w-5 h-4 sm:h-5 text-orange-500"
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
                    blog.publishDate || blog.createdAt || blog.publishedAt,
                  )}
                </span>
                <span className="flex items-center gap-1.5 sm:gap-2 bg-white px-2 sm:px-3 md:px-4 py-1.5 rounded-full shadow-sm border border-gray-200 text-xs">
                  <svg
                    className="w-4 sm:w-5 h-4 sm:h-5 text-orange-500 "
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
                  {blog.readingTime || 5} min read
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Featured Image */}
        {getImageUrl(blog.featuredImage, blog.thumbnail) && (
          <div className="relative aspect-[3/1] mb-8 rounded-2xl overflow-hidden bg-gradient-to-br from-gray-900 to-gray-600 shadow-xl">
            <Image
              src={getImageUrl(blog.featuredImage, blog.thumbnail)}
              alt={blog.title}
              fill
              className="object-cover hover:scale-105 transition-transform duration-500"
              sizes="(max-width: 768px) 100vw, 800px"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent"></div>
          </div>
        )}

        {/* Enhanced Content */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 py-2 sm:py-4 px-4 sm:px-8 md:px-10 mb-4 md:mb-6">
          <div
            className="prose prose-sm sm:prose md:prose-lg lg:prose-xl max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-p:leading-relaxed prose-a:text-orange-600 prose-a:no-underline hover:prose-a:underline prose-img:rounded-xl prose-strong:text-gray-900 prose-blockquote:border-l-orange-400 prose-blockquote:bg-orange-50 prose-blockquote:py-4 prose-blockquote:px-6 prose-blockquote:rounded-r-lg prose-code:text-orange-600 prose-code:bg-orange-50 prose-code:px-2 prose-code:py-1 prose-code:rounded"
            dangerouslySetInnerHTML={{ __html: blog.content }}
          />
        </div>

        {/* Enhanced Additional Images Gallery */}
        {blog.additionalImages && blog.additionalImages.length > 0 && (
          <div className="mb-8">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4">
              <div className="text-center mb-8">
                <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                  Gallery
                </h3>
                <div className="w-16 h-1 bg-gradient-to-r from-orange-400 to-pink-400 mx-auto rounded-full"></div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
                {blog.additionalImages.map((image, index) => (
                  <div
                    key={index}
                    className="group relative aspect-video rounded-xl overflow-hidden bg-gray-100 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer"
                    onClick={() => {
                      setLightboxImage(image.url);
                      setLightboxOpen(true);
                    }}
                  >
                    <Image
                      src={image.url}
                      alt={`Gallery image ${index + 1}`}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-500"
                      sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300 flex items-center justify-center">
                      <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <svg
                          className="w-6 h-6 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="3"
                            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Videos */}
        {blog.videos && blog.videos.length > 0 && (
          <div className="mb-12">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4">
              <div className="text-center mb-8">
                <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                  Videos
                </h3>
                <div className="w-16 h-1 bg-gradient-to-r from-orange-400 to-pink-400 mx-auto rounded-full"></div>
              </div>
              <div className="grid grid-cols-1 gap-8">
                {blog.videos.map((video, index) => {
                  const videoUrl = getVideoUrl(video);
                  if (!videoUrl) return null;

                  const embedUrl = getEmbedUrl(videoUrl);

                  return (
                    <div
                      key={index}
                      className="rounded-xl overflow-hidden shadow-xl bg-black"
                    >
                      <div className="aspect-video sm:aspect-[21/9]">
                        {embedUrl ? (
                          <iframe
                            src={embedUrl}
                            title={`Video ${index + 1}`}
                            className="w-full h-full"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            allowFullScreen
                          />
                        ) : (
                          <video
                            src={videoUrl}
                            className="w-full h-full object-cover"
                            preload="metadata"
                            controls
                          >
                            Your browser does not support the video tag.
                          </video>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Dynamic Sections - Steps First, then FAQ and Accordion */}
        {blog.dynamicSections && blog.dynamicSections.length > 0 && (
          <div className="mb-12 space-y-8">
            {/* Steps Section */}
            {blog.dynamicSections
              .filter((section) => section.type === "steps")
              .map((section, index) => (
                <div
                  key={`steps-${index}`}
                  className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4 sm:p-6 md:p-8"
                >
                  <div className="text-center mb-8">
                    <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2 capitalize">
                      {section.type}
                    </h3>
                    <div className="w-16 h-1 bg-gradient-to-r from-orange-400 to-pink-400 mx-auto rounded-full"></div>
                  </div>

                  <div className="space-y-6">
                    {section.items.map((item, i) => (
                      <div
                        key={i}
                        className="flex gap-3 sm:gap-4 md:gap-6 items-start p-4 sm:p-6 bg-gradient-to-r from-gray-50 to-gray-50/50 rounded-xl border border-gray-200/50"
                      >
                        <div className="flex-shrink-0 w-10 sm:w-12 h-10 sm:h-12 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-full flex items-center justify-center font-bold text-base sm:text-lg shadow-lg">
                          {i + 1}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-xl text-gray-900 mb-3">
                            {item.title}
                          </h4>
                          <div
                            className="text-gray-700 leading-relaxed"
                            dangerouslySetInnerHTML={{ __html: item.content }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

            {/* FAQ Section */}
            {blog.dynamicSections
              .filter((section) => section.type === "faq")
              .map((section, index) => (
                <div
                  key={`faq-${index}`}
                  className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4 sm:p-6 md:p-8"
                >
                  <div className="text-center mb-8">
                    <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2 capitalize">
                      {section.type}
                    </h3>
                    <div className="w-16 h-1 bg-gradient-to-r from-orange-400 to-pink-400 mx-auto rounded-full"></div>
                  </div>

                  <div className="space-y-4">
                    {section.items.map((item, i) => (
                      <details
                        key={i}
                        className="group border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                      >
                        <summary className="flex justify-between items-center cursor-pointer p-6 text-gray-900 font-semibold group-open:bg-gradient-to-r group-open:from-orange-50 group-open:to-pink-50 hover:bg-gray-50 transition-all">
                          <span className="text-lg">{item.title}</span>
                          <svg
                            className="w-6 h-6 transform group-open:rotate-180 transition-transform text-orange-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                        </summary>
                        <div
                          className="px-6 pb-6 pt-2 text-gray-600 leading-relaxed"
                          dangerouslySetInnerHTML={{ __html: item.content }}
                        />
                      </details>
                    ))}
                  </div>
                </div>
              ))}

            {/* Accordion Section */}
            {blog.dynamicSections
              .filter((section) => section.type === "accordion")
              .map((section, index) => (
                <div
                  key={`accordion-${index}`}
                  className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8"
                >
                  <div className="text-center mb-8">
                    <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2 capitalize">
                      {section.type}
                    </h3>
                    <div className="w-16 h-1 bg-gradient-to-r from-orange-400 to-pink-400 mx-auto rounded-full"></div>
                  </div>

                  <div className="space-y-4">
                    {section.items.map((item, i) => (
                      <details
                        key={i}
                        className="group border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                      >
                        <summary className="flex justify-between items-center cursor-pointer p-6 text-gray-900 font-semibold group-open:bg-gradient-to-r group-open:from-orange-50 group-open:to-pink-50 hover:bg-gray-50 transition-all">
                          <span className="text-lg">{item.title}</span>
                          <svg
                            className="w-6 h-6 transform group-open:rotate-180 transition-transform text-orange-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                        </summary>
                        <div
                          className="px-6 pb-6 pt-2 text-gray-600 leading-relaxed"
                          dangerouslySetInnerHTML={{ __html: item.content }}
                        />
                      </details>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        )}

        {/* Enhanced Tags */}
        {blog.tags && blog.tags.length > 0 && (
          <div className="mb-12">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 text-center">
              <h3 className="text-xl font-bold text-gray-900 mb-6">
                Related Topics
              </h3>
              <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
                {blog.tags.map((tag) => (
                  <Link
                    key={tag}
                    href={`/blog?tag=${encodeURIComponent(tag)}`}
                    className="inline-block bg-gradient-to-r from-orange-100 to-pink-100 hover:from-orange-200 hover:to-pink-200 text-orange-700 font-semibold px-6 py-3 rounded-full transition-all transform hover:scale-105 shadow-sm hover:shadow-md border border-orange-200"
                  >
                    #{tag}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Share */}
        <div className="mb-6">
          <div className="bg-gradient-to-r from-orange-50 to-pink-50 rounded-2xl shadow-lg border border-orange-100 p-8">
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Share this article
              </h3>
              <p className="text-gray-600">Help others discover this content</p>
            </div>
            <div className="flex flex-wrap justify-center items-center gap-2 sm:gap-3 md:gap-4">
              <button
                onClick={shareOnFacebook}
                className="flex items-center gap-3 px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 md:py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all transform hover:scale-105 shadow-lg"
                aria-label="Share on Facebook"
              >
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M18.77 7.46H14.5v-1.9c0-.9.6-1.1 1-1.1h3V.5h-4.33C10.24.5 9.5 3.44 9.5 5.32v2.15h-3v4h3v12h5v-12h3.85l.42-4z" />
                </svg>
                <span className="font-semibold">Facebook</span>
              </button>
              <button
                onClick={shareOnTwitter}
                className="flex items-center gap-3 px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 md:py-3 bg-sky-500 hover:bg-sky-600 text-white rounded-xl transition-all transform hover:scale-105 shadow-lg"
                aria-label="Share on Twitter"
              >
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M23.44 4.83c-.8.37-1.5.38-2.22.02.93-.56.98-.96 1.32-2.02-.88.52-1.86.9-2.9 1.1-.82-.88-2-1.43-3.3-1.43-2.5 0-4.55 2.04-4.55 4.54 0 .36.03.7.1 1.04-3.77-.2-7.12-2-9.36-4.75-.4.67-.6 1.45-.6 2.3 0 1.56.8 2.95 2 3.77-.74-.03-1.44-.23-2.05-.57v.06c0 2.2 1.56 4.03 3.64 4.44-.67.2-1.37.2-2.06.08.58 1.8 2.26 3.12 4.25 3.16C5.78 18.1 3.37 18.74 1 18.46c2 1.3 4.4 2.04 6.97 2.04 8.35 0 12.92-6.92 12.92-12.93 0-.2 0-.4-.02-.6.9-.63 1.96-1.22 2.56-2.14z" />
                </svg>
                <span className="font-semibold">Twitter</span>
              </button>
              <button
                onClick={shareOnWhatsApp}
                className="flex items-center gap-3 px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 md:py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl transition-all transform hover:scale-105 shadow-lg"
                aria-label="Share on WhatsApp"
              >
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                <span className="font-semibold">WhatsApp</span>
              </button>
              <button
                onClick={copyLink}
                className="flex items-center gap-3 px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 md:py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-xl transition-all transform hover:scale-105 shadow-lg"
                aria-label="Copy link"
              >
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
                    d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
                  />
                </svg>
                <span className="font-semibold">Copy Link</span>
              </button>
            </div>
          </div>
        </div>
      </article>

      {/* Enhanced Related Blogs */}
      {relatedBlogs.length > 0 && (
        <section className="bg-gradient-to-r from-orange-50 to-pink-50 py-4 sm:py-4 md:py-6 lg:py-10">
          <div className="max-w-6xl mx-auto px-2 md:px-4 lg:px-6">
            <div className="text-center mb-4 md:mb-8">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                You Might Also Like
              </h2>
              <p className="text-gray-600 max-w-4xl mx-auto text-sm md:text-base px-4">
                Discover more insightful articles and expert reviews to enhance
                your tech knowledge
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              {relatedBlogs.map((relBlog) => (
                <Link
                  key={relBlog._id || relBlog.id}
                  href={`/blog/${relBlog.slug}`}
                  className="group bg-white rounded-xl md:rounded-2xl overflow-hidden shadow-md md:shadow-lg hover:shadow-xl md:hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 md:hover:-translate-y-2"
                >
                  <div className="relative aspect-[16/10] overflow-hidden bg-gray-100">
                    {getImageUrl(relBlog.featuredImage, relBlog.thumbnail) ? (
                      <Image
                        src={getImageUrl(
                          relBlog.featuredImage,
                          relBlog.thumbnail,
                        )}
                        alt={relBlog.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-100 to-pink-100">
                        <div className="text-center">
                          <div className="text-3xl md:text-4xl mb-2">📱</div>
                          <span className="text-orange-600 font-semibold text-sm md:text-base">
                            Electronics
                          </span>
                        </div>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </div>
                  <div className="px-4 py-2 md:px-6">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      {relBlog.categories && relBlog.categories.length > 0 && (
                        <span className="inline-block bg-gradient-to-r from-orange-100 to-pink-100 text-orange-700 text-xs font-semibold px-2 md:px-3 py-1 rounded-full">
                          {relBlog.categories[0].name || relBlog.categories[0]}
                        </span>
                      )}
                      {relBlog.isFeatured && (
                        <span className="inline-block bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-700 text-xs font-semibold px-2 md:px-3 py-1 rounded-full">
                          ⭐ Featured
                        </span>
                      )}
                    </div>
                    <h3 className="font-bold text-base md:text-lg text-gray-900 group-hover:text-rose-700 transition-colors line-clamp-2 mb-2 leading-tight">
                      {relBlog.title}
                    </h3>
                    <p className="text-gray-600 text-xs md:text-sm mb-1 md:mb-2 line-clamp-2 md:line-clamp-3 leading-relaxed">
                      {truncateText(
                        relBlog.excerpt ||
                          relBlog.content?.replace(/<[^>]*>/g, ""),
                        100,
                      )}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-rose-600 group-hover:text-rose-700 transition-colors ">
                        <span className="text-xs md:text-sm font-semibold mr-1">
                          Read More
                        </span>
                        <svg
                          className="w-3 h-3 md:w-4 md:h-4 transform group-hover:translate-x-1 transition-transform"
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
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Back to Blog */}
      <div className="max-w-4xl mx-auto px-2 md:px-4 lg:px-6 py-4 sm:py-6 md:py-8">
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 text-rose-600 hover:text-rose-700 font-medium transition-colors"
        >
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
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Back to all articles
        </Link>
      </div>

      {/* Lightbox Modal */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setLightboxOpen(false)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] bg-white rounded-xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setLightboxOpen(false)}
              className="absolute top-4 right-4 z-10 w-10 h-10 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-colors"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            {/* Lightbox Image */}
            <div className="relative">
              <Image
                src={lightboxImage}
                alt="Lightbox image"
                width={800}
                height={600}
                className="w-full h-auto max-h-[80vh] object-contain"
                priority
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
