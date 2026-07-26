"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { gtmPageView } from "@/lib/gtmEvents";

const API = process.env.NEXT_PUBLIC_API_URL || "https://api.pickob.com";
const CACHE_KEY = "custom_code_cfg";
const CACHE_TTL = 5 * 60 * 1000;

let injected = false;

function injectHTML(html, parent, position) {
  if (!html?.trim()) return;
  const tmp = document.createElement("template");
  tmp.innerHTML = html;
  Array.from(tmp.content.childNodes).forEach((node) => {
    let el;
    if (node.nodeName === "SCRIPT") {
      el = document.createElement("script");
      Array.from(node.attributes).forEach((a) =>
        el.setAttribute(a.name, a.value),
      );
      el.textContent = node.textContent;
    } else {
      el = node.cloneNode(true);
    }
    if (position === "start") {
      parent.insertBefore(el, parent.firstChild);
    } else {
      parent.appendChild(el);
    }
  });
}

function readCache() {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { ts, data } = JSON.parse(raw);
    if (Date.now() - ts > CACHE_TTL) {
      sessionStorage.removeItem(CACHE_KEY);
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

function writeCache(data) {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data }));
  } catch {
    // storage unavailable
  }
}

export default function TrackingCodeInjector() {
  const pathname = usePathname();

  useEffect(() => {
    if (injected) return;
    injected = true;

    const cached = readCache();
    if (cached) {
      injectHTML(cached.headerCode, document.head, "end");
      injectHTML(cached.bodyCode, document.body, "start");
      injectHTML(cached.footerCode, document.body, "end");
      console.log("[TrackingCodeInjector] custom code injected (from cache)");
      return;
    }

    fetch(`${API}/api/admin/custom-code`)
      .then((r) => r.json())
      .then((data) => {
        writeCache(data);
        injectHTML(data.headerCode, document.head, "end");
        injectHTML(data.bodyCode, document.body, "start");
        injectHTML(data.footerCode, document.body, "end");
        console.log("[TrackingCodeInjector] custom code injected");
      })
      .catch(() => {});
  }, []);

  // The pasted GTM/pixel snippet above only ever executes once, on the very
  // first page load — Next.js client-side navigation never remounts this
  // component, so a GTM container's default "All Pages" trigger (bound to
  // its one-time gtm.js bootstrap event) never fires again for later
  // navigations (Home -> Cart -> Checkout -> Thank You). Pushing a `page_view`
  // event to dataLayer on every pathname change gives GTM a signal to build
  // a "Page View" trigger (Trigger type: Custom Event, event name: page_view)
  // that actually fires on every step of the funnel.
  useEffect(() => {
    gtmPageView(pathname);
  }, [pathname]);

  return null;
}
