"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import UserContext from "@/components/context/UserContext";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const CartContext = createContext(null);

// Storage keys
const CART_STORAGE_KEY = "SmartBuy BD_cart";
const WISHLIST_STORAGE_KEY = "SmartBuy BD_wishlist";

const getStorageItem = (key, defaultValue = null) => {
  if (typeof window === "undefined") return defaultValue;
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
};

const setStorageItem = (key, value) => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
};

// Unique cart key: productId + selected color + selected size
export const makeCartKey = (productId, color, size) =>
  `${productId}__${color || ""}__${size || ""}`;

// Item shape stored in localStorage — includes the product object so cart
// survives page reload without needing a batch API call.
const toSlimItem = (item) => ({
  product: item.product || null,
  productId: item.product?._id || item.product?.id || item.productId,
  quantity: item.quantity,
  selectedColor: item.selectedColor || null,
  selectedSize: item.selectedSize || null,
  selectedVariant: item.selectedVariant || null,
  variantId:
    item.selectedVariant?._id ||
    item.selectedVariant?.id ||
    item.variantId ||
    null,
  cartKey: item.cartKey,
});

// Effective unit price: variant price overrides product base price
export const getItemPrice = (item) => {
  const hasSelectedOption = !!(item.selectedColor || item.selectedSize);
  const variantPrice = hasSelectedOption ? item.selectedVariant?.price : null;
  const basePrice = item.product?.price ?? 0;
  return variantPrice != null && variantPrice > 0 ? variantPrice : basePrice;
};

export const getItemCompareAtPrice = (item) => {
  const hasSelectedOption = !!(item.selectedColor || item.selectedSize);
  const variantCompareAt = hasSelectedOption
    ? item.selectedVariant?.compareAtPrice
    : null;
  const baseCompareAt = item.product?.compareAtPrice ?? null;
  return variantCompareAt != null && variantCompareAt > 0
    ? variantCompareAt
    : baseCompareAt;
};

export const CartProvider = ({ children }) => {
  const { user } = useContext(UserContext);
  const [cartItems, setCartItems] = useState([]);
  const [wishlistItems, setWishlistItems] = useState(() =>
    getStorageItem(WISHLIST_STORAGE_KEY, []),
  );
  const [cartHydrated, setCartHydrated] = useState(false);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [toastData, setToastData] = useState(null);
  const [fbtModalData, setFbtModalData] = useState(null);
  const cartSyncTimer = useRef(null);
  const wishlistSyncTimer = useRef(null);
  // Prevents overwriting localStorage with an empty array when the batch API
  // fails to return products during the very first hydration after page load.
  const firstHydrationDone = useRef(false);

  const getId = useCallback((p) => p._id || p.id, []);

  // On mount: load slim items from localStorage, fetch fresh products, rebuild cart
  useEffect(() => {
    const slimItems = getStorageItem(CART_STORAGE_KEY, []);
    if (!slimItems || slimItems.length === 0) {
      setCartHydrated(true);
      return;
    }

    // Support old format (full product objects) by detecting the shape
    const hasFullProducts = slimItems.some(
      (item) => item.product && typeof item.product === "object",
    );
    if (hasFullProducts) {
      // Migrate old format: keep full objects but save slim format going forward
      const normalized = slimItems.map((item) => {
        if (item.cartKey) return item;
        const id = item.product?._id || item.product?.id || "unknown";
        return {
          ...item,
          selectedColor: item.selectedColor || null,
          selectedSize: item.selectedSize || null,
          selectedVariant: item.selectedVariant || null,
          cartKey: makeCartKey(
            id,
            item.selectedColor || null,
            item.selectedSize || null,
          ),
        };
      });
      setCartItems(normalized);
      setCartHydrated(true);
      return;
    }

    // New slim format: fetch fresh product data from batch endpoint
    const ids = [...new Set(slimItems.map((i) => i.productId).filter(Boolean))];
    const controller = new AbortController();
    fetch(`${API}/api/products/batch?ids=${ids.join(",")}`, {
      signal: controller.signal,
    })
      .then((r) => (r.ok ? r.json() : { products: [] }))
      .then(({ products = [] }) => {
        const productMap = Object.fromEntries(products.map((p) => [p._id, p]));
        const hydrated = slimItems
          .map((slim) => {
            const product = productMap[slim.productId];
            if (!product) return null;
            const selectedVariant = slim.variantId
              ? (product.variants || []).find(
                  (v) => v._id === slim.variantId,
                ) || null
              : null;
            return {
              product,
              quantity: slim.quantity,
              selectedColor: slim.selectedColor,
              selectedSize: slim.selectedSize,
              selectedVariant,
              cartKey:
                slim.cartKey ||
                makeCartKey(
                  slim.productId,
                  slim.selectedColor,
                  slim.selectedSize,
                ),
            };
          })
          .filter(Boolean);
        setCartItems(hydrated);
      })
      .catch(() => {})
      .finally(() => setCartHydrated(true));
    return () => controller.abort();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Save items to localStorage whenever cart changes (after initial hydration).
  // Guard: if this is the first fire after hydration and the cart is empty,
  // skip the write — it means the batch API returned nothing and we must NOT
  // destroy whatever slim items were already in localStorage.
  useEffect(() => {
    if (!cartHydrated) return;
    if (!firstHydrationDone.current) {
      firstHydrationDone.current = true;
      if (cartItems.length === 0) return; // batch API likely failed — keep existing storage
    }
    setStorageItem(CART_STORAGE_KEY, cartItems.map(toSlimItem));
  }, [cartItems, cartHydrated]);

  // Save wishlist to localStorage whenever it changes
  useEffect(() => {
    setStorageItem(WISHLIST_STORAGE_KEY, wishlistItems);
  }, [wishlistItems]);

  // Sync cart to server (debounced, only when logged in).
  // Send slim items — full product objects are reconstructed server-side.
  useEffect(() => {
    if (!user?._id) return;
    clearTimeout(cartSyncTimer.current);
    cartSyncTimer.current = setTimeout(() => {
      fetch(`${API}/api/user/cart`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ items: cartItems.map(toSlimItem) }),
      }).catch(() => {});
    }, 1500);
    return () => clearTimeout(cartSyncTimer.current);
  }, [cartItems, user?._id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync wishlist to server (debounced, only when logged in)
  useEffect(() => {
    if (!user?._id) return;
    clearTimeout(wishlistSyncTimer.current);
    wishlistSyncTimer.current = setTimeout(() => {
      fetch(`${API}/api/user/wishlist`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ items: wishlistItems }),
      }).catch(() => {});
    }, 1500);
    return () => clearTimeout(wishlistSyncTimer.current);
  }, [wishlistItems, user?._id]); // eslint-disable-line react-hooks/exhaustive-deps

  const addToCart = useCallback(
    (product, qty = 1, opts = {}) => {
      const {
        selectedColor = null,
        selectedSize = null,
        selectedVariant = null,
        silent = false,
      } = opts;
      const id = getId(product);
      const cartKey = makeCartKey(id, selectedColor, selectedSize);
      setCartItems((prev) => {
        const existing = prev.find((i) => i.cartKey === cartKey);
        if (existing) {
          return prev.map((i) =>
            i.cartKey === cartKey ? { ...i, quantity: i.quantity + qty } : i,
          );
        }
        return [
          ...prev,
          {
            product,
            quantity: qty,
            selectedColor,
            selectedSize,
            selectedVariant,
            cartKey,
          },
        ];
      });
      if (!silent) {
        const fbtItems = Array.isArray(product.frequentlyBoughtTogether)
          ? product.frequentlyBoughtTogether.filter((p) => p && (p._id || p.id))
          : [];
        setFbtModalData({ product, qty, fbtItems });
      }
    },
    [getId],
  );

  const updateQty = useCallback((cartKey, qty) => {
    setCartItems((prev) =>
      prev
        .map((i) => (i.cartKey === cartKey ? { ...i, quantity: qty } : i))
        .filter((i) => i.quantity > 0),
    );
  }, []);

  const removeFromCart = useCallback((cartKey) => {
    setCartItems((prev) => prev.filter((i) => i.cartKey !== cartKey));
  }, []);

  const updateCartVariant = useCallback(
    (oldCartKey, newColor, newSize, newVariant, newQty = null) => {
      setCartItems((prev) => {
        const existing = prev.find((i) => i.cartKey === oldCartKey);
        if (!existing) return prev;
        const updatedQty = newQty ?? existing.quantity;
        const newCartKey = makeCartKey(
          getId(existing.product),
          newColor,
          newSize,
        );
        if (newCartKey === oldCartKey) {
          return prev.map((i) =>
            i.cartKey === oldCartKey
              ? {
                  ...i,
                  selectedColor: newColor,
                  selectedSize: newSize,
                  selectedVariant: newVariant,
                  quantity: updatedQty,
                }
              : i,
          );
        }
        const dup = prev.find((i) => i.cartKey === newCartKey);
        if (dup) {
          return prev
            .filter((i) => i.cartKey !== oldCartKey && i.cartKey !== newCartKey)
            .concat({ ...dup, quantity: dup.quantity + updatedQty });
        }
        return prev.map((i) =>
          i.cartKey === oldCartKey
            ? {
                ...i,
                selectedColor: newColor,
                selectedSize: newSize,
                selectedVariant: newVariant,
                cartKey: newCartKey,
                quantity: updatedQty,
              }
            : i,
        );
      });
    },
    [getId],
  );

  const addToWishlist = useCallback(
    (product) => {
      const id = getId(product);
      setWishlistItems((prev) => {
        if (prev.includes(id)) return prev;
        return [...prev, id];
      });
    },
    [getId],
  );

  const removeFromWishlist = useCallback((productId) => {
    setWishlistItems((prev) => prev.filter((id) => id !== productId));
  }, []);

  const clearCart = useCallback(() => {
    setCartItems([]);
  }, []);

  const clearWishlist = useCallback(() => {
    setWishlistItems([]);
  }, []);

  const getCartCount = useCallback(
    () => cartItems.reduce((sum, i) => sum + i.quantity, 0),
    [cartItems],
  );

  const getWishlistCount = useCallback(
    () => wishlistItems.length,
    [wishlistItems],
  );

  const toggleSidebar = useCallback(() => setSidebarOpen((v) => !v), []);

  // Snapshots the current cart server-side and returns a shareable URL —
  // resolved live (price/stock) when opened, not frozen at share time.
  const shareCart = useCallback(async () => {
    const items = cartItems.map((i) => ({
      productId: getId(i.product),
      quantity: i.quantity,
      color: i.selectedColor || null,
      size: i.selectedSize || null,
    }));
    const res = await fetch(`${API}/api/cart/share`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ items }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to share cart");
    return `${window.location.origin}/cart/shared/${data.token}`;
  }, [cartItems, getId]);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        wishlistItems,
        isSidebarOpen,
        toastData,
        setToastData,
        fbtModalData,
        setFbtModalData,
        cartHydrated,
        addToCart,
        updateQty,
        removeFromCart,
        updateCartVariant,
        addToWishlist,
        removeFromWishlist,
        clearCart,
        clearWishlist,
        getCartCount,
        getWishlistCount,
        toggleSidebar,
        shareCart,
        isInitialized: cartHydrated,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};

export default CartContext;
