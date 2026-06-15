"use client";

import { createContext, useContext, useEffect, useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const StoreSettingsContext = createContext({ storeName: "", logoUrl: "", storeEmail: "", storePhone: "", storeAddress: "" });

export function StoreSettingsProvider({ children }) {
  const [settings, setSettings] = useState({ storeName: "", logoUrl: "", storeEmail: "", storePhone: "", storeAddress: "" });

  useEffect(() => {
    fetch(`${API}/api/admin/top-banner`)
      .then((r) => r.json())
      .then((d) =>
        setSettings({
          storeName: d.storeName || "",
          logoUrl: d.websiteLogo?.url || "",
          storeEmail: d.storeEmail || "",
          storePhone: d.storePhone || "",
          storeAddress: d.storeAddress || "",
        })
      )
      .catch(() => {});
  }, []);

  return (
    <StoreSettingsContext.Provider value={settings}>
      {children}
    </StoreSettingsContext.Provider>
  );
}

export function useStoreSettings() {
  return useContext(StoreSettingsContext);
}
