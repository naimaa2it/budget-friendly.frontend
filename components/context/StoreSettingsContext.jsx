"use client";

import { createContext, useContext, useEffect, useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const EMPTY_POLICY = { shipping: [], return: [], faq: [], privacy: [], terms: [] };

const StoreSettingsContext = createContext({
  storeName: "",
  logoUrl: "",
  footerInfo: { phone: "", email: "", address: "" },
  contactInfo: { phone: "", email: "", address: "" },
  socialLinks: {},
  policyContent: EMPTY_POLICY,
});

export function StoreSettingsProvider({ children }) {
  const [settings, setSettings] = useState({
    storeName: "",
    logoUrl: "",
    footerInfo: { phone: "", email: "", address: "" },
    contactInfo: { phone: "", email: "", address: "" },
    socialLinks: {},
    policyContent: EMPTY_POLICY,
  });

  useEffect(() => {
    fetch(`${API}/api/admin/top-banner`)
      .then((r) => r.json())
      .then((d) =>
        setSettings({
          storeName: d.storeName || "",
          logoUrl: d.websiteLogo?.url || "",
          footerInfo: d.footerInfo || { phone: "", email: "", address: "" },
          contactInfo: d.contactInfo || { phone: "", email: "", address: "" },
          socialLinks: d.socialLinks || {},
          policyContent: d.policyContent || EMPTY_POLICY,
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
