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
      {/* Mobile: floating cart icon above WhatsApp */}
      <span className="md:hidden fixed z-50" style={{ bottom: 102, right: 16 }}>
        {/* ping ring — always active like a map marker */}
        <span className="absolute inset-0 rounded-full bg-[#f32424] opacity-40 animate-ping" />
        <button
          onClick={toggleSidebar}
          aria-label={label}
          className="relative flex items-center justify-center bg-[#f32424] text-white rounded-full shadow-xl w-9 h-9 active:scale-95 transition-transform"
        >
          <span className="relative">
            <FaShoppingCart className="w-4 h-4" />
            <span className="absolute -top-2.5 -right-2 bg-white text-[#f32424] text-[9px] font-bold min-w-3.5 h-3.5 rounded-full flex items-center justify-center leading-none px-0.5">
              {count}
            </span>
          </span>
        </button>
      </span>

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
