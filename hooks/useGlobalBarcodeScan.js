"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";

const MIN_BARCODE_LENGTH = 4;
const SCAN_GAP_MS = 100;
const LOOKUP_PATH = "/dashboard/barcodes/lookup";

function normalizeCode(value) {
  return String(value || "").trim().replace(/\s+/g, "");
}

function isEditableTarget(target) {
  if (!target || !(target instanceof Element)) return false;
  if (target.closest("input, textarea, select")) return true;
  if (
    target.closest('[contenteditable="true"], [contenteditable=""]') ||
    target.isContentEditable
  ) {
    return true;
  }
  if (target.closest('[role="textbox"]')) return true;
  return false;
}

export function useGlobalBarcodeScan(enabled = true) {
  const router = useRouter();
  const pathname = usePathname() || "";
  const bufferRef = useRef("");
  const lastKeyAtRef = useRef(0);

  useEffect(() => {
    if (!enabled) return undefined;
    if (pathname === LOOKUP_PATH || pathname.startsWith(`${LOOKUP_PATH}/`)) {
      return undefined;
    }

    const onKeyDown = (e) => {
      if (e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
      if (isEditableTarget(e.target)) return;

      const now = Date.now();
      if (now - lastKeyAtRef.current > SCAN_GAP_MS) {
        bufferRef.current = "";
      }
      lastKeyAtRef.current = now;

      if (e.key === "Enter") {
        const normalized = normalizeCode(bufferRef.current);
        bufferRef.current = "";
        if (normalized.length >= MIN_BARCODE_LENGTH) {
          e.preventDefault();
          router.push(
            `/dashboard/barcodes/lookup?code=${encodeURIComponent(normalized)}`,
          );
        }
        return;
      }

      if (e.key.length === 1 && !/\s/.test(e.key)) {
        bufferRef.current += e.key;
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [enabled, pathname, router]);
}
