"use client";

import React, { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import Script from "next/script";
import Navbar from "@/components/layout/Navbar";
import MegaMenuNavbar from "@/components/layout/MegaMenuNavbar";
import Footer from "@/components/layout/Footer";
import { StoreSettingsProvider } from "@/components/context/StoreSettingsContext";
import { cdnImageUrl } from "@/lib/cdnImage";

const API = process.env.NEXT_PUBLIC_API_URL || "https://api.pickob.com";

// ── Tracking Scripts Component ──────────────────────────────────────────────
function TrackingScripts() {
  const [config, setConfig] = useState(null);

  useEffect(() => {
    fetch(`${API}/api/admin/tracking-config`)
      .then((r) => r.json())
      .then(setConfig)
      .catch(() => {});
  }, []);

  if (!config) return null;

  return (
    <>
      {/* Google Tag Manager */}
      {config.googleTagManager?.containerId && (
        <>
          <Script
            id="gtm-script"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${config.googleTagManager.containerId}');`,
            }}
          />
        </>
      )}

      {/* Google Analytics 4 */}
      {config.googleAnalytics4?.measurementId && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${config.googleAnalytics4.measurementId}`}
            strategy="afterInteractive"
          />
          <Script
            id="ga4-init"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${config.googleAnalytics4.measurementId}');`,
            }}
          />
        </>
      )}

      {/* Facebook Pixel */}
      {config.facebookPixel?.pixelId &&
        config.facebookPixel?.browserSideTracking && (
          <Script
            id="facebook-pixel"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('set','autoConfig',false,'${config.facebookPixel.pixelId}');fbq('init','${config.facebookPixel.pixelId}');fbq('track','PageView');`,
            }}
          />
        )}

      {/* TikTok Pixel */}
      {config.tiktokPixel?.pixelId && (
        <Script
          id="tiktok-pixel"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `!function(w,d,t){w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=i,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var o=document.createElement("script");o.type="text/javascript",o.async=!0,o.src=i+"?sdkid="+e+"&lib="+t;var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};ttq.load('${config.tiktokPixel.pixelId}');ttq.page();}(window,document,'ttq');`,
          }}
        />
      )}

      {/* Google AdSense — loads whenever active, enabling both Auto Ads and in-page AdSlot components */}
      {config.googleAdsense?.publisherId && (
        <Script
          id="google-adsense"
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${config.googleAdsense.publisherId}`}
          strategy="afterInteractive"
          crossOrigin="anonymous"
        />
      )}
    </>
  );
}

// Next.js App Router client-side navigations don't reload TrackingScripts,
// so the base pixel snippet's single fbq('track','PageView') only ever fires
// once per hard page load. This fires the PageView on every SPA route change
// too (skipping the very first mount, which the base snippet already covers).
function PixelRouteTracker() {
  const pathname = usePathname();
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (typeof window !== "undefined" && typeof window.fbq === "function") {
      window.fbq("track", "PageView");
    }
  }, [pathname]);

  return null;
}
// ────────────────────────────────────────────────────────────────────────────

// dangerouslySetInnerHTML does NOT execute <script> tags.
// This helper recreates each script node so the browser runs it (needed for AdSense).
function activateScripts(container) {
  const scripts = container.querySelectorAll("script");
  scripts.forEach((old) => {
    const fresh = document.createElement("script");
    Array.from(old.attributes).forEach((a) =>
      fresh.setAttribute(a.name, a.value),
    );
    fresh.textContent = old.textContent;
    old.parentNode.replaceChild(fresh, old);
  });
}

function AdBanner({ html }) {
  const ref = useRef(null);

  useEffect(() => {
    if (ref.current) activateScripts(ref.current);
  }, [html]);

  return (
    <div className="w-full bg-white border-b border-gray-100">
      {/* max-w-6xl on desktop, full-width on mobile */}
      <div className="w-full max-w-6xl mx-auto">
        <div
          ref={ref}
          className="w-full min-h-12.5 flex items-center justify-center"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
    </div>
  );
}

function TopBanner() {
  const [html, setHtml] = useState(null); // null = loading
  const [cfg, setCfg] = useState({});

  useEffect(() => {
    fetch(`${API}/api/admin/top-banner`)
      .then((r) => r.json())
      .then((d) => {
        if (d.enabled) {
          setHtml(d.html || "");
          setCfg(d.config || {});
        } else {
          setHtml("");
        }
      })
      .catch(() => setHtml(""));
  }, []);

  if (html === null) return null;
  if (html) return <AdBanner html={html} />;

  if (cfg && (cfg.imageUrl || cfg.text)) {
    const style = {
      backgroundColor: cfg.bgColor || "transparent",
      height: cfg.height || "50px",
    };
    const content = cfg.imageUrl ? (
      <img
        src={cdnImageUrl(cfg.imageUrl)}
        alt="banner"
        style={{ maxHeight: "100%", maxWidth: "100%" }}
      />
    ) : (
      <span className="text-sm font-medium">{cfg.text}</span>
    );
    const inner = (
      <div
        className="w-full h-full flex items-center justify-center"
        style={style}
      >
        {content}
      </div>
    );
    return cfg.linkUrl ? (
      <a
        href={cfg.linkUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="block w-full border-b border-gray-100"
      >
        {inner}
      </a>
    ) : (
      <div className="w-full border-b border-gray-100">{inner}</div>
    );
  }

  return null;
}

export default function LayoutWrapper({ children }) {
  const pathname = usePathname() || "";
  const hideNav =
    pathname.startsWith("/dashboard") ||
    (pathname.startsWith("/user/orders/") && pathname.endsWith("/invoice"));

  return (
    <StoreSettingsProvider>
      <div className="flex min-h-screen flex-col">
        {/* Tracking pixels — only on storefront, not dashboard */}
        {!hideNav && <TrackingScripts />}
        {!hideNav && <PixelRouteTracker />}

        {/* TopBanner sits BEFORE the sticky wrapper → scrolls away on page scroll */}
        {!hideNav && <TopBanner />}

        {!hideNav && (
          <div className="sticky top-0 z-50 bg-white shadow-sm">
            <Navbar />
            {/* <MegaMenuNavbar /> */}
          </div>
        )}

        <main className="flex-1">{children}</main>

        {!hideNav && <Footer />}
      </div>
    </StoreSettingsProvider>
  );
}
