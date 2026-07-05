"use client";
import ColorPickerInput from "@/components/ui/ColorPickerInput";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/components/context/UserContext";
import RichTextEditor from "@/components/dashboard/RichTextEditor";
import DetailedDescriptionBuilder from "@/components/dashboard/Product/DetailedDescriptionBuilder";
import MediaPicker from "@/components/dashboard/MediaPicker";
import Image from "next/image";
import ProductVariantBuilder from "@/components/dashboard/Product/ProductVariantBuilder";
import ProductAsideSections from "@/components/dashboard/Product/ProductAsideSections";
import { uploadImageDirect, MAX_UPLOAD_BYTES } from "@/lib/uploadImage";

const DEFAULT_BADGE_OPTIONS = [
  {
    key: "best_seller",
    label: "Best Seller",
    color: "bg-yellow-100 text-yellow-800",
  },
  { key: "hot", label: "Hot", color: "bg-red-100 text-red-800" },
  {
    key: "new_arrival",
    label: "New Arrival",
    color: "bg-green-100 text-green-800",
  },
  {
    key: "popular_pics",
    label: "Popular Pics",
    color: "bg-pink-100 text-pink-800",
  },
  { key: "trending", label: "Trending", color: "bg-blue-100 text-blue-800" },
  {
    key: "limited",
    label: "Limited Edition",
    color: "bg-purple-100 text-purple-800",
  },
  {
    key: "deals_of_the_day",
    label: "Deals of the Day",
    color: "bg-orange-100 text-orange-800",
  },
  {
    key: "bkash_cashback_400",
    label: "Up to 400 bKash Cashback",
    color: "bg-cyan-100 text-cyan-800",
  },
  {
    key: "visa_mastercard_1000",
    label: "Up to 1000 TK Visa/Mastercard",
    color: "bg-sky-100 text-sky-800",
  },
  {
    key: "under_999",
    label: "Under 999 Deals",
    color: "bg-lime-100 text-lime-800",
  },
  {
    key: "eid_fest",
    label: "Best Offer on Eid Fest",
    color: "bg-emerald-100 text-emerald-800",
  },
  {
    key: "points_save_more",
    label: "Get Points Save More",
    color: "bg-teal-100 text-teal-800",
  },
];

const REMOVED_BADGE_KEYS = new Set(["combo_offer", "buy_one_get_one"]);
const RESERVED_PROMOTION_FLAG_KEYS = new Set([
  "featured",
  "coupon",
  "flashsale",
  "flash_sale",
  "clearance",
  "free_shipping",
  "freeshipping",
]);
const RESERVED_PROMOTION_FLAG_LABELS = new Set([
  "featured",
  "coupon",
  "flash sale",
  "clearance",
  "free shipping",
]);

function ImageDragGrid({ images, onReorder, onRemove }) {
  const dragSrc = useRef(null);
  const [dragOverIdx, setDragOverIdx] = useState(null);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
      {images.map((img, i) => (
        <div
          key={i}
          className={`relative group rounded-lg transition-all ${dragOverIdx === i ? "scale-95 opacity-60 ring-2 ring-indigo-500" : ""}`}
          draggable
          onDragStart={() => {
            dragSrc.current = i;
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOverIdx(i);
          }}
          onDrop={(e) => {
            e.preventDefault();
            setDragOverIdx(null);
            const src = dragSrc.current;
            if (src === null || src === i) return;
            const arr = [...images];
            [arr[src], arr[i]] = [arr[i], arr[src]];
            dragSrc.current = null;
            onReorder(arr);
          }}
          onDragEnd={() => {
            dragSrc.current = null;
            setDragOverIdx(null);
          }}
        >
          <div className="aspect-square rounded-lg overflow-hidden border-2 border-gray-200 shadow-sm cursor-grab">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={img.url}
              alt={img.alt || `Product ${i + 1}`}
              className="w-full h-full object-cover"
              draggable={false}
            />
            {(img.uploading || img.__local) && (
              <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
                <div className="text-sm font-medium text-gray-700">
                  Uploading...
                </div>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => onRemove(i)}
            className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
            aria-label="Remove image"
          >
            ✕
          </button>
          {i === 0 && (
            <div className="absolute top-2 left-2 bg-indigo-600 text-white text-xs px-2 py-1 rounded">
              Main
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default function ProductCreate() {
  const router = useRouter();
  const { user, refreshUser } = useUser();
  const API = process.env.NEXT_PUBLIC_API_URL || "https://api.pickob.com";

  const [product, setProduct] = useState({
    title: "",
    description: "",
    detailedDescription: "",
    category: "",
    department: "",
    tags: [],
    images: [],
    variants: [],
    buyingPrice: undefined,
    price: undefined,
    compareAtPrice: undefined,
    sku: (() => {
      const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
      const rand = (n) =>
        Array.from(
          { length: n },
          () => chars[Math.floor(Math.random() * chars.length)],
        ).join("");
      const d = new Date();
      const ymd =
        String(d.getFullYear()).slice(-2) +
        String(d.getMonth() + 1).padStart(2, "0") +
        String(d.getDate()).padStart(2, "0");
      return `SB-${ymd}-${rand(5)}`;
    })(),
    barcode: "",
    inventory: undefined,
    availability: "in_stock",
    guidelines: "",
    specifications: [],
    monthlySold: undefined,
    rewardPoints: undefined,
    customization: { customizable: false, options: [] },
    warranty: { period: "", details: "", provider: "" },
    returnPolicy: { days: undefined, refundable: true, details: "" },
    faqs: [],
    frequentlyBoughtTogether: [],
    reviews: [],
    averageRating: 0,
    reviewCount: 0,
    status: "draft",
    seo: { title: "", description: "", keywords: "" },
    featured: false,
    coupon: false,
    flashSale: false,
    clearance: false,
    freeShipping: false,
    badges: [],
    certifications: [],
  });

  const [saving, setSaving] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [recentUploads, setRecentUploads] = useState([]);

  const trackUpload = (asset) => {
    setRecentUploads((prev) =>
      prev.some((r) => r.public_id === asset.public_id)
        ? prev
        : [asset, ...prev],
    );
  };
  const [newReview, setNewReview] = useState({
    authorName: "",
    rating: "",
    title: "",
    body: "",
  });
  const [editingReviewIdx, setEditingReviewIdx] = useState(null);
  const [editReviewForm, setEditReviewForm] = useState({
    authorName: "",
    rating: "",
    title: "",
    body: "",
  });
  const [draftId, setDraftId] = useState(null); // Track backend draft ID
  const [lastSaved, setLastSaved] = useState(null);
  const [fbtSearch, setFbtSearch] = useState("");
  const [fbtSearchResults, setFbtSearchResults] = useState([]);
  const [fbtSearching, setFbtSearching] = useState(false);
  const [badgeOptions, setBadgeOptions] = useState(DEFAULT_BADGE_OPTIONS);
  const [showBadgeManager, setShowBadgeManager] = useState(false);
  const [badgeSaving, setBadgeSaving] = useState(false);
  const [newBadgeKey, setNewBadgeKey] = useState("");
  const [newBadgeLabel, setNewBadgeLabel] = useState("");

  // helper strings for comma‑separated inputs (tags) so user can type freely
  const [tagStr, setTagStr] = useState("");

  // Department autocomplete
  const [departmentSuggestions, setDepartmentSuggestions] = useState([]);
  const [showDepartmentSuggestions, setShowDepartmentSuggestions] =
    useState(false);
  const [allDepartments, setAllDepartments] = useState([
    "ryans",
    "asus",
    "cosrx",
    "samsung",
    "apple",
    "sony",
    "lg",
    "dell",
    "hp",
    "lenovo",
    "xiaomi",
    "realme",
    "vivo",
    "oppo",
    "huawei",
    "oneplus",
    "google",
    "microsoft",
    "canon",
    "nikon",
    "logitech",
    "razer",
    "corsair",
    "asus rog",
    "msi",
    "gigabyte",
    "amd",
    "intel",
    "nvidia",
    "seagate",
    "western digital",
    "sandisk",
    "toshiba",
  ]);

  const inputClass =
    "w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all";
  const labelClass = "block text-sm font-semibold text-gray-700 mb-2";
  const toDateInput = (value) => {
    if (!value) return "";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "";
    return d.toISOString().slice(0, 10);
  };
  const normalizeProductRefs = (items) =>
    (items || []).map((p) => p?._id || p?.id || p).filter(Boolean);
  const normalizeBadgeKey = (value) => {
    const normalized = String(value || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");
    return normalized;
  };
  const shouldKeepBadgeOption = useCallback((item) => {
    const key = normalizeBadgeKey(item?.key || item?.label);
    const label = String(item?.label || "")
      .trim()
      .toLowerCase();
    if (!key) return false;
    if (REMOVED_BADGE_KEYS.has(key)) return false;
    if (RESERVED_PROMOTION_FLAG_KEYS.has(key)) return false;
    if (RESERVED_PROMOTION_FLAG_LABELS.has(label)) return false;
    return true;
  }, []);
  const sanitizeBadgeKeys = useCallback(
    (items) => {
      return (items || []).filter((key) => shouldKeepBadgeOption({ key }));
    },
    [shouldKeepBadgeOption],
  );
  const sanitizeBadgeOptions = useCallback(
    (items) => {
      const seenKeys = new Set();
      const seenLabels = new Set();
      return (items || []).filter((item) => {
        if (!shouldKeepBadgeOption(item)) return false;
        const key = normalizeBadgeKey(item.key || item.label);
        const label = String(item.label || "")
          .trim()
          .toLowerCase();
        if (seenKeys.has(key) || (label && seenLabels.has(label))) return false;
        seenKeys.add(key);
        if (label) seenLabels.add(label);
        return true;
      });
    },
    [shouldKeepBadgeOption],
  );
  const uniqueBadgeOptions = (items) => {
    const seen = new Set();
    return (items || []).filter((item) => {
      if (!item?.key || seen.has(item.key)) return false;
      seen.add(item.key);
      return true;
    });
  };
  const loadBadgeOptions = useCallback(async () => {
    try {
      const resp = await fetch(`${API}/api/admin/settings`, {
        credentials: "include",
      });
      const body = await resp.json();
      // Only show what's in DB (dashboard/tags/) — no hardcoded fallbacks.
      const fromDB = Array.isArray(body?.settings?.megaMenuTags)
        ? body.settings.megaMenuTags
            .filter((tag) => tag && tag.name && tag.isActive !== false)
            .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
            .map((tag) => {
              const href = String(tag.href || "");
              const key = href.startsWith("/tag/")
                ? normalizeBadgeKey(href.slice(5).replace(/-/g, "_"))
                : normalizeBadgeKey(tag.name);
              return {
                key,
                label: String(tag.name).trim(),
                color: "bg-gray-100 text-gray-800",
              };
            })
            .filter((b) => b.key && b.label)
        : [];
      setBadgeOptions(fromDB);
    } catch {
      setBadgeOptions(DEFAULT_BADGE_OPTIONS);
    }
  }, [API, sanitizeBadgeOptions]);
  const saveBadgeOptions = async (nextOptions) => {
    setBadgeSaving(true);
    try {
      const payload = sanitizeBadgeOptions(
        uniqueBadgeOptions(
          (nextOptions || [])
            .map((b) => ({
              key: normalizeBadgeKey(b.key),
              label: String(b.label || "").trim(),
              color:
                String(b.color || "").trim() || "bg-gray-100 text-gray-800",
            }))
            .filter((b) => b.key && b.label),
        ),
      );
      const resp = await fetch(`${API}/api/admin/settings/badges`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ productBadgeOptions: payload }),
      });
      const body = await resp.json();
      if (!resp.ok)
        throw new Error(body.error || "Failed to save badge options");
      setBadgeOptions(payload);
      alert("Badge options saved");
    } catch (err) {
      alert(err.message || "Failed to save badge options");
    } finally {
      setBadgeSaving(false);
    }
  };

  useEffect(() => {
    setProduct((prev) => {
      const nextBadges = sanitizeBadgeKeys(prev.badges || []);
      return nextBadges.length === (prev.badges || []).length
        ? prev
        : { ...prev, badges: nextBadges };
    });
  }, [sanitizeBadgeKeys]);

  useEffect(() => {
    if (!user) refreshUser();
  }, [user, refreshUser]);

  // Check for existing draft on mount
  useEffect(() => {
    const checkForDraft = async () => {
      try {
        // Check backend for latest draft
        const resp = await fetch(
          `${API}/api/admin/products?limit=1&status=draft`,
          {
            credentials: "include",
          },
        );
        const body = await resp.json();

        if (resp.ok && body.items && body.items.length > 0) {
          const latestDraft = body.items[0];
          // Only restore if it's recent (within last 24 hours)
          const draftAge =
            Date.now() - new Date(latestDraft.updatedAt).getTime();
          const twentyFourHours = 24 * 60 * 60 * 1000;

          if (draftAge < twentyFourHours) {
            const shouldRestore = confirm(
              `Found an unsaved draft from ${new Date(latestDraft.updatedAt).toLocaleString()}. Would you like to continue editing it?`,
            );
            if (shouldRestore) {
              setProduct(latestDraft);
              setDraftId(latestDraft._id);
              setTagStr((latestDraft.tags || []).join(", "));
            }
          }
        }
      } catch (err) {
        console.error("Error checking for drafts:", err);
      }
    };

    checkForDraft();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // synchronize string states when product loads/changes
  useEffect(() => {
    setTagStr((product.tags || []).join(", "));
  }, [product.tags]);

  const [categories, setCategories] = useState([]);
  const [selectedMain, setSelectedMain] = useState(null);
  const [selectedSub, setSelectedSub] = useState(null);
  const [selectedChild, setSelectedChild] = useState(null);

  useEffect(() => {
    fetch(`${API}/api/products/categories`)
      .then((r) => r.json())
      .then((b) => {
        setCategories(b.categories || []);
      })
      .catch(() => setCategories([]));
  }, [API]);

  useEffect(() => {
    loadBadgeOptions();
  }, [loadBadgeOptions]);

  useEffect(() => {
    const current = product.badges || [];
    if (!current.length) return;
    setBadgeOptions((prev) => {
      const existing = new Set((prev || []).map((b) => b.key));
      const missing = sanitizeBadgeKeys(current)
        .filter((key) => key && !existing.has(key))
        .map((key) => ({
          key,
          label: key
            .replace(/_/g, " ")
            .replace(/\b\w/g, (c) => c.toUpperCase()),
          color: "bg-gray-100 text-gray-800",
        }));
      return missing.length
        ? sanitizeBadgeOptions([...(prev || []), ...missing])
        : prev;
    });
  }, [product.badges, sanitizeBadgeKeys, sanitizeBadgeOptions]);

  // Auto-save draft to backend
  const saveDraftToBackend = useCallback(async () => {
    if (!product.title) return; // Need at least a title to save

    try {
      const finalTags = tagStr
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const payload = {
        ...product,
        tags: finalTags,
        badges: sanitizeBadgeKeys(product.badges),
        frequentlyBoughtTogether: normalizeProductRefs(
          product.frequentlyBoughtTogether,
        ),
        status: "draft", // Always save as draft for auto-save
      };
      // Remove deprecated fields if they exist
      delete payload.colors;
      delete payload.sizes;

      let resp, body;
      if (draftId) {
        // Update existing draft
        resp = await fetch(`${API}/api/admin/products/${draftId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        });
      } else {
        // Create new draft
        resp = await fetch(`${API}/api/admin/products`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        });
      }

      body = await resp.json();
      if (!resp.ok) throw new Error(body.error || "Save draft failed");

      // Store draft ID if this was a new draft
      if (!draftId && body.product?._id) {
        setDraftId(body.product._id);
      }

      setLastSaved(new Date());
      console.log("Draft auto-saved at", new Date().toLocaleTimeString());
      return true;
    } catch (err) {
      console.error("Failed to save draft:", err);
      return false;
    }
  }, [product, tagStr, draftId, API, sanitizeBadgeKeys]);

  // Auto-save every 5 seconds
  useEffect(() => {
    if (!product.title) return; // Don't save empty product

    const timer = setInterval(() => {
      saveDraftToBackend();
    }, 5000); // 5 seconds

    return () => clearInterval(timer);
  }, [product.title, saveDraftToBackend]);

  // Save before page unload (back, close tab, power off)
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (product.title) {
        // Use sendBeacon for reliable saving
        const finalTags = tagStr
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
        const payload = {
          ...product,
          tags: finalTags,
          badges: sanitizeBadgeKeys(product.badges),
          frequentlyBoughtTogether: normalizeProductRefs(
            product.frequentlyBoughtTogether,
          ),
          status: "draft",
        };
        // Remove deprecated fields
        delete payload.colors;
        delete payload.sizes;

        const url = draftId
          ? `${API}/api/admin/products/${draftId}`
          : `${API}/api/admin/products`;

        const blob = new Blob([JSON.stringify(payload)], {
          type: "application/json",
        });

        if (navigator.sendBeacon) {
          navigator.sendBeacon(url, blob);
        }
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [product, tagStr, draftId, API, sanitizeBadgeKeys]);

  // Department autocomplete handler
  const handleDepartmentChange = (value) => {
    setProduct((p) => ({ ...p, department: value }));
    if (value.trim()) {
      const filtered = allDepartments.filter((dept) =>
        dept.toLowerCase().includes(value.toLowerCase()),
      );
      setDepartmentSuggestions(filtered);
      setShowDepartmentSuggestions(true);
    } else {
      setShowDepartmentSuggestions(false);
    }
  };

  const selectDepartment = (dept) => {
    setProduct((p) => ({ ...p, department: dept }));
    setShowDepartmentSuggestions(false);
    if (!allDepartments.includes(dept)) {
      setAllDepartments([...allDepartments, dept]);
    }
  };

  const handleFile = async (file) => {
    if (file.size > MAX_UPLOAD_BYTES) {
      alert(`"${file.name}" সাইজ ${(file.size / 1024 / 1024).toFixed(1)}MB — সর্বোচ্চ ১০MB অনুমোদিত।`);
      return;
    }
    const preview = URL.createObjectURL(file);
    setProduct((p) => ({
      ...p,
      images: [
        ...(p.images || []),
        { url: preview, __local: true, uploading: true },
      ],
    }));

    try {
      const asset = await uploadImageDirect(file, "Pickob/products");

      setProduct((p) => {
        const imgs = (p.images || []).map((img) => {
          if (img.__local && img.url === preview) return asset;
          return img;
        });
        return { ...p, images: imgs };
      });
      trackUpload(asset);

      try {
        URL.revokeObjectURL(preview);
      } catch (e) {
        /* ignore */
      }
    } catch (err) {
      setProduct((p) => ({
        ...p,
        images: (p.images || []).filter(
          (i) => !(i.__local && i.url === preview),
        ),
      }));
      alert(err.message || "Upload failed");
    }
  };

  const onAddVariant = () => {
    setProduct((p) => ({
      ...p,
      variants: [
        ...(p.variants || []),
        {
          name: "",
          color: { name: "", hex: "#000000" },
          size: "",
          price: undefined,
          inventory: undefined,
          attributes: {},
        },
      ],
    }));
  };
  const onRemoveVariant = (idx) =>
    setProduct((p) => ({
      ...p,
      variants: p.variants.filter((_, i) => i !== idx),
    }));
  const onChangeVariant = (idx, patch) =>
    setProduct((p) => {
      const arr = [...(p.variants || [])];
      arr[idx] = { ...(arr[idx] || {}), ...patch };
      return { ...p, variants: arr };
    });

  const recalcReviews = (reviews) => {
    const list = reviews || [];
    const count = list.length;
    const sum = list.reduce((s, r) => s + (Number(r.rating) || 0), 0);
    const avg = count ? Math.round((sum / count) * 10) / 10 : 0;
    return { count, avg };
  };

  const addReview = () => {
    const rating = parseFloat(newReview.rating);
    if (isNaN(rating) || rating < 1 || rating > 5)
      return alert("Rating must be a number between 1 and 5");
    const review = {
      authorName: newReview.authorName || undefined,
      rating,
      title: newReview.title || "",
      body: newReview.body || "",
      helpful: 0,
      createdAt: new Date().toISOString(),
    };
    setProduct((p) => {
      const reviews = [...(p.reviews || []), review];
      const { count, avg } = recalcReviews(reviews);
      return { ...p, reviews, reviewCount: count, averageRating: avg };
    });
    setNewReview({ authorName: "", rating: "", title: "", body: "" });
  };

  const removeReviewAt = (idx) => {
    setProduct((p) => {
      const reviews = (p.reviews || []).filter((_, i) => i !== idx);
      const { count, avg } = recalcReviews(reviews);
      return { ...p, reviews, reviewCount: count, averageRating: avg };
    });
  };

  const updateReviewAt = (idx, fields) => {
    setProduct((p) => {
      const reviews = (p.reviews || []).map((r, i) =>
        i === idx ? { ...r, ...fields } : r,
      );
      const { count, avg } = recalcReviews(reviews);
      return { ...p, reviews, reviewCount: count, averageRating: avg };
    });
  };

  const handleSave = async () => {
    if (!product.title) return alert("Title is required");
    if (
      Array.isArray(product.variants) &&
      product.variants.some((v) => v.price == null)
    ) {
      return alert(
        "Please enter a price for every variant or remove empty variants.",
      );
    }
    setSaving(true);
    try {
      // ensure tags reflect current string inputs
      const finalTags = tagStr
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const payload = {
        ...product,
        tags: finalTags,
        badges: sanitizeBadgeKeys(product.badges),
        frequentlyBoughtTogether: normalizeProductRefs(
          product.frequentlyBoughtTogether,
        ),
      };
      // Remove deprecated fields
      delete payload.colors;
      delete payload.sizes;

      let resp, body;
      if (draftId) {
        // Update existing draft instead of creating new
        resp = await fetch(`${API}/api/admin/products/${draftId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        });
      } else {
        // Create new product
        resp = await fetch(`${API}/api/admin/products`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        });
      }

      body = await resp.json();
      if (!resp.ok) throw new Error(body.error || "Save failed");

      // Clear draft ID and navigate to products list
      setDraftId(null);
      router.push("/dashboard/products");
    } catch (err) {
      alert(err.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: "basic", label: "Basic Info", icon: "📝" },
    { id: "pricing", label: "Pricing", icon: "💰" },
    { id: "images", label: "Images", icon: "🖼️" },
    { id: "variants", label: "Variants", icon: "🔀" },
    { id: "attributes", label: "Attributes", icon: "⚙️" },
    { id: "policies", label: "Policies", icon: "📋" },
    { id: "reviews", label: "Reviews", icon: "⭐" },
    { id: "seo", label: "SEO", icon: "🔍" },
  ];

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 py-4 sm:py-6 md:py-8">
      <div className="mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">
                Create New Product
              </h1>
              <p className="text-gray-600 mt-1">
                Add a new product to your catalog
              </p>
              {lastSaved && (
                <p className="text-sm text-green-600 mt-1">
                  ✓ Auto-saved at {lastSaved.toLocaleTimeString()}
                </p>
              )}
            </div>
            <button
              onClick={() => router.push("/dashboard/products")}
              className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              ✕ Cancel
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="relative space-y-12 xl:pr-[24rem] xl:min-h-[220rem]">
          {/* Basic Info Tab */}
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6 items-start">
              <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="mb-6">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
                    Main Details
                  </p>
                  <h3 className="mt-2 text-lg font-semibold text-gray-900">
                    Product Story
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Keep the important information in one place so the form is
                    easier to scan.
                  </p>
                </div>

                <div className="space-y-5">
                  <div>
                    <label className={labelClass}>
                      Product Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={product.title}
                      onChange={(e) =>
                        setProduct((p) => ({ ...p, title: e.target.value }))
                      }
                      className={inputClass}
                      placeholder="Enter product title"
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Description</label>
                    <textarea
                      value={product.description || ""}
                      onChange={(e) =>
                        setProduct((p) => ({
                          ...p,
                          description: e.target.value,
                        }))
                      }
                      className={`${inputClass} h-32`}
                      placeholder="Short description for quick reading"
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Detailed Description</label>
                    <p className="text-sm text-gray-600 mb-3">
                      Add text blocks, full-width images, or 2-image rows. Shown
                      on the product page after Recently Viewed.
                    </p>
                    <DetailedDescriptionBuilder
                      value={product.detailedDescription}
                      onChange={(blocks) =>
                        setProduct((p) => ({
                          ...p,
                          detailedDescription: blocks,
                        }))
                      }
                      onImageUploaded={trackUpload}
                    />
                  </div>
                </div>
              </section>

              <aside className="space-y-4 xl:absolute xl:right-0 xl:top-0 xl:w-[22rem] mb-10">
                <section className="rounded-2xl border border-gray-200 bg-slate-50 p-5 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
                    Status
                  </p>
                  <div className="mt-4">
                    <label className={labelClass}>Product Status</label>
                    <select
                      value={product.status}
                      onChange={(e) =>
                        setProduct((p) => ({ ...p, status: e.target.value }))
                      }
                      className={inputClass}
                    >
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>
                </section>

                <section className="rounded-2xl border border-gray-200 bg-slate-50 p-5 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
                    Organization
                  </p>
                  <div className="mt-4 space-y-4">
                    <div className="relative">
                      <label className={labelClass}>Department / Brand</label>
                      <input
                        type="text"
                        value={product.department || ""}
                        onChange={(e) => handleDepartmentChange(e.target.value)}
                        onFocus={() =>
                          product.department &&
                          setShowDepartmentSuggestions(true)
                        }
                        onBlur={() =>
                          setTimeout(
                            () => setShowDepartmentSuggestions(false),
                            200,
                          )
                        }
                        className={inputClass}
                        placeholder="e.g., ryans, asus, cosrx..."
                      />
                      {showDepartmentSuggestions &&
                        departmentSuggestions.length > 0 && (
                          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                            {departmentSuggestions.map((dept, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onMouseDown={() => selectDepartment(dept)}
                                className="w-full text-left px-4 py-2 hover:bg-indigo-50 transition-colors"
                              >
                                {dept}
                              </button>
                            ))}
                          </div>
                        )}
                    </div>

                    <div>
                      <label className={labelClass}>Category</label>
                      <div className="space-y-3">
                        <select
                          value={selectedMain?._id || ""}
                          onChange={(e) => {
                            const id = e.target.value;
                            const main =
                              categories.find((c) => String(c._id) === id) ||
                              null;
                            setSelectedMain(main);
                            setSelectedSub(null);
                            setSelectedChild(null);
                            setProduct((p) => ({
                              ...p,
                              categoryId: id || undefined,
                              category: main?.name || "",
                            }));
                          }}
                          className={inputClass}
                        >
                          <option value="">Select Main Category</option>
                          {categories.map((c) => (
                            <option key={c._id} value={c._id}>
                              {c.name}
                            </option>
                          ))}
                        </select>

                        <select
                          value={selectedSub?._id || ""}
                          onChange={(e) => {
                            const id = e.target.value;
                            const sub =
                              (selectedMain?.children || []).find(
                                (c) => String(c._id) === id,
                              ) || null;
                            setSelectedSub(sub);
                            setSelectedChild(null);
                            setProduct((p) => ({
                              ...p,
                              categoryId: id || p.categoryId,
                            }));
                          }}
                          className={inputClass}
                          disabled={!selectedMain}
                        >
                          <option value="">Sub Category</option>
                          {(selectedMain?.children || []).map((c) => (
                            <option key={c._id} value={c._id}>
                              {c.name}
                            </option>
                          ))}
                        </select>

                        <select
                          value={selectedChild?._id || ""}
                          onChange={(e) => {
                            const id = e.target.value;
                            const child =
                              (selectedSub?.children || []).find(
                                (c) => String(c._id) === id,
                              ) || null;
                            setSelectedChild(child);
                            setProduct((p) => ({
                              ...p,
                              categoryId: id || p.categoryId,
                            }));
                          }}
                          className={inputClass}
                          disabled={!selectedSub}
                        >
                          <option value="">Child Category</option>
                          {(selectedSub?.children || []).map((c) => (
                            <option key={c._id} value={c._id}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className={labelClass}>
                        Tags (comma-separated)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g., brightening, niacinamide, daily"
                        value={tagStr}
                        onChange={(e) => setTagStr(e.target.value)}
                        onBlur={() =>
                          setProduct((p) => ({
                            ...p,
                            tags: tagStr
                              .split(",")
                              .map((s) => s.trim())
                              .filter(Boolean),
                          }))
                        }
                        className={inputClass}
                      />
                    </div>
                  </div>
                </section>

                <ProductAsideSections
                  product={product}
                  setProduct={setProduct}
                  badgeOptions={badgeOptions}
                  setBadgeOptions={setBadgeOptions}
                  showBadgeManager={showBadgeManager}
                  setShowBadgeManager={setShowBadgeManager}
                  badgeSaving={badgeSaving}
                  saveBadgeOptions={saveBadgeOptions}
                  newBadgeLabel={newBadgeLabel}
                  setNewBadgeLabel={setNewBadgeLabel}
                  newBadgeKey={newBadgeKey}
                  setNewBadgeKey={setNewBadgeKey}
                  normalizeBadgeKey={normalizeBadgeKey}
                  labelClass={labelClass}
                  inputClass={inputClass}
                  fbtSearch={fbtSearch}
                  setFbtSearch={setFbtSearch}
                  fbtSearchResults={fbtSearchResults}
                  setFbtSearchResults={setFbtSearchResults}
                  fbtSearching={fbtSearching}
                  setFbtSearching={setFbtSearching}
                  API={API}
                />
              </aside>
              {/* Product Badges & Promotion Flags */}
              <div className="hidden">
                <label className={labelClass}>
                  Product Badges &amp; Promotion Flags
                </label>
                <div className="flex flex-wrap gap-3 mt-2">
                  {(badgeOptions || []).map((b) => (
                    <label
                      key={b.key}
                      className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border-2 cursor-pointer transition-all ${
                        (product.badges || []).includes(b.key)
                          ? `${b.color || "bg-gray-100 text-gray-800"} border-current font-semibold`
                          : "border-gray-300 hover:border-gray-400"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={(product.badges || []).includes(b.key)}
                        onChange={() =>
                          setProduct((p) => ({
                            ...p,
                            badges: (p.badges || []).includes(b.key)
                              ? p.badges.filter((x) => x !== b.key)
                              : [...(p.badges || []), b.key],
                          }))
                        }
                        className="w-4 h-4"
                      />
                      {b.label}
                    </label>
                  ))}
                  {[
                    {
                      field: "featured",
                      label: "Featured",
                      color: "bg-indigo-100 text-indigo-800",
                    },
                    {
                      field: "coupon",
                      label: "Coupon",
                      color: "bg-teal-100 text-teal-800",
                    },
                    {
                      field: "flashSale",
                      label: "Flash Sale",
                      color: "bg-rose-100 text-rose-800",
                    },
                    {
                      field: "clearance",
                      label: "Clearance",
                      color: "bg-amber-100 text-amber-800",
                    },
                    {
                      field: "freeShipping",
                      label: "🚚 Free Shipping",
                      color: "bg-green-100 text-green-800",
                    },
                  ].map((f) => (
                    <label
                      key={f.field}
                      className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border-2 cursor-pointer transition-all ${
                        product[f.field]
                          ? `${f.color} border-current font-semibold`
                          : "border-gray-300 hover:border-gray-400"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={product[f.field] || false}
                        onChange={(e) =>
                          setProduct((p) => ({
                            ...p,
                            [f.field]: e.target.checked,
                          }))
                        }
                        className="w-4 h-4"
                      />
                      {f.label}
                    </label>
                  ))}
                </div>

                <div className="mt-3">
                  <button
                    type="button"
                    onClick={() => setShowBadgeManager((v) => !v)}
                    className="px-3 py-1.5 text-sm border border-indigo-300 text-indigo-700 rounded-lg hover:bg-indigo-50"
                  >
                    {showBadgeManager ? "Hide Badge Manager" : "Manage Badges"}
                  </button>
                </div>

                {showBadgeManager && (
                  <div className="mt-3 rounded-xl border border-indigo-200 bg-indigo-50 p-4 space-y-3">
                    {(badgeOptions || []).map((item, index) => (
                      <div
                        key={`${item.key}-${index}`}
                        className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center"
                      >
                        <input
                          type="text"
                          value={item.label || ""}
                          onChange={(e) =>
                            setBadgeOptions((prev) =>
                              prev.map((b, i) =>
                                i === index
                                  ? { ...b, label: e.target.value }
                                  : b,
                              ),
                            )
                          }
                          className="md:col-span-4 px-3 py-2 rounded-lg border border-gray-300"
                          placeholder="Badge label"
                        />
                        <input
                          type="text"
                          value={item.key || ""}
                          onChange={(e) => {
                            const oldKey = item.key;
                            const nextKey = normalizeBadgeKey(e.target.value);
                            setBadgeOptions((prev) =>
                              prev.map((b, i) =>
                                i === index ? { ...b, key: nextKey } : b,
                              ),
                            );
                            if (oldKey && nextKey && oldKey !== nextKey) {
                              setProduct((prev) => ({
                                ...prev,
                                badges: (prev.badges || []).map((x) =>
                                  x === oldKey ? nextKey : x,
                                ),
                              }));
                            }
                          }}
                          className="md:col-span-4 px-3 py-2 rounded-lg border border-gray-300"
                          placeholder="badge_key"
                        />
                        <input
                          type="text"
                          value={item.color || ""}
                          onChange={(e) =>
                            setBadgeOptions((prev) =>
                              prev.map((b, i) =>
                                i === index
                                  ? { ...b, color: e.target.value }
                                  : b,
                              ),
                            )
                          }
                          className="md:col-span-3 px-3 py-2 rounded-lg border border-gray-300"
                          placeholder="bg-gray-100 text-gray-800"
                        />
                        <button
                          type="button"
                          className="md:col-span-1 px-2 py-2 rounded-lg border border-red-300 text-red-600 hover:bg-red-50"
                          onClick={() => {
                            const removed = badgeOptions[index];
                            const nextOptions = badgeOptions.filter(
                              (_, i) => i !== index,
                            );
                            setBadgeOptions(nextOptions);
                            if (removed?.key) {
                              setProduct((prev) => ({
                                ...prev,
                                badges: (prev.badges || []).filter(
                                  (x) => x !== removed.key,
                                ),
                              }));
                            }
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    ))}

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center pt-2 border-t border-indigo-200">
                      <input
                        type="text"
                        value={newBadgeLabel}
                        onChange={(e) => setNewBadgeLabel(e.target.value)}
                        className="md:col-span-4 px-3 py-2 rounded-lg border border-gray-300"
                        placeholder="New badge label"
                      />
                      <input
                        type="text"
                        value={newBadgeKey}
                        onChange={(e) => setNewBadgeKey(e.target.value)}
                        className="md:col-span-4 px-3 py-2 rounded-lg border border-gray-300"
                        placeholder="new_badge_key"
                      />
                      <input
                        type="text"
                        className="md:col-span-3 px-3 py-2 rounded-lg border border-gray-300"
                        value="bg-gray-100 text-gray-800"
                        readOnly
                      />
                      <button
                        type="button"
                        className="md:col-span-1 px-2 py-2 rounded-lg border border-indigo-300 text-indigo-700 hover:bg-indigo-100"
                        onClick={() => {
                          const key = normalizeBadgeKey(
                            newBadgeKey || newBadgeLabel,
                          );
                          const label = String(newBadgeLabel || "").trim();
                          if (!key || !label) return;
                          if ((badgeOptions || []).some((b) => b.key === key))
                            return;
                          setBadgeOptions((prev) => [
                            ...prev,
                            { key, label, color: "bg-gray-100 text-gray-800" },
                          ]);
                          setNewBadgeKey("");
                          setNewBadgeLabel("");
                        }}
                      >
                        +
                      </button>
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="button"
                        disabled={badgeSaving}
                        onClick={() => saveBadgeOptions(badgeOptions)}
                        className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm hover:bg-indigo-700 disabled:opacity-60"
                      >
                        {badgeSaving ? "Saving..." : "Save Badge Options"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Images Tab */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Product Images
            </h2>

            <div>
              <label className={labelClass}>Upload Images</label>
              <p className="text-sm text-gray-600 mb-4">
                Add high-quality images of your product. First image will be the
                main product image.
              </p>

              <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-indigo-500 hover:bg-indigo-50 transition-all">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) =>
                    Array.from(e.target.files || []).forEach(
                      (f) => f && handleFile(f),
                    )
                  }
                />
                <div className="text-center">
                  <svg
                    className="w-16 h-16 mx-auto text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                  <p className="mt-2 text-sm text-gray-600">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-xs text-gray-500">
                    PNG, JPG, WebP up to 5MB
                  </p>
                </div>
              </label>

              <button
                type="button"
                onClick={() => setShowPicker(true)}
                className="mt-3 flex items-center gap-2 px-4 py-2 border border-indigo-200 rounded-lg text-sm text-indigo-600 hover:bg-indigo-50 transition"
              >
                🖼 Select from Media Library
              </button>

              <MediaPicker
                open={showPicker}
                multiple
                recentUploads={recentUploads}
                onSelect={(assets) => {
                  setProduct((p) => ({
                    ...p,
                    images: [
                      ...(p.images || []),
                      ...assets.map((a) => ({
                        url: a.url,
                        public_id: a.public_id,
                      })),
                    ],
                  }));
                  setShowPicker(false);
                }}
                onClose={() => setShowPicker(false)}
              />

              {/* Image Preview Grid */}
              {(product.images || []).length > 0 && (
                <ImageDragGrid
                  images={product.images}
                  onReorder={(imgs) =>
                    setProduct((p) => ({ ...p, images: imgs }))
                  }
                  onRemove={(i) =>
                    setProduct((p) => ({
                      ...p,
                      images: p.images.filter((_, idx) => idx !== i),
                    }))
                  }
                />
              )}
            </div>
          </div>

          {/* Variants Tab */}
          <ProductVariantBuilder
            product={product}
            setProduct={setProduct}
            inputClass={inputClass}
            labelClass={labelClass}
          />

          {/* Attributes Tab */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Product Attributes
            </h2>

            {/* Specifications */}
            <div className="">
              <label className={labelClass}>Specifications</label>
              <p className="text-sm text-gray-600 mb-4">
                Add section headers and key-value rows. Headers group the rows
                under them.
              </p>
              <div className="space-y-1.5">
                {(Array.isArray(product.specifications)
                  ? product.specifications
                  : []
                ).map((spec, i) => {
                  const patch = (val) =>
                    setProduct((p) => {
                      const arr = [
                        ...(Array.isArray(p.specifications)
                          ? p.specifications
                          : []),
                      ];
                      arr[i] = { ...arr[i], ...val };
                      return { ...p, specifications: arr };
                    });
                  const remove = () =>
                    setProduct((p) => ({
                      ...p,
                      specifications: (Array.isArray(p.specifications)
                        ? p.specifications
                        : []
                      ).filter((_, idx) => idx !== i),
                    }));

                  if (spec.type === "header") {
                    return (
                      <div key={i} className="flex gap-2 items-center">
                        <span className="shrink-0 text-xs font-bold uppercase tracking-widest text-indigo-600 bg-indigo-50 border border-indigo-200 rounded px-2 py-1">
                          Header
                        </span>
                        <input
                          type="text"
                          value={spec.label || ""}
                          onChange={(e) => patch({ label: e.target.value })}
                          placeholder="e.g., Technical Specification"
                          className="flex-1 rounded-lg border border-indigo-300 bg-indigo-50 px-3 py-2 text-sm font-semibold text-indigo-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                        />
                        <button
                          type="button"
                          onClick={remove}
                          className="px-3 py-2 bg-red-400 text-white rounded-lg hover:bg-red-500 text-sm"
                        >
                          ✕
                        </button>
                      </div>
                    );
                  }

                  return (
                    <div key={i} className="flex gap-2 items-center">
                      <input
                        type="text"
                        value={spec.key || ""}
                        onChange={(e) => patch({ key: e.target.value })}
                        placeholder="e.g., Frequency Range"
                        className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
                      />
                      <input
                        type="text"
                        value={spec.value || ""}
                        onChange={(e) => patch({ value: e.target.value })}
                        placeholder="e.g., 20Hz–20KHz"
                        className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
                      />
                      <button
                        type="button"
                        onClick={remove}
                        className="px-3 py-2 bg-red-400 text-white rounded-lg hover:bg-red-500 text-sm"
                      >
                        ✕
                      </button>
                    </div>
                  );
                })}
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() =>
                      setProduct((p) => ({
                        ...p,
                        specifications: [
                          ...(Array.isArray(p.specifications)
                            ? p.specifications
                            : []),
                          { key: "", value: "" },
                        ],
                      }))
                    }
                    className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 font-medium text-sm"
                  >
                    + Add Row
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setProduct((p) => ({
                        ...p,
                        specifications: [
                          ...(Array.isArray(p.specifications)
                            ? p.specifications
                            : []),
                          { type: "header", label: "" },
                        ],
                      }))
                    }
                    className="px-4 py-2 bg-indigo-100 text-indigo-700 border border-indigo-300 rounded-lg hover:bg-indigo-200 font-medium text-sm"
                  >
                    + Add Section Header
                  </button>
                </div>
              </div>
            </div>

            {/* Care Guidelines */}
            <div className="">
              <label className={labelClass}>Care & Handling Instructions</label>
              <p className="text-sm text-gray-600 mb-2">
                Use bold, italic, bullet lists etc. Saved and shown exactly as
                typed on the Guides tab.
              </p>
              <RichTextEditor
                value={product.guidelines || ""}
                onChange={(html) =>
                  setProduct((p) => ({ ...p, guidelines: html }))
                }
                placeholder="e.g. Machine wash cold, tumble dry low…"
                minHeight="min-h-[160px]"
              />
            </div>

            {/* Customization */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <input
                  type="checkbox"
                  id="customizable"
                  checked={product.customization?.customizable || false}
                  onChange={(e) =>
                    setProduct((p) => ({
                      ...p,
                      customization: {
                        ...(p.customization || {}),
                        customizable: e.target.checked,
                      },
                    }))
                  }
                  className="w-5 h-5"
                />
                <label
                  htmlFor="customizable"
                  className="text-lg font-semibold text-gray-900"
                >
                  Allow Product Customization
                </label>
              </div>

              {product.customization?.customizable && (
                <div className="space-y-3">
                  {(product.customization.options || []).map((opt, i) => (
                    <div key={i} className="flex gap-3 items-center">
                      <input
                        type="text"
                        value={opt.name || ""}
                        onChange={(e) =>
                          setProduct((p) => {
                            const arr = [...(p.customization.options || [])];
                            arr[i] = {
                              ...(arr[i] || {}),
                              name: e.target.value,
                            };
                            return {
                              ...p,
                              customization: {
                                ...p.customization,
                                options: arr,
                              },
                            };
                          })
                        }
                        placeholder="Option name (e.g., Engraving)"
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
                      />
                      <input
                        type="text"
                        value={opt.type || ""}
                        onChange={(e) =>
                          setProduct((p) => {
                            const arr = [...(p.customization.options || [])];
                            arr[i] = {
                              ...(arr[i] || {}),
                              type: e.target.value,
                            };
                            return {
                              ...p,
                              customization: {
                                ...p.customization,
                                options: arr,
                              },
                            };
                          })
                        }
                        placeholder="Type (e.g. text, select)"
                        className="w-32 px-4 py-2 border border-gray-300 rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setProduct((p) => ({
                            ...p,
                            customization: {
                              ...p.customization,
                              options: p.customization.options.filter(
                                (_, idx) => idx !== i,
                              ),
                            },
                          }))
                        }
                        className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() =>
                      setProduct((p) => ({
                        ...p,
                        customization: {
                          ...p.customization,
                          options: [
                            ...(p.customization.options || []),
                            { name: "", type: "text", values: [] },
                          ],
                        },
                      }))
                    }
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    + Add Customization Option
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Policies Tab */}
          <div className="space-y-6">
            {/* Warranty */}
            <div className="hidden">
              <label className="text-lg font-semibold text-gray-900 mb-4 block">
                Product Warranty
              </label>
              <p className="text-sm text-gray-600 mb-4">
                Provide warranty information to build customer trust
              </p>

              <div className="space-y-4">
                <div>
                  <label className={labelClass}>Warranty Period</label>
                  <input
                    type="text"
                    value={product.warranty?.period || ""}
                    onChange={(e) =>
                      setProduct((p) => ({
                        ...p,
                        warranty: {
                          ...(p.warranty || {}),
                          period: e.target.value,
                        },
                      }))
                    }
                    className={inputClass}
                    placeholder="e.g., 12 months, 2 years"
                  />
                </div>
                <div>
                  <label className={labelClass}>Warranty Provider</label>
                  <input
                    type="text"
                    value={product.warranty?.provider || ""}
                    onChange={(e) =>
                      setProduct((p) => ({
                        ...p,
                        warranty: {
                          ...(p.warranty || {}),
                          provider: e.target.value,
                        },
                      }))
                    }
                    className={inputClass}
                    placeholder="e.g., Manufacturer, Store"
                  />
                </div>
                <div>
                  <label className={labelClass}>Warranty Details</label>
                  <textarea
                    value={product.warranty?.details || ""}
                    onChange={(e) =>
                      setProduct((p) => ({
                        ...p,
                        warranty: {
                          ...(p.warranty || {}),
                          details: e.target.value,
                        },
                      }))
                    }
                    className={`${inputClass} h-24`}
                    placeholder="Describe what the warranty covers..."
                  />
                </div>
              </div>
            </div>

            {/* Return Policy */}
            <div className="hidden">
              <label className="text-lg font-semibold text-gray-900 mb-4 block">
                Return Policy
              </label>
              <p className="text-sm text-gray-600 mb-4">
                Set clear return and refund policies
              </p>

              <div className="space-y-4">
                <div>
                  <label className={labelClass}>Return Window (Days)</label>
                  <input
                    type="number"
                    value={product.returnPolicy?.days ?? ""}
                    onChange={(e) =>
                      setProduct((p) => ({
                        ...p,
                        returnPolicy: {
                          ...(p.returnPolicy || {}),
                          days:
                            e.target.value === ""
                              ? undefined
                              : Number(e.target.value),
                        },
                      }))
                    }
                    className={inputClass}
                    placeholder="e.g., 30"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="refundable"
                    checked={product.returnPolicy?.refundable ?? true}
                    onChange={(e) =>
                      setProduct((p) => ({
                        ...p,
                        returnPolicy: {
                          ...(p.returnPolicy || {}),
                          refundable: e.target.checked,
                        },
                      }))
                    }
                    className="w-5 h-5"
                  />
                  <label
                    htmlFor="refundable"
                    className="text-sm font-medium text-gray-700"
                  >
                    Product is Refundable
                  </label>
                </div>
                <div>
                  <label className={labelClass}>Return Policy Details</label>
                  <textarea
                    value={product.returnPolicy?.details || ""}
                    onChange={(e) =>
                      setProduct((p) => ({
                        ...p,
                        returnPolicy: {
                          ...(p.returnPolicy || {}),
                          details: e.target.value,
                        },
                      }))
                    }
                    className={`${inputClass} h-24`}
                    placeholder="Describe the return process and conditions..."
                  />
                </div>
              </div>
            </div>

            {/* FAQs */}
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <label className="text-lg font-semibold text-gray-900 block">
                    Frequently Asked Questions
                  </label>
                  <p className="text-sm text-gray-600 mt-1">
                    Help customers by answering common questions
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setProduct((p) => ({
                      ...p,
                      faqs: [...(p.faqs || []), { question: "", answer: "" }],
                    }))
                  }
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  + Add FAQ
                </button>
              </div>

              {(product.faqs || []).length === 0 ? (
                <p className="text-center text-gray-500 py-4">
                  No FAQs yet. Click Add FAQ to create one.
                </p>
              ) : (
                <div className="space-y-4">
                  {(product.faqs || []).map((f, i) => (
                    <div
                      key={i}
                      className="bg-white rounded-lg p-4 border border-gray-200"
                    >
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Question
                          </label>
                          <input
                            type="text"
                            value={f.question || ""}
                            onChange={(e) =>
                              setProduct((p) => {
                                const arr = [...(p.faqs || [])];
                                arr[i] = {
                                  ...(arr[i] || {}),
                                  question: e.target.value,
                                };
                                return { ...p, faqs: arr };
                              })
                            }
                            className={inputClass}
                            placeholder="What is your question?"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Answer
                          </label>
                          <textarea
                            value={f.answer || ""}
                            onChange={(e) =>
                              setProduct((p) => {
                                const arr = [...(p.faqs || [])];
                                arr[i] = {
                                  ...(arr[i] || {}),
                                  answer: e.target.value,
                                };
                                return { ...p, faqs: arr };
                              })
                            }
                            className={`${inputClass} h-20`}
                            placeholder="Your answer..."
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            setProduct((p) => ({
                              ...p,
                              faqs: p.faqs.filter((_, idx) => idx !== i),
                            }))
                          }
                          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                        >
                          Remove FAQ
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Frequently Bought Together */}
            <div className="hidden">
              <div className="mb-4">
                <label className="text-lg font-semibold text-gray-900 block">
                  Frequently Bought Together
                </label>
                <p className="text-sm text-gray-600 mt-1">
                  Select up to 6 products shown when a user adds this product to
                  cart
                </p>
              </div>

              {/* Selected FBT products */}
              {(product.frequentlyBoughtTogether || []).length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {(product.frequentlyBoughtTogether || []).map((p, i) => (
                    <div
                      key={p._id || p.id || i}
                      className="flex items-center gap-2 bg-white border border-orange-300 rounded-lg px-3 py-1.5"
                    >
                      <span className="text-sm font-medium text-gray-800 max-w-40 truncate">
                        {p.title || p._id}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setProduct((prev) => ({
                            ...prev,
                            frequentlyBoughtTogether:
                              prev.frequentlyBoughtTogether.filter(
                                (_, idx) => idx !== i,
                              ),
                          }))
                        }
                        className="text-red-400 hover:text-red-600 font-bold leading-none"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Search */}
              {(product.frequentlyBoughtTogether || []).length < 6 && (
                <div className="relative">
                  <input
                    type="text"
                    value={fbtSearch}
                    onChange={async (e) => {
                      const q = e.target.value;
                      setFbtSearch(q);
                      if (!q.trim()) {
                        setFbtSearchResults([]);
                        return;
                      }
                      setFbtSearching(true);
                      try {
                        const r = await fetch(
                          `${API}/api/products?q=${encodeURIComponent(q)}&limit=10&status=published`,
                        );
                        const json = await r.json();
                        const selected = (
                          product.frequentlyBoughtTogether || []
                        ).map((x) => String(x._id || x.id || x));
                        setFbtSearchResults(
                          (json.items || []).filter(
                            (item) => !selected.includes(String(item._id)),
                          ),
                        );
                      } catch {
                        setFbtSearchResults([]);
                      } finally {
                        setFbtSearching(false);
                      }
                    }}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                    placeholder="Search products to add..."
                  />
                  {fbtSearching && (
                    <span className="absolute right-3 top-2.5 text-gray-400 text-xs">
                      Searching…
                    </span>
                  )}
                  {fbtSearchResults.length > 0 && (
                    <div className="absolute z-20 bg-white border border-gray-200 rounded-lg shadow-lg mt-1 w-full max-h-48 overflow-y-auto">
                      {fbtSearchResults.map((item) => {
                        const thumb =
                          Array.isArray(item.images) && item.images[0]?.url;
                        return (
                          <button
                            key={item._id}
                            type="button"
                            onClick={() => {
                              setProduct((prev) => ({
                                ...prev,
                                frequentlyBoughtTogether: [
                                  ...(prev.frequentlyBoughtTogether || []),
                                  {
                                    _id: item._id,
                                    title: item.title,
                                    price: item.price,
                                    images: item.images,
                                  },
                                ],
                              }));
                              setFbtSearch("");
                              setFbtSearchResults([]);
                            }}
                            className="w-full text-left px-3 py-2 hover:bg-orange-50 flex items-center gap-3 border-b border-gray-100 last:border-0"
                          >
                            <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 shrink-0 relative">
                              {thumb ? (
                                <Image
                                  src={thumb}
                                  alt={item.title}
                                  fill
                                  sizes="40px"
                                  className="object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-300 text-lg">
                                  🛍
                                </div>
                              )}
                            </div>
                            <span className="flex-1 truncate text-sm font-medium text-gray-800">
                              {item.title}
                            </span>
                            <span className="shrink-0 text-xs text-indigo-600 font-semibold">
                              + Add
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
              {(product.frequentlyBoughtTogether || []).length >= 6 && (
                <p className="text-sm text-orange-600">
                  Maximum 6 products selected.
                </p>
              )}
            </div>
          </div>

          {/* Reviews Tab */}
          <div className="">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Customer Reviews
            </h2>

            {/* Add Review Form */}
            <div className="bg-indigo-50 rounded-xl p-6 border-2 border-indigo-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Add New Review
              </h3>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>
                      Reviewer Name (Optional)
                    </label>
                    <input
                      type="text"
                      value={newReview.authorName}
                      onChange={(e) =>
                        setNewReview((n) => ({
                          ...n,
                          authorName: e.target.value,
                        }))
                      }
                      className={inputClass}
                      placeholder="Anonymous"
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Rating (1-5)</label>
                    <input
                      type="number"
                      min={1}
                      max={5}
                      step={0.1}
                      value={newReview.rating}
                      onChange={(e) =>
                        setNewReview((n) => ({ ...n, rating: e.target.value }))
                      }
                      className={inputClass}
                    />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Review Title</label>
                  <input
                    type="text"
                    value={newReview.title}
                    onChange={(e) =>
                      setNewReview((n) => ({ ...n, title: e.target.value }))
                    }
                    className={inputClass}
                    placeholder="Great product!"
                  />
                </div>
                <div>
                  <label className={labelClass}>Review Content</label>
                  <textarea
                    value={newReview.body}
                    onChange={(e) =>
                      setNewReview((n) => ({ ...n, body: e.target.value }))
                    }
                    className={`${inputClass} h-32`}
                    placeholder="Write your review..."
                  />
                </div>
                <button
                  type="button"
                  onClick={addReview}
                  className="w-full px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors shadow-md"
                >
                  Add Review
                </button>
              </div>
            </div>

            {/* Existing Reviews */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Existing Reviews ({(product.reviews || []).length})
              </h3>

              {(product.reviews || []).length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-xl">
                  <p className="text-gray-600">
                    No reviews yet. Add the first review above.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {(product.reviews || []).map((r, i) => (
                    <div
                      key={i}
                      className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm"
                    >
                      {editingReviewIdx === i ? (
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className={labelClass}>Author Name</label>
                              <input
                                type="text"
                                value={editReviewForm.authorName}
                                onChange={(e) =>
                                  setEditReviewForm((f) => ({
                                    ...f,
                                    authorName: e.target.value,
                                  }))
                                }
                                className={inputClass}
                                placeholder="Reviewer name"
                              />
                            </div>
                            <div>
                              <label className={labelClass}>Rating (1–5)</label>
                              <input
                                type="number"
                                min={1}
                                max={5}
                                step={0.1}
                                value={editReviewForm.rating}
                                onChange={(e) =>
                                  setEditReviewForm((f) => ({
                                    ...f,
                                    rating: e.target.value,
                                  }))
                                }
                                className={inputClass}
                                placeholder="e.g. 4.5"
                              />
                            </div>
                          </div>
                          <div>
                            <label className={labelClass}>Review Title</label>
                            <input
                              type="text"
                              value={editReviewForm.title}
                              onChange={(e) =>
                                setEditReviewForm((f) => ({
                                  ...f,
                                  title: e.target.value,
                                }))
                              }
                              className={inputClass}
                              placeholder="e.g. Great product!"
                            />
                          </div>
                          <div>
                            <label className={labelClass}>Review Content</label>
                            <textarea
                              value={editReviewForm.body}
                              onChange={(e) =>
                                setEditReviewForm((f) => ({
                                  ...f,
                                  body: e.target.value,
                                }))
                              }
                              rows={4}
                              className={`${inputClass} resize-none`}
                              placeholder="Review body…"
                            />
                          </div>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                const rating = parseFloat(
                                  editReviewForm.rating,
                                );
                                if (isNaN(rating) || rating < 1 || rating > 5)
                                  return alert(
                                    "Rating must be between 1 and 5",
                                  );
                                updateReviewAt(i, {
                                  authorName: editReviewForm.authorName,
                                  rating,
                                  title: editReviewForm.title,
                                  body: editReviewForm.body,
                                });
                                setEditingReviewIdx(null);
                              }}
                              className="px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-semibold"
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingReviewIdx(null)}
                              className="px-5 py-2 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-semibold text-gray-900">
                                  {r.authorName || "Anonymous"}
                                </span>
                                <span className="text-yellow-500">
                                  {"★".repeat(Math.round(r.rating || 0))}
                                  {"☆".repeat(5 - Math.round(r.rating || 0))}
                                </span>
                              </div>
                              <p className="text-sm text-gray-500">
                                {new Date(r.createdAt).toLocaleDateString(
                                  "en-US",
                                  {
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                  },
                                )}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingReviewIdx(i);
                                  setEditReviewForm({
                                    authorName: r.authorName || "",
                                    rating: r.rating ?? "",
                                    title: r.title || "",
                                    body: r.body || "",
                                  });
                                }}
                                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => removeReviewAt(i)}
                                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                          {r.title && (
                            <h4 className="font-semibold text-gray-900 mb-2">
                              {r.title}
                            </h4>
                          )}
                          <p className="text-gray-700">{r.body}</p>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* SEO Tab */}
          <div className="hidden">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              SEO & Search Optimization
            </h2>

            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
              <p className="text-sm text-gray-600 mb-6">
                Optimize how your product appears in search engines and social
                media shares
              </p>

              <div className="space-y-6">
                {/* Meta Title */}
                <div>
                  <label className={labelClass}>SEO Title</label>
                  <input
                    type="text"
                    value={product.seo?.title || ""}
                    onChange={(e) =>
                      setProduct((p) => ({
                        ...p,
                        seo: { ...p.seo, title: e.target.value },
                      }))
                    }
                    className={inputClass}
                    placeholder="e.g., Premium Leather Jacket - Brand Name"
                  />
                  <div className="flex justify-between items-center mt-2">
                    <p className="text-xs text-gray-500">
                      Recommended: 50-60 characters
                    </p>
                    <span
                      className={`text-sm font-medium ${
                        (product.seo?.title || "").length > 60
                          ? "text-red-600"
                          : "text-gray-600"
                      }`}
                    >
                      {(product.seo?.title || "").length}/60
                    </span>
                  </div>
                </div>

                {/* Meta Description */}
                <div>
                  <label className={labelClass}>SEO Meta Description</label>
                  <textarea
                    value={product.seo?.description || ""}
                    onChange={(e) =>
                      setProduct((p) => ({
                        ...p,
                        seo: { ...p.seo, description: e.target.value },
                      }))
                    }
                    className={`${inputClass} h-32`}
                    placeholder="Write a compelling description for search engines..."
                  />
                  <div className="flex justify-between items-center mt-2">
                    <p className="text-xs text-gray-500">
                      Recommended: 120-155 characters
                    </p>
                    <span
                      className={`text-sm font-medium ${
                        (product.seo?.description || "").length > 155
                          ? "text-red-600"
                          : "text-gray-600"
                      }`}
                    >
                      {(product.seo?.description || "").length}/155
                    </span>
                  </div>
                </div>

                {/* Keywords */}
                <div>
                  <label className={labelClass}>SEO Keywords</label>
                  <input
                    type="text"
                    value={product.seo?.keywords || ""}
                    onChange={(e) =>
                      setProduct((p) => ({
                        ...p,
                        seo: { ...p.seo, keywords: e.target.value },
                      }))
                    }
                    className={inputClass}
                    placeholder="comma separated keywords"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Enter keywords separated by commas (e.g. jacket, waterproof,
                    sale)
                  </p>
                </div>

                {/* Preview */}
                <div className="bg-white rounded-lg p-4 border border-gray-300">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">
                    Search Engine Preview
                  </h4>
                  <div className="space-y-1">
                    <div className="text-blue-700 text-lg font-medium">
                      {product.seo?.title ||
                        product.title ||
                        "Your Product Title"}
                    </div>
                    <div className="text-green-700 text-sm">
                      yoursite.com/product/
                      {product.title?.toLowerCase().replace(/\s+/g, "-") ||
                        "product-name"}
                    </div>
                    <div className="text-gray-600 text-sm">
                      {product.seo?.description ||
                        product.description?.substring(0, 155) ||
                        "Your product description will appear here..."}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="bg-white rounded-xl shadow-md p-6 mt-6">
          <div className="flex flex-col sm:flex-row gap-4 justify-start">
            <button
              type="button"
              onClick={() => router.push("/dashboard/products")}
              className="px-8 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-all"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="px-8 py-3 bg-linear-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? "Saving..." : "Save Product"}
            </button>
          </div>
        </div>
      </div>

      {/* Sticky floating save button */}
      <div className="fixed bottom-4 right-14 z-50">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-full shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? (
            <>
              <svg className="animate-spin w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Saving...
            </>
          ) : (
            <>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                <polyline points="17 21 17 13 7 13 7 21" />
                <polyline points="7 3 7 8 15 8" />
              </svg>
              Save Product
            </>
          )}
        </button>
      </div>
    </div>
  );
}
