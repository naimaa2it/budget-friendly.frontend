"use client";

import { createContext, useContext, useState, useCallback } from "react";
import toast from "react-hot-toast";
import { FaArrowDown } from "react-icons/fa";

const CompareContext = createContext(null);

const MAX_COMPARE = 4;

export function CompareProvider({ children }) {
  const [compareList, setCompareList] = useState([]);

  // NOTE: toast() calls must stay outside the setState updater — React (Strict Mode)
  // invokes updater functions twice in dev, which previously fired the toast twice.
  const addToCompare = useCallback(
    (product) => {
      if (compareList.find((p) => p._id === product._id)) {
        toast("Already in compare list", { icon: "⚖️" });
        return;
      }
      if (compareList.length >= MAX_COMPARE) {
        toast.error(`Max ${MAX_COMPARE} products can be compared`);
        return;
      }
      toast.success(
        (t) => (
          <span className="flex items-center gap-2">
            Added to compare
            <FaArrowDown className="text-[#E36E00]" />
          </span>
        ),
        { icon: "⚖️" },
      );
      setCompareList((prev) => [...prev, product]);
    },
    [compareList],
  );

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
      value={{
        compareList,
        addToCompare,
        removeFromCompare,
        clearCompare,
        isInCompare,
      }}
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
