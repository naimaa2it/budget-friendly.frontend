"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const CartContext = createContext(null);

// Storage keys
const CART_STORAGE_KEY = 'yourHaat_cart';
const WISHLIST_STORAGE_KEY = 'yourHaat_wishlist';

// Helper to safely access localStorage
const getStorageItem = (key, defaultValue = null) => {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error reading from localStorage (${key}):`, error);
    return defaultValue;
  }
};

const setStorageItem = (key, value) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error writing to localStorage (${key}):`, error);
  }
};

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [wishlistItems, setWishlistItems] = useState([]);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [toastData, setToastData] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Helper to normalize product id
  const getId = useCallback((p) => p._id || p.id, []);

  // Load from localStorage on mount
  useEffect(() => {
    const savedCart = getStorageItem(CART_STORAGE_KEY, []);
    const savedWishlist = getStorageItem(WISHLIST_STORAGE_KEY, []);
    
    setCartItems(savedCart);
    setWishlistItems(savedWishlist);
    setIsInitialized(true);
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (isInitialized) {
      setStorageItem(CART_STORAGE_KEY, cartItems);
    }
  }, [cartItems, isInitialized]);

  // Save wishlist to localStorage whenever it changes
  useEffect(() => {
    if (isInitialized) {
      setStorageItem(WISHLIST_STORAGE_KEY, wishlistItems);
    }
  }, [wishlistItems, isInitialized]);

  const addToCart = useCallback((product, qty = 1) => {
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
  }, [getId]);

  const updateQty = useCallback((productId, qty) => {
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
  }, [getId]);

  const removeFromCart = useCallback((productId) => {
    setCartItems((prev) => prev.filter((i) => getId(i.product) !== productId));
  }, [getId]);

  const addToWishlist = useCallback((product) => {
    const id = getId(product);
    setWishlistItems((prev) => {
      if (prev.includes(id)) return prev;
      return [...prev, id];
    });
  }, [getId]);

  const removeFromWishlist = useCallback((productId) => {
    setWishlistItems((prev) => prev.filter((id) => id !== productId));
  }, []);

  const clearCart = useCallback(() => {
    setCartItems([]);
  }, []);

  const clearWishlist = useCallback(() => {
    setWishlistItems([]);
  }, []);

  const getCartCount = useCallback(() => 
    cartItems.reduce((sum, i) => sum + i.quantity, 0), 
    [cartItems]
  );
  
  const getWishlistCount = useCallback(() => 
    wishlistItems.length, 
    [wishlistItems]
  );

  const toggleSidebar = useCallback(() => setSidebarOpen((v) => !v), []);

  const contextValue = {
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
    clearCart,
    clearWishlist,
    getCartCount,
    getWishlistCount,
    toggleSidebar,
    isInitialized,
  };

  return (
    <CartContext.Provider value={contextValue}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export default CartContext;