"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUser } from "@/components/context/UserContext";
import { FaBell } from "react-icons/fa";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const STORAGE_KEY = "Pickob-dashboard-notif-last-seen";
const POLL_INTERVAL_MS = 30000;

// Mirrors backend lib/permissions.js — the bell only polls the orders
// notification endpoint when the signed-in account can actually see orders.
function canSeeOrders(user) {
  if (!user) return false;
  if (user.role === "admin") return true;
  if (!Array.isArray(user.permissions) || user.permissions.length === 0)
    return true;
  return user.permissions.includes("orders");
}

function timeAgo(dateStr) {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function NotificationBell() {
  const { user } = useUser();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [orders, setOrders] = useState([]);
  const [lastSeenAt, setLastSeenAt] = useState(null);
  const containerRef = useRef(null);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      setLastSeenAt(stored ? new Date(stored) : new Date());
    } catch {
      setLastSeenAt(new Date());
    }
  }, []);

  const canView = canSeeOrders(user);

  useEffect(() => {
    if (!canView) return;
    let cancelled = false;

    const poll = async () => {
      try {
        const resp = await fetch(`${API_URL}/api/admin/notifications/orders`, {
          credentials: "include",
        });
        if (!resp.ok) return;
        const body = await resp.json();
        if (!cancelled) setOrders(body.orders || []);
      } catch {
        // ignore network errors, retry on next interval
      }
    };

    poll();
    const interval = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [canView]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!canView || !lastSeenAt) return null;

  const unreadCount = orders.filter(
    (o) => new Date(o.createdAt) > lastSeenAt,
  ).length;

  const handleToggle = () => {
    setOpen((value) => !value);
    if (!open) {
      const now = new Date();
      setLastSeenAt(now);
      try {
        window.localStorage.setItem(STORAGE_KEY, now.toISOString());
      } catch {
        // ignore storage errors
      }
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={handleToggle}
        aria-label="Order notifications"
        className="relative p-2 rounded-xl text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition"
      >
        <FaBell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#f32424] px-1 text-[10px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 max-w-[90vw] rounded-2xl border border-gray-100 bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
            <span className="text-sm font-semibold text-gray-900">
              New orders
            </span>
            <Link
              href="/dashboard/orders"
              onClick={() => setOpen(false)}
              className="text-xs text-pink-600 hover:underline"
            >
              View all
            </Link>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {orders.length === 0 && (
              <div className="px-4 py-8 text-center text-sm text-gray-400">
                No recent orders
              </div>
            )}
            {orders.map((o) => (
              <button
                key={o._id}
                type="button"
                onClick={() => {
                  setOpen(false);
                  router.push("/dashboard/orders");
                }}
                className="flex w-full items-center justify-between gap-3 border-b border-gray-50 px-4 py-3 text-left text-sm hover:bg-gray-50"
              >
                <div className="min-w-0">
                  <div className="truncate font-medium text-gray-900">
                    {o.customerName}
                  </div>
                  <div className="text-xs text-gray-500">
                    #{o.orderId} · {o.status}
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="font-semibold text-gray-900">৳{o.total}</div>
                  <div className="text-xs text-gray-400">
                    {timeAgo(o.createdAt)}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
