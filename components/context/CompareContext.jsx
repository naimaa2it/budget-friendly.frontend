"use client";

import { createContext, useContext, useState, useCallback } from "react";
import toast from "react-hot-toast";

const CompareContext = createContext(null);

const MAX_COMPARE = 4;

export function CompareProvider({ children }) {
  const [compareList, setCompareList] = useState([]);

  const addToCompare = useCallback((product) => {
    setCompareList((prev) => {
      if (prev.find((p) => p._id === product._id)) {
        toast("Already in compare list", { icon: "⚖️" });
        return prev;
      }
      if (prev.length >= MAX_COMPARE) {
        toast.error(`Max ${MAX_COMPARE} products can be compared`);
        return prev;
      }
      toast.success("Added to compare", { icon: "⚖️" });
      return [...prev, product];
    });
  }, []);

  const removeFromCompare = useCallback((productId) => {
    setCompareList((prev) => prev.filter((p) => p._id !== productId));
  }, []);

  const clearCompare = useCallback(() => setCompareList([]), []);

  const isInCompare = useCallback(
    (productId) => compareList.some((p) => p._id === productId),
    [compareList],
  );

  return (
    <CompareContext.Provider
      value={{ compareList, addToCompare, removeFromCompare, clearCompare, isInCompare }}
    >
      {children}
    </CompareContext.Provider>
  );
}

export function useCompare() {
  const ctx = useContext(CompareContext);
  if (!ctx) throw new Error("useCompare must be used inside CompareProvider");
  return ctx;
}
