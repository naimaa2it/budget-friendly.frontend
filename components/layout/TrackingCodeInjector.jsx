"use client";

import { useEffect } from "react";

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
  useEffect(() => {
    if (injected) return;
    injected = true;

    const cached = readCache();
    if (cached) {
      injectHTML(cached.headerCode, document.head, "end");
      injectHTML(cached.bodyCode, document.body, "start");
      injectHTML(cached.footerCode, document.body, "end");
      return;
    }

    fetch(`${API}/api/admin/custom-code`)
      .then((r) => r.json())
      .then((data) => {
        writeCache(data);
        injectHTML(data.headerCode, document.head, "end");
        injectHTML(data.bodyCode, document.body, "start");
        injectHTML(data.footerCode, document.body, "end");
      })
      .catch(() => {});
  }, []);

  return null;
}
