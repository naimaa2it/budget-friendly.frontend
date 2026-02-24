"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [wishlistItems, setWishlistItems] = useState([]);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [toastData, setToastData] = useState(null);

  // helper to normalize product id
  const getId = (p) => p._id || p.id;

  const addToCart = (product, qty = 1) => {
    setCartItems((prev) => {
      const id = getId(product);
      const existing = prev.find((i) => getId(i.product) === id);
      if (existing) {
        return prev.map((i) =>
          getId(i.product) === id
            ? { ...i, quantity: i.quantity + qty }
            : i
        );
      }
      return [...prev, { product, quantity: qty }];
    });
    setToastData({ product, qty });
  };

  const updateQty = (productId, qty) => {
    setCartItems((prev) =>
      prev
        .map((i) => {
          if (getId(i.product) === productId) {
            return { ...i, quantity: qty };
          }
          return i;
        })
        .filter((i) => i.quantity > 0)
    );
  };

  const removeFromCart = (productId) => {
    setCartItems((prev) => prev.filter((i) => getId(i.product) !== productId));
  };

  const addToWishlist = (product) => {
    const id = getId(product);
    setWishlistItems((prev) => {
      if (prev.find((i) => getId(i) === id)) return prev;
      return [...prev, id];
    });
  };

  const removeFromWishlist = (productId) => {
    setWishlistItems((prev) => prev.filter((id) => id !== productId));
  };

  const getCartCount = () => cartItems.reduce((sum, i) => sum + i.quantity, 0);
  const getWishlistCount = () => wishlistItems.length;

  const toggleSidebar = () => setSidebarOpen((v) => !v);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        wishlistItems,
        isSidebarOpen,
        toastData,
        setToastData,
        addToCart,
        updateQty,
        removeFromCart,
        addToWishlist,
        removeFromWishlist,
        getCartCount,
        getWishlistCount,
        toggleSidebar,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);

export default CartContext;