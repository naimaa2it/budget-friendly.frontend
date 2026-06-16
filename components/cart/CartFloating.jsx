"use client";

import React, { useEffect, useRef, useState } from "react";
import { useCart, getItemPrice } from "@/components/context/CartContext";
import { FaShoppingBag, FaShoppingCart, FaChevronRight } from "react-icons/fa";

export default function CartFloating() {
  const { cartItems, getCartCount, toggleSidebar, isSidebarOpen } = useCart();
  const count = getCartCount();
  const [bump, setBump] = useState(false);
  const prevCount = useRef(count);

  useEffect(() => {
    if (count !== prevCount.current) {
      prevCount.current = count;
      setBump(true);
      const timer = setTimeout(() => setBump(false), 300);
      return () => clearTimeout(timer);
    }
  }, [count]);

  if (count === 0 || isSidebarOpen) return null;

  const total = cartItems.reduce(
    (sum, item) => sum + getItemPrice(item) * item.quantity,
    0,
  );
  const label = `Open cart, ${count} item${count > 1 ? "s" : ""}, total ৳${total}`;

  return (
    <>
      {/* Mobile: thumb-reachable sticky bar at the bottom */}
      <button
        onClick={toggleSidebar}
        aria-label={label}
        className={`md:hidden fixed inset-x-3 z-50 flex items-center gap-3 bg-[#f32424] text-white rounded-full shadow-xl pl-4 pr-3.5 py-3 transition-transform active:scale-95 ${bump ? "scale-105" : "scale-100"}`}
        style={{ bottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
      >
        <span className="relative shrink-0">
          <FaShoppingBag className="w-5 h-5" />
          <span className="absolute -top-2 -right-2 bg-white text-[#f32424] text-[10px] font-bold w-4.5 h-4.5 rounded-full flex items-center justify-center leading-none">
            {count}
          </span>
        </span>
        <span className="flex-1 text-left text-sm font-semibold">View Cart</span>
        <span className="text-sm font-bold">৳{total}</span>
        <FaChevronRight className="w-3 h-3 opacity-80 shrink-0" />
      </button>

      {/* Desktop: compact side tab */}
      <button
        onClick={toggleSidebar}
        aria-label={label}
        className={`hidden md:flex fixed right-0 top-1/2 -translate-y-1/2 items-center gap-1 bg-[#f32424] text-white pl-2 pr-1 py-2.5 rounded-l-xl shadow-lg z-50 hover:bg-[#16162a] transition-all ${bump ? "scale-110" : "scale-100"}`}
      >
        <FaShoppingCart className="w-5 h-5" />
        <div className="flex flex-col items-start text-xs leading-tight">
          <span>
            {count} ITEM{count > 1 ? "S" : ""}
          </span>
          <span>৳{total}</span>
        </div>
      </button>
    </>
  );
}
