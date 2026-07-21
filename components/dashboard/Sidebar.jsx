"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useUser } from "@/components/context/UserContext";
import { useStoreSettings } from "@/components/context/StoreSettingsContext";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.pickob.com";
const STORAGE_KEY = "Pickob-dashboard-sidebar-collapsed";

import { hasPermission } from "@/lib/permissions";

const SECTION_ICONS = {
  overview: "M3 12h18M3 6h18M3 18h18",
  catalog: "M4 7h16v13H4z M7 3h10v4H7z",
  commerce: "M4 6h16M4 12h16M4 18h16",
  content: "M4 5h16v14H4z M8 9l2 2 3-3 5 5",
  system: "M12 8a4 4 0 100 8 4 4 0 000-8z",
  shipment: "M12 2l3 7h7l-5.5 4.5 2 7L12 16l-5.5 4 2-7L3 9h7z",
};

const SECTIONS = [
  {
    key: "overview",
    label: "Overview",
    icon: SECTION_ICONS.overview,
    matchPrefixes: ["/dashboard"],
    items: [
      {
        key: "overview-link",
        label: "Dashboard",
        href: "/dashboard",
        icon: SECTION_ICONS.overview,
        permissionKey: "dashboard.view",
      },
    ],
  },
  {
    key: "catalog",
    label: "Catalog",
    icon: SECTION_ICONS.catalog,
    permissionKey: "catalog",
    matchPrefixes: [
      "/dashboard/products",
      "/dashboard/product-variants",
      "/dashboard/categories",
      "/dashboard/discounts",
      "/dashboard/tags",
      "/dashboard/barcodes",
      "/dashboard/reviews",
      "/dashboard/rewards",
      "/dashboard/waitlist",
      "/dashboard/inventory",
      "/dashboard/preorders",
      "/dashboard/delivery-packaging",
      "/dashboard/shipping-charges",
    ],
    items: [
      {
        key: "products",
        label: "Products",
        href: "/dashboard/products",
        icon: "M3 7h18v13a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7z",
        permissionKey: "products.view",
      },
      {
        key: "inventory",
        label: "Product Inventory",
        href: "/dashboard/inventory",
        icon: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4",
        permissionKey: "products.inventory",
      },
      {
        key: "product-variants",
        label: "Product Variants",
        href: "/dashboard/product-variants",
        icon: "M4 7h16M4 12h16M4 17h16",
        permissionKey: "products.variants",
      },
      {
        key: "categories",
        label: "Categories",
        href: "/dashboard/categories",
        icon: "M3 6h18M3 12h18M3 18h18",
        permissionKey: "products.categories",
      },
      {
        key: "discounts",
        label: "Discounts/Coupon",
        href: "/dashboard/discounts",
        icon: "M12 2l4 4-8 8-4-4 8-8z",
        permissionKey: "products.discounts",
      },
      {
        key: "tags",
        label: "Tags & Badges",
        href: "/dashboard/tags",
        icon: "M3 8l7-5 11 8-7 10-11-8z M10 7h.01",
        permissionKey: "products.tags",
      },
      {
        key: "delivery-packaging",
        label: "Delivery & Packaging",
        href: "/dashboard/delivery-packaging",
        icon: "M3 7h18v13a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7z M3 7l9-4 9 4",
        permissionKey: "products.charges",
      },
      {
        key: "shipping-charges",
        label: "Shipping Charges",
        href: "/dashboard/shipping-charges",
        icon: "M12 2l3 7h7l-5.5 4.5 2 7L12 16l-5.5 4 2-7L3 9h7z",
        permissionKey: "products.charges",
      },
      {
        key: "barcodes",
        label: "Barcodes",
        href: "/dashboard/barcodes",
        icon: "M3 5h2v14H3z M7 5h1v14H7z M10 5h3v14h-3z M15 5h1v14h-1z M18 5h3v14h-3z",
        permissionKey: "products.barcodes",
      },
      {
        key: "barcode-lookup",
        label: "Barcode Lookup",
        href: "/dashboard/barcodes/lookup",
        icon: "M4 7h16v2H4z M4 11h10v2H4z M4 15h16v2H4z",
        permissionKey: "products.barcodes",
      },
      {
        key: "all-reviews",
        label: "All Reviews",
        href: "/dashboard/reviews",
        icon: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
        permissionKey: "products.reviews",
      },
      {
        key: "all-rewards",
        label: "All Rewards",
        href: "/dashboard/rewards",
        icon: "M12 2l4 4-8 8-4-4 8-8z",
        permissionKey: "products.rewards",
      },
      {
        key: "all-waitlist",
        label: "All Waitlist",
        href: "/dashboard/waitlist",
        icon: "M4 6h16v2H4z M4 12h10v2H4z M4 18h16v2H4z",
        permissionKey: "products.waitlist",
      },
      {
        key: "all-questions",
        label: "All Q/A",
        href: "/dashboard/questions/",
        icon: "M4 6h16v2H4z M4 12h10v2H4z M4 18h16v2H4z",
        permissionKey: "products.questions",
      },
      {
        key: "all-preorders",
        label: "All Pre-orders",
        href: "/dashboard/preorders",
        icon: "M12 8v4l3 3 M12 2a10 10 0 100 20 10 10 0 000-20z",
        permissionKey: "products.preorders",
      },
    ],
  },
  {
    key: "orders",
    label: "Orders",
    icon: SECTION_ICONS.commerce,
    permissionKey: "orders",
    matchPrefixes: ["/dashboard/orders", "/dashboard/orders/order-pick"],
    items: [
      {
        key: "all-orders",
        label: "All Orders",
        href: "/dashboard/orders",
        icon: "M3 3h18v4H3V3z M3 11h18v10H3V11z",
        orderTab: "all-orders",
        permissionKey: "orders.view",
      },
      {
        key: "order-incomplete",
        label: "Incomplete",
        href: "/dashboard/orders?tab=incomplete",
        icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
        orderTab: "incomplete",
        permissionKey: "orders.view",
      },
      {
        key: "order-cancelled",
        label: "Cancelled",
        href: "/dashboard/orders?tab=cancelled",
        icon: "M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z",
        orderTab: "cancelled",
        permissionKey: "orders.view",
      },
      {
        key: "order-returns",
        label: "Returns & Refunds",
        href: "/dashboard/orders?tab=returns",
        icon: "M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6",
        orderTab: "returns",
        permissionKey: "orders.returns",
      },
      {
        key: "order-abandoned-cart",
        label: "Abandoned Cart",
        href: "/dashboard/orders?tab=abandoned-cart",
        icon: "M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z",
        orderTab: "abandoned-cart",
        permissionKey: "orders.abandoned",
      },
      {
        key: "order-abandon-checkout",
        label: "Abandon Checkout",
        href: "/dashboard/orders?tab=abandon-checkout",
        icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2",
        orderTab: "abandon-checkout",
        permissionKey: "orders.abandoned",
      },
      {
        key: "order-wishlist",
        label: "All Wishlist",
        href: "/dashboard/orders?tab=all-wishlist",
        icon: "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z",
        orderTab: "all-wishlist",
        permissionKey: "orders.wishlist",
      },
      {
        key: "order-timeline",
        label: "Order Timeline",
        href: "/dashboard/orders?tab=timeline",
        icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2M9 12h6M9 16h4",
        orderTab: "timeline",
        permissionKey: "orders.timeline",
      },
      {
        key: "order-customer-notes",
        label: "Customer Notes",
        href: "/dashboard/orders?tab=customer-notes",
        icon: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z",
        orderTab: "customer-notes",
        permissionKey: "orders.notes",
      },
      {
        key: "order-pick",
        label: "Order Pick",
        href: "/dashboard/orders/order-pick",
        icon: "M9 5H7v14h2V5zm4 0h-2v14h2V5zm4 0h-2v14h2V5z",
        permissionKey: "orders.pick",
      },
    ],
  },

  {
    key: "shipment-tracking",
    label: "Courier & Tracking",
    icon: SECTION_ICONS.shipment,
    matchPrefixes: [
      "/dashboard/shipment-tracking",
      "/dashboard/payment-settings",
    ],
    items: [
      {
        key: "shipment-tracking",
        label: "Order Tracking",
        href: "/dashboard/shipment-tracking",
        adminOnly: true,
      },
      {
        key: "shipment-settings",
        label: "Courier Settings",
        href: "/dashboard/shipment-tracking/settings",
        adminOnly: true,
      },
      {
        key: "payment-settings",
        label: "Payment Settings",
        href: "/dashboard/payment-settings",
        icon: "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z",
        adminOnly: true,
      },
    ],
  },
  {
    key: "customers",
    label: "Customers",
    icon: SECTION_ICONS.commerce,
    permissionKey: "customers",
    matchPrefixes: ["/dashboard/customers", "/dashboard/customer-tags"],
    items: [
      {
        key: "all-customers",
        label: "All Customers",
        href: "/dashboard/customers",
        icon: "M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4z M4 20c0-2.21 3.58-4 8-4s8 1.79 8 4",
        permissionKey: "customers.view",
      },
      {
        key: "customer-tag",
        label: "Customer Tag",
        href: "/dashboard/customer-tags",
        icon: "M3 8l7-5 11 8-7 10-11-8z M10 7h.01",
        permissionKey: "customers.tags",
      },
    ],
  },
  {
    key: "content",
    label: "Marketing & Content",
    icon: SECTION_ICONS.content,
    permissionKey: "content",
    matchPrefixes: [
      "/dashboard/occasions",
      "/dashboard/promo-strip",
      "/dashboard/featured",
      "/dashboard/banners",
      "/dashboard/promo-panels",
      "/dashboard/popup",
      "/dashboard/blog",
      "/dashboard/media",
      "/dashboard/brands",
    ],
    items: [
      {
        key: "banners",
        label: "Main Banners",
        href: "/dashboard/banners",
        icon: "M4 5h16v10H4z M8 18h8",
        permissionKey: "content.banners",
      },
      {
        key: "popup",
        label: "Popup Banner",
        href: "/dashboard/popup",
        icon: "M5 3h14a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z M9 9h6M9 13h4",
        permissionKey: "content.banners",
      },
      {
        key: "promo-strip",
        label: "Promo Strip",
        href: "/dashboard/promo-strip",
        icon: "M4 7h16M4 12h16M4 17h16",
        permissionKey: "content.promo",
      },
      {
        key: "occasions",
        label: "Occasions",
        href: "/dashboard/occasions",
        icon: "M12 2l2 7h7l-5.5 4 2 7L12 16l-5.5 4 2-7L3 9h7z",
        permissionKey: "content.promo",
      },
      {
        key: "promo-panels",
        label: "Promo Panels Banner",
        href: "/dashboard/promo-panels",
        icon: "M3 3h8v8H3z M13 3h8v4h-8V3z M13 10h8v4h-8v-4z M3 14h8v7H3v-7z",
        permissionKey: "content.promo",
      },
      {
        key: "brands",
        label: "Brand Logos",
        href: "/dashboard/brands",
        icon: "M12 2l2.4 4.9 5.4.8-3.9 3.8.9 5.4-4.8-2.5-4.8 2.5.9-5.4L4.2 7.7l5.4-.8z",
        permissionKey: "content.promo",
      },
      {
        key: "featured",
        label: "Featured Sections",
        href: "/dashboard/featured",
        icon: "M3 3h7v7H3V3z M13 3h8v4h-8V3z M13 10h8v4h-8v-4z M13 17h8v4h-8v-4z M3 13h7v8H3v-8z",
        permissionKey: "content.featured",
      },
      {
        key: "blog",
        label: "Blog / Content",
        href: "/dashboard/blog",
        icon: "M4 7h16M4 11h16M8 15h8",
        permissionKey: "content.blog",
      },
      {
        key: "media",
        label: "All Media",
        href: "/dashboard/media",
        icon: "M4 5h16v14H4z M8 9l2 2 3-3 5 5",
        permissionKey: "content.media",
      },
    ],
  },
  {
    key: "addons",
    label: "Addons",
    icon: "M12 2a10 10 0 100 20A10 10 0 0012 2zm0 4v4m0 4h.01M8 10h8",
    permissionKey: "addons",
    matchPrefixes: ["/dashboard/addons"],
    items: [
      {
        key: "addons-list",
        label: "All Addons",
        href: "/dashboard/addons",
        icon: "M4 4h6v6H4z M14 4h6v6h-6z M4 14h6v6H4z M14 14h6v6h-6z",
        permissionKey: "addons.manage",
      },
      {
        key: "facebook-pixel",
        label: "Facebook Pixel",
        href: "/dashboard/addons/facebook-pixel",
        icon: "M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z",
        permissionKey: "addons.pixels",
      },
      {
        key: "google-tag-manager",
        label: "Google Tag Manager",
        href: "/dashboard/addons/google-tag-manager",
        icon: "M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5",
        permissionKey: "addons.analytics",
      },
      {
        key: "google-analytics",
        label: "Google Analytics 4",
        href: "/dashboard/addons/google-analytics",
        icon: "M4 20V10l8-8 8 8v10H4z M9 20v-8h6v8",
        permissionKey: "addons.analytics",
      },
      {
        key: "fake-order-protection",
        label: "Fake Order Protection",
        href: "/dashboard/addons/fake-order-protection",
        icon: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
        permissionKey: "addons.protection",
      },
      {
        key: "tiktok-pixel",
        label: "TikTok Pixel",
        href: "/dashboard/addons/tiktok-pixel",
        icon: "M9 12a4 4 0 100 8 4 4 0 000-8zm0 0V2h4a4 4 0 004 4",
        permissionKey: "addons.pixels",
      },
      {
        key: "google-adsense",
        label: "Google AdSense",
        href: "/dashboard/addons/google-adsense",
        icon: "M12 2a10 10 0 100 20A10 10 0 0012 2zm0 4v12M4 12h16",
        permissionKey: "addons.adsense",
      },
    ],
  },
  {
    key: "profit-margin",
    label: "At a glance",
    icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
    matchPrefixes: [
      "/dashboard/profit-margin",
      "/dashboard/most-searched",
      "/dashboard/most-popular",
    ],
    items: [
      {
        key: "profit-margin-link",
        label: "Profit Margin",
        href: "/dashboard/profit-margin",
        icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
        permissionKey: "reports.profit",
      },
      {
        key: "most-searched",
        label: "Most Searched",
        href: "/dashboard/most-searched",
        icon: "M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z",
        permissionKey: "reports.analytics",
      },
      {
        key: "most-popular",
        label: "Most Popular",
        href: "/dashboard/most-popular",
        icon: "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6",
        permissionKey: "reports.analytics",
      },
    ],
  },
  {
    key: "system",
    label: "System",
    icon: SECTION_ICONS.system,
    matchPrefixes: [
      "/dashboard/authorized",
      "/dashboard/settings",
      "/dashboard/policy-pages",
      "/dashboard/code-snippet",
    ],
    items: [
      {
        key: "authorized",
        label: "Authorized Persons",
        href: "/dashboard/authorized",
        icon: "M12 8a4 4 0 100 8 4 4 0 000-8z",
        adminOnly: true,
      },
      {
        key: "settings",
        label: "Website Settings",
        href: "/dashboard/settings",
        icon: "M12 8a4 4 0 100 8 4 4 0 000-8z",
        permissionKey: "system.settings",
      },
      {
        key: "policy-pages",
        label: "Policy Pages",
        href: "/dashboard/policy-pages",
        icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
        permissionKey: "system.policies",
      },
      {
        key: "code-snippet",
        label: "Code Snippet",
        href: "/dashboard/code-snippet",
        icon: "M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4",
        adminOnly: true,
      },
    ],
  },
];

export default function Sidebar({
  mobileOpen,
  onClose,
  collapsed,
  setCollapsed,
}) {
  const pathname = usePathname() || "/dashboard";
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, refreshUser } = useUser();
  const { storeName, logoUrl } = useStoreSettings();

  const [openSections, setOpenSections] = useState({
    overview: false,
    catalog: false,
    orders: false,
    "profit-margin": false,
    customers: false,
    content: false,
    addons: false,
    system: false,
  });
  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, collapsed ? "1" : "0");
    } catch {
      // ignore storage errors
    }
  }, [collapsed]);

  const handleSignOut = async () => {
    try {
      await fetch(`${API_URL}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch (err) {
      // ignore
    }
    await refreshUser();
    router.push("/");
  };

  const isActivePath = (href) =>
    href === "/dashboard"
      ? pathname === "/dashboard"
      : pathname === href || pathname.startsWith(`${href}/`);

  const toggleSection = (sectionKey) => {
    if (collapsed) {
      setCollapsed(false);
    }
    setOpenSections((current) => ({
      ...current,
      [sectionKey]: !current[sectionKey],
    }));
  };

  const renderLeafLink = (item) => {
    if (item.adminOnly && user?.role !== "admin") return null;
    if (item.permissionKey && !hasPermission(user, item.permissionKey)) return null;

    let active;
    if (item.orderTab !== undefined) {
      const currentTab = searchParams?.get("tab") || "all-orders";
      active = pathname === "/dashboard/orders" && currentTab === item.orderTab;
    } else {
      active = isActivePath(item.href);
    }

    return (
      <Link
        key={item.key}
        href={item.href}
        title={collapsed ? item.label : undefined}
        className={`group flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition ${
          active
            ? "bg-pink-50 text-pink-700 shadow-sm ring-1 ring-pink-100"
            : "text-gray-700 hover:bg-gray-50 hover:text-pink-700"
        } ${collapsed ? "justify-center px-2" : ""}`}
      >
        <svg
          className={`h-4 w-4 shrink-0 ${active ? "text-pink-600" : "text-gray-400 group-hover:text-pink-600"}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d={item.icon} />
        </svg>
        {!collapsed && <span className="truncate">{item.label}</span>}
      </Link>
    );
  };

  const renderSection = (section) => {
    if (section.permissionKey && !hasPermission(user, section.permissionKey)) {
      return null;
    }

    const visibleItems = section.items.filter(
      (item) =>
        (!item.adminOnly || user?.role === "admin") &&
        (!item.permissionKey || hasPermission(user, item.permissionKey)),
    );

    if (!visibleItems.length) return null;

    const sectionActive = section.matchPrefixes.some((prefix) =>
      prefix === "/dashboard"
        ? pathname === "/dashboard"
        : pathname === prefix || pathname.startsWith(`${prefix}/`),
    );

    const sectionOpen = openSections[section.key];

    return (
      <div
        key={section.key}
        className={`rounded-2xl border border-gray-100 bg-white/80 p-2 shadow-sm ${collapsed ? "md:px-1" : ""}`}
      >
        <button
          type="button"
          onClick={() => toggleSection(section.key)}
          title={collapsed ? section.label : undefined}
          aria-expanded={sectionOpen}
          className={`flex w-full items-center justify-between gap-3 rounded-xl px-3 py-1.5 text-left text-sm font-medium transition ${
            sectionActive
              ? "bg-pink-50 text-pink-700"
              : "text-gray-700 hover:bg-gray-50"
          } ${collapsed ? "justify-center px-2" : ""}`}
        >
          <span className="flex min-w-0 items-center gap-3">
            <svg
              className={`h-4 w-4 shrink-0 ${sectionActive ? "text-pink-600" : "text-gray-400"}`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d={section.icon} />
            </svg>
            {!collapsed && <span className="truncate">{section.label}</span>}
          </span>
          {!collapsed && (
            <svg
              className={`h-4 w-4 shrink-0 transition-transform ${sectionOpen ? "rotate-90" : ""}`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M9 5l7 7-7 7" />
            </svg>
          )}
        </button>

        {!collapsed && sectionOpen && (
          <div className="mt-2 space-y-1 border-l border-dashed border-pink-100 pl-3">
            {visibleItems.map((item) => renderLeafLink(item))}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity md:hidden ${mobileOpen ? "block" : "hidden"}`}
        onClick={onClose}
      />
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex h-full w-65 sm:w-72 transform flex-col border-r border-pink-100 bg-white/95 shadow-xl backdrop-blur transition-all duration-300 md:sticky md:top-0 md:h-screen md:shadow-none md:translate-x-0 md:w-full ${collapsed ? "md:max-w-19" : "md:max-w-76"} ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between gap-3 border-b border-pink-100 p-4">
          <Link
            href="/"
            className={`flex items-center gap-3 ${collapsed ? "mx-auto" : ""}`}
          >
            {logoUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={logoUrl}
                alt={storeName || "Store"}
                className="h-10 w-10 rounded-xl object-contain bg-white border border-gray-100 p-0.5 shrink-0"
              />
            ) : (
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-pink-500 to-rose-500 text-sm font-bold text-white shadow-sm">
                {storeName
                  ? storeName.replace(/\s+/g, "").slice(0, 2).toUpperCase()
                  : "SB"}
              </span>
            )}
            {!collapsed && (
              <span className="leading-tight">
                <span className="block text-base font-semibold text-gray-900">
                  {storeName || "Dashboard"}
                </span>
                <span className="block text-xs text-gray-500">Dashboard</span>
              </span>
            )}
          </Link>

          <div className="flex items-center gap-1">
            <button
              type="button"
              className="hidden rounded-xl p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 md:inline-flex"
              onClick={() => setCollapsed((value) => !value)}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                {collapsed ? (
                  <path d="M7.707 14.707a1 1 0 01-1.414-1.414L8.586 11H3a1 1 0 110-2h5.586L6.293 6.707a1 1 0 011.414-1.414l4.5 4.5a1 1 0 010 1.414l-4.5 4.5z" />
                ) : (
                  <path d="M12.293 14.707a1 1 0 001.414-1.414L11.414 11H17a1 1 0 100-2h-5.586l2.293-2.293a1 1 0 00-1.414-1.414l-4.5 4.5a1 1 0 000 1.414l4.5 4.5z" />
                )}
              </svg>
            </button>
            <button
              className="rounded-xl p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 md:hidden"
              onClick={onClose}
              aria-label="Close menu"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        </div>

        <nav
          className={`flex-1 space-y-3 overflow-y-auto p-3 ${collapsed ? "md:px-2" : ""}`}
        >
          {SECTIONS.map(renderSection)}
        </nav>

        <div className="mt-auto border-t border-pink-100 p-4">
          <button
            onClick={handleSignOut}
            title={collapsed ? "Sign out" : undefined}
            className={`flex w-full items-center gap-3 rounded-xl border border-red-200 px-3 py-2 text-sm text-red-600 transition hover:bg-red-50 ${collapsed ? "justify-center px-2" : ""}`}
          >
            <svg
              className="h-4 w-4 shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M16 17l5-5-5-5" />
              <path d="M21 12H9" />
              <path d="M13 5v-2a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v18a2 2 0 0 0 2 2h5a2 2 0 0 0 2-2v-2" />
            </svg>
            {!collapsed && <span>Sign out</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
