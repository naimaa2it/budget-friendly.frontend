"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  useCart,
  makeCartKey,
  getItemPrice,
  getItemCompareAtPrice,
} from "@/components/context/CartContext";
import { getVariantColors } from "@/components/cart/VariantEditModal";
import { useUser } from "@/components/context/UserContext";
import AuthModal from "@/components/auth/AuthModal";
import Image from "next/image";
import {
  FaChevronDown,
  FaTag,
  FaCheckCircle,
  FaTimesCircle,
  FaTimes,
  FaTicketAlt,
  FaGift,
} from "react-icons/fa";
import PaymentSelector from "@/components/checkout/PaymentSelector";
import SearchableSelect from "@/components/ui/SearchableSelect";
import { toast } from "react-hot-toast";
import "animate.css";

export default function CheckoutPage() {
  const router = useRouter();
  const { cartItems, clearCart, cartHydrated } = useCart();
  const { user } = useUser();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showRewardsModal, setShowRewardsModal] = useState(false);
  // All financial values come from the server quote — never calculated client-side
  const [quote, setQuote] = useState({
    items: [],
    subtotal: 0,
    baseShipping: 0,
    shipping: 0,
    autoDiscount: 0,
    couponDiscount: 0,
    discount: 0,
    total: 0,
    freeShippingFromCoupon: false,
    appliedCouponCode: null,
    couponHeadline: null,
    appliedCoupons: [],
    couponErrors: [],
    insideDhaka: null,
    rewardPointsEarned: 0,
    availablePoints: 0,
    pointsRedeemed: 0,
    pointsDiscount: 0,
    pointsPerTk: 100,
  });
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [useRewardPoints, setUseRewardPoints] = useState(false);
  const pointsToRedeemRef = useRef(0);
  const [appliedCoupons, setAppliedCoupons] = useState([]); // array of coupon codes
  const appliedCouponsRef = useRef([]); // ref so effect always reads latest value
  const [couponMsg, setCouponMsg] = useState(null); // { type: 'success'|'error', text }
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const orderPlaced = useRef(false);
  const [previousAddresses, setPreviousAddresses] = useState([]);

  // Progress indicators state
  const [progressItems, setProgressItems] = useState([]);
  const [savingsOpen, setSavingsOpen] = useState(false);

  // Order items scroll indicator
  const itemsScrollRef = useRef(null);
  const [itemsScrollPct, setItemsScrollPct] = useState(0);
  const handleItemsScroll = () => {
    const el = itemsScrollRef.current;
    if (!el) return;
    const max = el.scrollHeight - el.clientHeight;
    setItemsScrollPct(max > 0 ? el.scrollTop / max : 0);
  };

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    city: "",
    zone: "",
    area: "",
    address: "",
    note: "",
    paymentMethod: "cash-on-delivery",
    coupon: "",
  });

  // Custom input states
  const [customCity, setCustomCity] = useState("");
  const [customZone, setCustomZone] = useState("");
  const [customArea, setCustomArea] = useState("");

  // Location data fetched from API
  const [locationData, setLocationData] = useState({});
  const [cities, setCities] = useState([]);
  const [zones, setZones] = useState([]);
  const [areas, setAreas] = useState([]);
  const hasResolvedCity = Boolean(
    (formData.city === "other" ? customCity : formData.city)?.trim(),
  );

  // ── Calculate totals (removed — all values come from server quote) ───────

  // ── Abandoned checkout tracking ─────────────────────────────────────────────
  // Record a checkout session on mount; store the sessionId so we can update
  // it with billing info as the guest fills in the form.
  const checkoutSessionId = useRef(null);
  const sessionPatchTimer = useRef(null);

  useEffect(() => {
    if (cartItems.length === 0) return;
    const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
    fetch(`${API}/api/checkout-sessions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        items: cartItems.map((item) => ({
          productId: item.product?._id || item.product?.id || "",
          title: item.product?.title || "",
          price: getItemPrice(item),
          quantity: item.quantity,
          image: item.product?.images?.[0] || null,
        })),
        total: 0,
      }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.sessionId) checkoutSessionId.current = data.sessionId;
      })
      .catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Debounced update: as guest fills name/phone/email, patch the session so
  // abandoned checkout records show real contact info even for guest users.
  // The null check is INSIDE the timeout so it still works if POST response
  // is still pending when the user starts typing.
  useEffect(() => {
    const { name, phone, email } = formData;
    if (!name && !phone && !email) return;
    clearTimeout(sessionPatchTimer.current);
    sessionPatchTimer.current = setTimeout(() => {
      if (!checkoutSessionId.current) return;
      const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      fetch(`${API}/api/checkout-sessions/${checkoutSessionId.current}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          userName: name || undefined,
          userPhone: phone || undefined,
          userEmail: email || undefined,
        }),
      }).catch(() => {});
    }, 2000);
    return () => clearTimeout(sessionPatchTimer.current);
  }, [formData.name, formData.phone, formData.email]); // eslint-disable-line react-hooks/exhaustive-deps

  // Redirect if cart is empty — but NOT before hydration or after a successful order
  useEffect(() => {
    if (!cartHydrated) return;
    if (cartItems.length === 0 && !orderPlaced.current) {
      router.push("/");
    }
  }, [cartItems.length, cartHydrated, router]);

  // ── Server quote ────────────────────────────────────────────────────────────
  // Re-fetch whenever cartItems OR city changes (keep any active coupons via ref)
  const currentCityRef = useRef("");

  const fetchQuote = useCallback(
    (couponCodes, pointsToRedeem = 0) => {
      if (!cartItems.length) return;
      const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      const city = currentCityRef.current?.trim() || null;
      return fetch(`${API}/api/orders/quote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          items: cartItems.map((item) => ({
            productId: item.product._id || item.product.id,
            quantity: item.quantity,
            color: item.selectedColor || null,
            size: item.selectedSize || null,
          })),
          couponCodes: couponCodes?.length ? couponCodes : null,
          city,
          pointsToRedeem: pointsToRedeem > 0 ? pointsToRedeem : null,
        }),
      }).then((r) => r.json());
    },
    [cartItems],
  );

  // Fetch progress indicators
  const fetchProgress = useCallback(async (subtotal) => {
    const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
    try {
      const resp = await fetch(
        `${API}/api/coupons/progress?subtotal=${subtotal}`,
        {
          credentials: "include",
        },
      );
      const data = await resp.json();
      setProgressItems(data.progressItems || []);
    } catch (err) {
      console.error("Progress fetch failed:", err);
    }
  }, []);

  useEffect(() => {
    if (!user) {
      setPreviousAddresses([]);
      return;
    }

    const fetchPreviousAddresses = async () => {
      try {
        const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
        const resp = await fetch(`${API}/api/orders/my`, {
          credentials: "include",
        });
        const data = await resp.json();
        const seen = new Set();
        const addresses = (data.orders || [])
          .map((order) => order.billingDetails || {})
          .filter((billing) => billing.address && billing.city)
          .filter((billing) => {
            const key = [
              billing.name,
              billing.phone,
              billing.email,
              billing.city,
              billing.zone,
              billing.area,
              billing.address,
            ]
              .map((value) =>
                String(value || "")
                  .trim()
                  .toLowerCase(),
              )
              .join("|");
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          })
          .slice(0, 4);
        setPreviousAddresses(addresses);
      } catch (err) {
        console.error("Failed to load previous checkout addresses:", err);
      }
    };

    fetchPreviousAddresses();
  }, [user]);

  useEffect(() => {
    if (!cartItems.length) return;
    const currentCoupons = appliedCouponsRef.current;
    setQuoteLoading(true);
    fetchQuote(currentCoupons, pointsToRedeemRef.current)
      .then((data) => {
        if (data.error && currentCoupons?.length) {
          appliedCouponsRef.current = [];
          setAppliedCoupons([]);
          setCouponMsg({ type: "error", text: data.error });
          setFormData((prev) => ({ ...prev, coupon: "" }));
          return fetchQuote(null, pointsToRedeemRef.current).then(setQuote);
        }
        setQuote(data);
        if (data.appliedCoupons?.length) {
          setAppliedCoupons(data.appliedCoupons.map((c) => c.code));
          appliedCouponsRef.current = data.appliedCoupons.map((c) => c.code);
        }
        // Fetch progress indicators
        fetchProgress(data.subtotal || 0);
      })
      .catch((err) => console.error("Quote fetch failed:", err))
      .finally(() => setQuoteLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cartItems]);

  // Re-fetch when city selection changes so shipping reflects inside/outside Dhaka
  useEffect(() => {
    const resolvedCity = formData.city === "other" ? customCity : formData.city;
    if (!resolvedCity) {
      currentCityRef.current = "";
      return;
    }
    currentCityRef.current = resolvedCity;
    if (!cartItems.length) return;
    setQuoteLoading(true);
    fetchQuote(appliedCouponsRef.current, pointsToRedeemRef.current)
      .then((data) => {
        if (!data.error) setQuote(data);
      })
      .catch((err) => console.error("Quote (city) fetch failed:", err))
      .finally(() => setQuoteLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.city, customCity]);

  const refetchQuoteWithPoints = (points) => {
    pointsToRedeemRef.current = points;
    setQuoteLoading(true);
    fetchQuote(appliedCouponsRef.current, points)
      .then((data) => {
        if (!data.error) setQuote(data);
      })
      .finally(() => setQuoteLoading(false));
  };

  const handleToggleRewardPoints = (checked) => {
    setUseRewardPoints(checked);
    const pts = checked ? quote.availablePoints || 0 : 0;
    refetchQuoteWithPoints(pts);
  };

  // fetch location data once
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const resp = await fetch("/api/locations");
        const json = await resp.json();
        setLocationData(json.locationData || {});
        const cityList = json.locationData
          ? Object.keys(json.locationData)
          : [];
        setCities(cityList);
      } catch (err) {
        console.error("Failed to load location data", err);
      }
    };
    fetchLocations();
  }, []);

  // Update zones when city changes
  useEffect(() => {
    if (formData.city && locationData[formData.city]) {
      const availableZones = Object.keys(
        locationData[formData.city].zones || {},
      );
      setZones(availableZones);
      setFormData((prev) => {
        const keepZone = availableZones.includes(prev.zone);
        return {
          ...prev,
          zone: keepZone ? prev.zone : "",
          area: keepZone ? prev.area : "",
        };
      });
      setAreas([]);
    }
  }, [formData.city, locationData]);

  // Update areas when zone changes
  useEffect(() => {
    if (formData.city && formData.zone && locationData[formData.city]) {
      const availableAreas =
        locationData[formData.city].zones[formData.zone] || [];
      setAreas(availableAreas);
      setFormData((prev) => ({
        ...prev,
        area: availableAreas.includes(prev.area) ? prev.area : "",
      }));
    }
  }, [formData.city, formData.zone, locationData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (name === "coupon") setCouponMsg(null); // clear coupon msg on input change
    // Reset custom inputs when switching back from "Other"
    if (name === "city" && value !== "other") setCustomCity("");
    if (name === "zone" && value !== "other") setCustomZone("");
    if (name === "area" && value !== "other") setCustomArea("");
  };

  const applyPreviousAddress = (billing) => {
    setCustomCity("");
    setCustomZone("");
    setCustomArea("");
    currentCityRef.current = billing.city || "";
    setFormData((prev) => ({
      ...prev,
      name: billing.name || prev.name,
      phone: billing.phone || prev.phone,
      email: billing.email || prev.email,
      city: billing.city || "",
      zone: billing.zone || "",
      area: billing.area || "",
      address: billing.address || "",
      note: billing.note || prev.note,
    }));
  };

  const handleApplyCoupon = async () => {
    const code = formData.coupon.trim().toUpperCase();
    if (!code) {
      setCouponMsg({ type: "error", text: "Please enter a coupon code." });
      return;
    }

    // Check if already applied
    if (appliedCoupons.includes(code)) {
      setCouponMsg({ type: "error", text: "This coupon is already applied." });
      return;
    }

    // Check max 2 coupons
    if (appliedCoupons.length >= 2) {
      setCouponMsg({
        type: "error",
        text: "Maximum 2 coupons can be applied.",
      });
      return;
    }

    setCouponMsg(null);
    setQuoteLoading(true);
    try {
      const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      const newCoupons = [...appliedCoupons, code];
      const resp = await fetch(`${API}/api/orders/quote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          items: cartItems.map((item) => ({
            productId: item.product._id || item.product.id,
            quantity: item.quantity,
            color: item.selectedColor || null,
            size: item.selectedSize || null,
          })),
          couponCodes: newCoupons,
          city: currentCityRef.current || null,
          pointsToRedeem:
            pointsToRedeemRef.current > 0 ? pointsToRedeemRef.current : null,
        }),
      });
      const data = await resp.json();
      if (!resp.ok) {
        setCouponMsg({ type: "error", text: data.error });
        return;
      }

      // Check if the new coupon was actually applied
      if (data.couponErrors?.some((e) => e.code === code)) {
        const error = data.couponErrors.find((e) => e.code === code);
        setCouponMsg({ type: "error", text: error.error });
        return;
      }

      const appliedCodes = data.appliedCoupons?.map((c) => c.code) || [];
      appliedCouponsRef.current = appliedCodes;
      setAppliedCoupons(appliedCodes);
      setQuote(data);
      setFormData((prev) => ({ ...prev, coupon: "" }));

      const lastApplied = data.appliedCoupons?.[data.appliedCoupons.length - 1];
      setCouponMsg({
        type: "success",
        text: `"${code}" applied!${lastApplied?.title ? ` ${lastApplied.title}` : ""}`,
      });

      // Refresh progress
      fetchProgress(data.subtotal || 0);
    } catch {
      setCouponMsg({
        type: "error",
        text: "Failed to validate coupon. Please try again.",
      });
    } finally {
      setQuoteLoading(false);
    }
  };

  const handleRemoveCoupon = async (codeToRemove) => {
    const newCoupons = appliedCoupons.filter((c) => c !== codeToRemove);
    appliedCouponsRef.current = newCoupons;
    setAppliedCoupons(newCoupons);
    setCouponMsg(null);
    setQuoteLoading(true);
    try {
      const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      const resp = await fetch(`${API}/api/orders/quote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          items: cartItems.map((item) => ({
            productId: item.product._id || item.product.id,
            quantity: item.quantity,
            color: item.selectedColor || null,
            size: item.selectedSize || null,
          })),
          couponCodes: newCoupons.length ? newCoupons : null,
          city: currentCityRef.current || null,
          pointsToRedeem:
            pointsToRedeemRef.current > 0 ? pointsToRedeemRef.current : null,
        }),
      });
      const data = await resp.json();
      if (!data.error) {
        setQuote(data);
        fetchProgress(data.subtotal || 0);
      }
    } catch (err) {
      console.error("Failed to refresh quote:", err);
    } finally {
      setQuoteLoading(false);
    }
  };

  const handleRemoveAllCoupons = async () => {
    appliedCouponsRef.current = [];
    setAppliedCoupons([]);
    setCouponMsg(null);
    setFormData((prev) => ({ ...prev, coupon: "" }));
    setQuoteLoading(true);
    try {
      const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      const resp = await fetch(`${API}/api/orders/quote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          items: cartItems.map((item) => ({
            productId: item.product._id || item.product.id,
            quantity: item.quantity,
            color: item.selectedColor || null,
            size: item.selectedSize || null,
          })),
          couponCodes: null,
          city: currentCityRef.current || null,
          pointsToRedeem:
            pointsToRedeemRef.current > 0 ? pointsToRedeemRef.current : null,
        }),
      });
      const data = await resp.json();
      if (!data.error) {
        setQuote(data);
        fetchProgress(data.subtotal || 0);
      }
    } catch (err) {
      console.error("Failed to refresh quote:", err);
    } finally {
      setQuoteLoading(false);
    }
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();

    // Get final location values (use custom input if "other" is selected)
    const finalCity = formData.city === "other" ? customCity : formData.city;
    const finalZone = formData.zone === "other" ? customZone : formData.zone;
    const finalArea = formData.area === "other" ? customArea : formData.area;

    // Validate required fields
    const requiredFields = {
      name: formData.name,
      phone: formData.phone,
      email: formData.email,
      city: finalCity,
      zone: finalZone,
      address: formData.address,
    };

    const missingFields = Object.entries(requiredFields).filter(([, v]) => !v);
    if (missingFields.length > 0) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsPlacingOrder(true);

    // Device fingerprint — persisted in localStorage so the same browser is
    // recognised across sessions without any invasive tracking.
    let deviceId = "";
    try {
      deviceId = localStorage.getItem("_yh_did") || "";
      if (!deviceId) {
        deviceId =
          "dev-" +
          Math.random().toString(36).slice(2) +
          Date.now().toString(36);
        localStorage.setItem("_yh_did", deviceId);
      }
    } catch (_) {}

    const orderData = {
      userEmail: user?.email || formData.email,
      // Only product IDs, quantities, and variant selectors — NO prices, totals, or other
      // financial figures. The server re-fetches and recalculates everything.
      items: cartItems.map((item) => ({
        productId: item.product._id || item.product.id,
        quantity: item.quantity,
        color: item.selectedColor || null,
        size: item.selectedSize || null,
      })),
      billingDetails: {
        name: formData.name,
        phone: formData.phone,
        email: formData.email,
        city: finalCity,
        zone: finalZone,
        area: finalArea,
        address: formData.address,
        note: formData.note,
      },
      paymentMethod: formData.paymentMethod,
      couponCodes: appliedCoupons.length ? appliedCoupons : null,
      pointsToRedeem:
        useRewardPoints &&
        (quote.pointsRedeemed || pointsToRedeemRef.current) > 0
          ? quote.pointsRedeemed || pointsToRedeemRef.current
          : null,
      deviceId,
    };

    try {
      const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      const response = await fetch(`${API}/api/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(orderData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to place order");
      }

      if (result.method === "cod") {
        // Cash on Delivery — set flag BEFORE clearing cart to suppress redirect
        orderPlaced.current = true;
        clearCart();
        router.push(`/checkout/success?orderId=${result.orderId}&method=cod`);
      } else if (["bkash", "nagad", "rocket"].includes(result.method)) {
        // Mobile banking — redirect to payment page with merchant info
        orderPlaced.current = true;
        clearCart();
        const params = new URLSearchParams({
          orderId: result.orderId,
          method: result.method,
          amount: result.amount,
          merchant: result.merchantNumber || "",
        });
        router.push(`/checkout/payment?${params.toString()}`);
      } else if (result.method === "online" && result.url) {
        // Navigate the current tab to SSLCommerz (same window, no popup/iframe).
        // Cart is cleared on the success page after payment completes.
        window.location.href = result.url;
        return; // stop spinner reset — we're navigating away
      } else {
        throw new Error(result.error || "Unexpected response from server");
      }
    } catch (error) {
      console.error("Order error:", error);
      toast.error(error.message || "Failed to place order. Please try again.");
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const handleViewRewards = () => {
    setShowRewardsModal(true);
  };

  if (cartItems.length === 0) {
    return null;
  }

  // After order is placed (COD) the cart is empty but we are navigating away — render nothing.
  // Exception: SSL popup is pending (online payment in progress) — keep the page alive.
  if (orderPlaced.current) return null;

  // Build a Map of server-verified unit prices keyed by productId+color+size
  const quoteItemMap = {};
  (quote.items || []).forEach((qi) => {
    quoteItemMap[makeCartKey(qi.productId?.toString(), qi.color, qi.size)] =
      qi.price;
  });
  const displayShipping = hasResolvedCity ? (quote.shipping ?? 0) : 0;
  const displayBaseShipping = hasResolvedCity ? (quote.baseShipping ?? 0) : 0;
  const displayTotal = hasResolvedCity
    ? (quote.total ?? 0)
    : Math.max(0, (quote.total ?? 0) - (quote.shipping ?? 0));

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-2">
        {/* Back & Home */}
        <div className="flex items-center gap-2 mb-4">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition"
          >
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
          </button>
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition"
          >
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </button>
        </div>
        <h1 className="text-3xl font-bold mb-8">Checkout</h1>

        {/* Guest login nudge */}
        {!user && (
          <div className="mb-6 flex items-start gap-3 p-4 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl">
            <div className="text-2xl shrink-0">🎁</div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-purple-900 text-sm">
                Login করুন — আরও সুবিধা পান!
              </p>
              <ul className="mt-1.5 space-y-0.5 text-xs text-purple-700">
                <li className="flex items-center gap-1.5">
                  <span className="text-yellow-500">★</span> Reward Points earn
                  করুন এবং পরের order এ discount পান
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="text-green-500">✓</span> আগের ব্যবহার করা
                  address auto-fill হবে
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="text-blue-500">📦</span> Order history ও
                  tracking সহজে দেখুন
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="text-pink-500">🎟</span> Exclusive coupon ও
                  special offer পাবেন
                </li>
              </ul>
              <button
                type="button"
                onClick={() => setShowAuthModal(true)}
                className="mt-2.5 inline-flex items-center gap-1.5 px-4 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-full transition"
              >
                Login / Sign up
                <svg
                  className="w-3 h-3"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* New-user eligibility banner */}
        {user &&
          user.createdAt &&
          Date.now() - new Date(user.createdAt).getTime() <
            30 * 24 * 60 * 60 * 1000 && (
            <div className="mb-6 flex items-start gap-3 p-4 bg-blue-50 border border-blue-300 rounded-lg">
              <FaTag className="text-blue-600 mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold text-blue-800">
                  🎉 Welcome! You&apos;re eligible for a new-user perk.
                </p>
                <p className="text-sm text-blue-700 mt-0.5">
                  Use coupon <strong>newUser26</strong> at checkout to get{" "}
                  <strong>Free Delivery</strong> on your first order (min. order
                  ৳800).
                </p>
              </div>
            </div>
          )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left Column - Order Items + Billing Details */}
          <div className="lg:col-span-2 lg:self-start space-y-4">
            {/* Order Items Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
                <h2 className="text-sm font-bold text-gray-900">
                  Order Items{" "}
                  <span className="text-gray-400 font-normal">
                    ({cartItems.length})
                  </span>
                </h2>
                {progressItems.length > 0 && (
                  <button
                    type="button"
                    onClick={handleViewRewards}
                    className="flex items-center gap-1.5 text-xs font-semibold text-rose-500 hover:text-rose-600 transition animate__animated animate__heartBeat animate__infinite animate__slow"
                  >
                    <FaGift className="text-rose-500" />
                    Unlock Rewards
                  </button>
                )}
              </div>
              {/* Vertical list — 2 items visible, rest scrollable */}
              <div className="relative flex">
                {/* Custom scroll track — right side */}
                {cartItems.length > 2 && (
                  <div className="absolute right-2 top-2 bottom-2 w-0.75 rounded-full bg-gray-100 z-10 overflow-hidden">
                    <div
                      className="absolute left-0 right-0 top-0 rounded-full bg-amber-400 transition-all duration-100"
                      style={{ height: `${itemsScrollPct * 100}%` }}
                    />
                    <div
                      className="absolute left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-amber-400 border-2 border-white shadow-sm transition-all duration-100"
                      style={{ top: `calc(${itemsScrollPct * 100}% - 5px)` }}
                    />
                  </div>
                )}
                <div
                  ref={itemsScrollRef}
                  onScroll={handleItemsScroll}
                  className="flex-1 overflow-y-auto no-scrollbar divide-y divide-gray-50"
                  style={{ maxHeight: "152px" }}
                >
                  {cartItems.map((item) => {
                    const { product, quantity, selectedColor, selectedSize } =
                      item;
                    const id = product._id || product.id;
                    const image =
                      product.images?.[0]?.url || "/assets/placeholder.svg";
                    const title = product.title || product.name;
                    const price =
                      quoteItemMap[
                        makeCartKey(id, selectedColor, selectedSize)
                      ] ?? 0;
                    const allColors = getVariantColors(product);
                    const colorObj = selectedColor
                      ? allColors.find(
                          (c) =>
                            c.name?.toLowerCase() ===
                            selectedColor?.toLowerCase(),
                        )
                      : null;
                    const colorHex = colorObj?.hex || null;
                    return (
                      <div
                        key={id}
                        className="flex items-start gap-3 px-5 py-3"
                      >
                        <Image
                          src={encodeURI(image)}
                          alt={title}
                          width={52}
                          height={52}
                          className="object-cover rounded-lg border border-gray-100 w-13 h-13 shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-800 line-clamp-2 leading-snug">
                            {title}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {quantity} ×{" "}
                            <span className="font-semibold text-gray-700">
                              ৳{price.toFixed(0)}
                            </span>
                          </p>
                          {(selectedColor || selectedSize) && (
                            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                              {selectedColor && (
                                <span className="inline-flex items-center gap-1 text-[11px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md font-medium">
                                  {colorHex && (
                                    <span
                                      className="w-2.5 h-2.5 rounded-full border border-gray-300 shrink-0 inline-block"
                                      style={{ backgroundColor: colorHex }}
                                    />
                                  )}
                                  {selectedColor}
                                </span>
                              )}
                              {selectedSize && (
                                <span className="text-[11px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md font-medium">
                                  {selectedSize}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        <p className="text-sm font-bold text-gray-800 shrink-0 mt-0.5">
                          ৳{(price * quantity).toFixed(0)}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Billing Details Form */}
            <form
              onSubmit={handlePlaceOrder}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
            >
              <h2 className="text-sm font-bold text-gray-900 mb-5">
                Billing Details
              </h2>

              {previousAddresses.length > 0 && (
                <div className="mb-5">
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    Use previous address
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {previousAddresses.map((billing, idx) => (
                      <button
                        key={`${billing.address}-${idx}`}
                        type="button"
                        onClick={() => applyPreviousAddress(billing)}
                        className="text-left border border-gray-200 rounded-lg p-3 hover:border-red-300 hover:bg-red-50 transition"
                      >
                        <span className="block text-sm font-semibold text-gray-900 truncate">
                          {billing.name || "Saved address"}
                        </span>
                        <span className="block text-xs text-gray-500 mt-1 line-clamp-2">
                          {[
                            billing.address,
                            billing.area,
                            billing.zone,
                            billing.city,
                          ]
                            .filter(Boolean)
                            .join(", ")}
                        </span>
                        {billing.phone && (
                          <span className="block text-xs text-gray-400 mt-1">
                            {billing.phone}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Name */}
              <div className="mb-4">
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Name*"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
                  required
                />
              </div>

              {/* Phone and Email */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="Phone*"
                  className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
                  required
                />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Email address"
                  className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
                  required
                />
              </div>

              {/* City, Zone, Area */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                {/* City Searchable Dropdown */}
                <div>
                  <SearchableSelect
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    options={cities}
                    placeholder="City*"
                    required
                  />
                  {formData.city === "other" && (
                    <input
                      type="text"
                      value={customCity}
                      onChange={(e) => setCustomCity(e.target.value)}
                      placeholder="Enter your city"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none mt-2"
                      required
                    />
                  )}
                </div>

                {/* Zone Searchable Dropdown */}
                <div>
                  <SearchableSelect
                    name="zone"
                    value={formData.zone}
                    onChange={handleInputChange}
                    options={zones}
                    placeholder="Zone*"
                    required
                    disabled={!formData.city || formData.city === "other"}
                  />
                  {(formData.zone === "other" || formData.city === "other") && (
                    <input
                      type="text"
                      value={customZone}
                      onChange={(e) => setCustomZone(e.target.value)}
                      placeholder="Enter your zone"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none mt-2"
                      required
                    />
                  )}
                </div>

                {/* Area Searchable Dropdown */}
                <div>
                  <SearchableSelect
                    name="area"
                    value={formData.area}
                    onChange={handleInputChange}
                    options={areas}
                    placeholder="Area"
                    disabled={
                      !formData.zone ||
                      formData.zone === "other" ||
                      formData.city === "other"
                    }
                  />
                  {(formData.area === "other" ||
                    formData.zone === "other" ||
                    formData.city === "other") && (
                    <input
                      type="text"
                      value={customArea}
                      onChange={(e) => setCustomArea(e.target.value)}
                      placeholder="Enter your area"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none mt-2"
                    />
                  )}
                </div>
              </div>

              {/* Address */}
              <div className="mb-4">
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="Address*"
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none resize-none"
                  required
                />
              </div>

              {/* Note */}
              <div className="mb-4">
                <textarea
                  name="note"
                  value={formData.note}
                  onChange={handleInputChange}
                  placeholder="Write a Note..."
                  rows={2}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none resize-none"
                />
              </div>
            </form>
          </div>

          {/* Right Column - Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden sticky top-4">
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <h2 className="text-sm font-bold text-gray-900">
                  Order Summary
                </h2>
                {/* {progressItems.length > 0 && (
                  <button
                    type="button"
                    onClick={handleViewRewards}
                    className="flex items-center gap-1.5 text-xs font-semibold text-rose-500 hover:text-rose-600 transition animate__animated animate__heartBeat animate__infinite animate__slow"
                  >
                    <FaGift className="text-rose-500" />
                    Unlock Rewards
                  </button>
                )} */}
              </div>

              {/* Price Breakdown */}
              <div className="px-5 py-4 space-y-2 border-b border-gray-100 relative">
                {quoteLoading && (
                  <div className="absolute inset-0 bg-white/75 flex items-center justify-center rounded z-10">
                    <svg
                      className="animate-spin w-5 h-5 text-rose-500"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v8H4z"
                      />
                    </svg>
                  </div>
                )}
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Subtotal</span>
                  <span className="font-medium text-gray-700">
                    ৳{(quote.subtotal ?? 0).toFixed(0)}
                  </span>
                </div>
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Shipping</span>
                  <span
                    className={`font-medium ${displayShipping === 0 ? "text-green-600" : "text-gray-700"}`}
                  >
                    {displayShipping === 0
                      ? "Free"
                      : `৳${displayShipping.toFixed(0)}`}
                  </span>
                </div>

                {/* Applied coupons */}
                {quote.appliedCoupons?.length > 0 && (
                  <div className="space-y-1 pt-1">
                    {quote.appliedCoupons.map((coupon, idx) => (
                      <div
                        key={idx}
                        className="flex justify-between items-center text-xs text-green-700 bg-green-50 px-2.5 py-1.5 rounded-lg"
                      >
                        <span className="flex items-center gap-1.5">
                          <FaTicketAlt className="shrink-0 opacity-70" />
                          <span className="font-semibold uppercase">
                            {coupon.code}
                          </span>
                          <span className="opacity-70">
                            {coupon.givesFreeShipping
                              ? "(Free Shipping)"
                              : `(-৳${coupon.discountValue ?? 0})`}
                          </span>
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveCoupon(coupon.code)}
                          className="text-red-400 hover:text-red-600 ml-1"
                        >
                          <FaTimes className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {(quote.couponDiscount ?? 0) > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Coupon Discount</span>
                    <span className="font-semibold">
                      -৳{(quote.couponDiscount ?? 0).toFixed(0)}
                    </span>
                  </div>
                )}
                {(quote.pointsDiscount ?? 0) > 0 && (
                  <div className="flex justify-between text-sm text-amber-600">
                    <span className="flex items-center gap-1">
                      🏆 Points ({quote.pointsRedeemed} pts)
                    </span>
                    <span className="font-semibold">
                      -৳{(quote.pointsDiscount ?? 0).toFixed(0)}
                    </span>
                  </div>
                )}

                <div className="flex justify-between items-center pt-2 border-t border-dashed border-gray-200">
                  <span className="text-sm font-bold text-gray-900">Total</span>
                  <span className="text-xl font-extrabold text-gray-900">
                    ৳{displayTotal.toFixed(0)}
                  </span>
                </div>

                {/* Savings banner */}
                {(() => {
                  // Use shared cart utilities — same logic as CartSidebar
                  const mrpSavings = cartItems.reduce((sum, item) => {
                    const { quantity, selectedColor, selectedSize, product } =
                      item;
                    const id = product._id || product.id;
                    const selling =
                      quoteItemMap[
                        makeCartKey(id, selectedColor, selectedSize)
                      ] ?? getItemPrice(item);
                    const mrp = getItemCompareAtPrice(item);
                    return (
                      sum + (mrp > selling ? (mrp - selling) * quantity : 0)
                    );
                  }, 0);

                  const totalSaved =
                    mrpSavings +
                    (quote.couponDiscount ?? 0) +
                    (quote.pointsDiscount ?? 0) +
                    (quote.freeShippingFromCoupon
                      ? (quote.baseShipping ?? 0)
                      : 0);

                  return totalSaved > 0 ? (
                    <div className="flex items-center gap-2 mt-2 bg-green-50 border border-green-100 rounded-lg px-3 py-2">
                      <span className="text-base">🎉</span>
                      <p className="text-xs text-green-700 font-medium">
                        You are saving{" "}
                        <span className="font-extrabold">
                          ৳{Math.round(totalSaved)}
                        </span>{" "}
                        on this order!
                      </p>
                    </div>
                  ) : null;
                })()}
              </div>

              {/* Savings Section — Reward Points + Coupon */}
              <div className="border-b border-gray-100">
                {/* Collapse header */}
                <button
                  type="button"
                  onClick={() => setSavingsOpen((o) => !o)}
                  className="w-full flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm">🏷️</span>
                    <span className="text-xs font-semibold text-gray-700">
                      Coupons &amp; Rewards
                    </span>
                    {/* badges when collapsed */}
                    {!savingsOpen && (
                      <span className="flex items-center gap-1">
                        {appliedCoupons.length > 0 && (
                          <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-semibold">
                            {appliedCoupons.length} coupon
                          </span>
                        )}
                        {useRewardPoints && (
                          <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-semibold">
                            Points ✓
                          </span>
                        )}
                      </span>
                    )}
                  </div>
                  <svg
                    className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${savingsOpen ? "rotate-180" : ""}`}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </button>

                {/* Collapsible content */}
                {savingsOpen && (
                  <div className="px-5 pb-4 space-y-3">
                    {/* Reward Points Row */}
                    {user ? (
                      <div
                        onClick={() => {
                          if (
                            (quote.availablePoints ?? 0) >=
                            (quote.pointsPerTk || 100)
                          ) {
                            handleToggleRewardPoints(!useRewardPoints);
                          }
                        }}
                        className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all cursor-pointer select-none ${
                          useRewardPoints
                            ? "border-amber-400 bg-gradient-to-r from-amber-50 to-yellow-50"
                            : (quote.availablePoints ?? 0) >=
                                (quote.pointsPerTk || 100)
                              ? "border-gray-200 hover:border-amber-300 hover:bg-amber-50/30"
                              : "border-gray-100 bg-gray-50/60 cursor-default"
                        }`}
                      >
                        {/* Icon */}
                        <div
                          className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-base transition-colors ${
                            useRewardPoints ? "bg-amber-100" : "bg-gray-100"
                          }`}
                        >
                          🏆
                        </div>

                        {/* Text */}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-gray-800 leading-tight">
                            Reward Points
                          </p>
                          {(quote.availablePoints ?? 0) > 0 ? (
                            <p className="text-[11px] leading-tight mt-0.5">
                              <span className="font-bold text-amber-600">
                                {quote.availablePoints} pts
                              </span>
                              <span className="text-gray-400 mx-1">=</span>
                              <span className="font-bold text-amber-600">
                                ৳
                                {Math.floor(
                                  (quote.availablePoints || 0) /
                                    (quote.pointsPerTk || 100),
                                )}{" "}
                                off
                              </span>
                              {useRewardPoints &&
                                (quote.pointsDiscount ?? 0) > 0 && (
                                  <span className="ml-1.5 text-green-600 font-bold">
                                    ✓ Applied
                                  </span>
                                )}
                            </p>
                          ) : (
                            <p className="text-[11px] text-gray-400 leading-tight mt-0.5">
                              No points yet
                            </p>
                          )}
                        </div>

                        {/* Toggle */}
                        {(quote.availablePoints ?? 0) >=
                        (quote.pointsPerTk || 100) ? (
                          <div
                            className={`relative w-10 h-5.5 h-[22px] rounded-full shrink-0 transition-colors duration-200 ${
                              useRewardPoints ? "bg-amber-400" : "bg-gray-200"
                            }`}
                          >
                            <span
                              className={`absolute top-[3px] w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200 ${
                                useRewardPoints
                                  ? "translate-x-[22px]"
                                  : "translate-x-[3px]"
                              }`}
                            />
                          </div>
                        ) : (quote.availablePoints ?? 0) > 0 ? (
                          <span className="text-[10px] text-amber-500 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-md shrink-0">
                            Low pts
                          </span>
                        ) : null}
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 p-3 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50/50">
                        <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-base shrink-0 opacity-50">
                          🏆
                        </div>
                        <div>
                          <p className="text-xs font-bold text-gray-500">
                            Reward Points
                          </p>
                          <p className="text-[11px] text-gray-400 mt-0.5">
                            Sign in to use your points
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Earn points hint */}
                    {user && (quote.rewardPointsEarned ?? 0) > 0 && (
                      <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-2.5 py-1.5 flex items-center gap-1.5">
                        <span>✨</span>
                        You&apos;ll earn{" "}
                        <strong className="mx-0.5">
                          {quote.rewardPointsEarned} pts
                        </strong>{" "}
                        on delivery
                      </p>
                    )}

                    {/* Coupon Input */}
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-xs font-semibold text-gray-700">
                          🏷️ Coupon Code
                        </span>
                        {appliedCoupons.length > 0 && (
                          <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                            {appliedCoupons.length}/2
                          </span>
                        )}
                      </div>
                      <div className="relative">
                        <input
                          type="text"
                          name="coupon"
                          value={formData.coupon}
                          onChange={handleInputChange}
                          placeholder="ENTER CODE"
                          disabled={appliedCoupons.length >= 2}
                          className="w-full px-3 pr-20 py-2 text-xs border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-rose-300 focus:border-rose-300 disabled:bg-gray-100 uppercase font-mono tracking-widest placeholder:text-gray-300 placeholder:tracking-widest"
                        />
                        <button
                          type="button"
                          onClick={handleApplyCoupon}
                          disabled={
                            appliedCoupons.length >= 2 ||
                            !formData.coupon.trim()
                          }
                          className="absolute right-1 top-1/2 -translate-y-1/2 px-3 py-1 bg-gray-900 text-white text-xs font-semibold rounded-md hover:bg-gray-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed"
                        >
                          Apply
                        </button>
                      </div>

                      {couponMsg && (
                        <p
                          className={`mt-1.5 text-xs flex items-center gap-1 ${couponMsg.type === "success" ? "text-green-600" : "text-red-500"}`}
                        >
                          {couponMsg.type === "success" ? (
                            <FaCheckCircle className="shrink-0" />
                          ) : (
                            <FaTimesCircle className="shrink-0" />
                          )}
                          {couponMsg.text}
                        </p>
                      )}

                      {appliedCoupons.length > 0 ? (
                        <button
                          type="button"
                          onClick={handleRemoveAllCoupons}
                          className="mt-1.5 text-xs text-red-400 hover:text-red-600 transition"
                        >
                          Remove all coupons
                        </button>
                      ) : (
                        <Link
                          href="/user/coupons"
                          className="mt-1 text-[11px] text-blue-500 hover:underline inline-block"
                        >
                          Browse available coupons →
                        </Link>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Payment Methods */}
              <div className="px-5 py-4">
                <PaymentSelector
                  value={formData.paymentMethod}
                  onChange={(method) =>
                    setFormData((prev) => ({ ...prev, paymentMethod: method }))
                  }
                  isLoading={isPlacingOrder}
                  onSubmit={handlePlaceOrder}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Auth Modal */}
      {showAuthModal && (
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
        />
      )}

      {/* Rewards Modal */}
      {showRewardsModal && (
        <div className="fixed inset-0 bg-black/30 bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[80vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <FaGift className="text-red-500" />
                Available Rewards
              </h3>
              <button
                onClick={() => setShowRewardsModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <FaTimes className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4">
              {progressItems.length > 0 ? (
                <div className="space-y-4">
                  {progressItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="border rounded-lg p-4 bg-gradient-to-r from-orange-40 to-rose-100"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <p className="font-semibold text-orange-800">
                            {item.message}
                          </p>
                          {item.couponCode && (
                            <div className="mt-2">
                              <span className="text-xs font-mono bg-orange-100 px-2 py-1 rounded text-orange-800">
                                {item.couponCode}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="mt-3">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-600">Progress</span>
                          <span className="font-medium">
                            ৳{quote.subtotal} / ৳{item.minOrderAmount}
                          </span>
                        </div>
                        <div className="w-full bg-orange-100 rounded-full h-2">
                          <div
                            className="bg-green-500 h-2 rounded-full transition-all duration-300"
                            style={{
                              width: `${Math.min(100, (quote.subtotal / item.minOrderAmount) * 100)}%`,
                            }}
                          />
                        </div>
                        {quote.subtotal >= item.minOrderAmount && (
                          <div className="mt-2 text-green-600 text-sm flex items-center gap-1">
                            <FaCheckCircle className="w-3 h-3" />
                            <span>Eligible! Use the coupon code above.</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">
                  No rewards available at the moment.
                </p>
              )}
            </div>
            <div className="sticky bottom-0 bg-white border-t p-2">
              <button
                onClick={() => {
                  setShowRewardsModal(false);
                  router.push("/user/coupons");
                }}
                className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white py-2 rounded-sm hover:bg-red-800 transition font-semibold"
              >
                Explore All Coupons →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
