"use client";

import { createContext, useContext, useEffect, useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "https://api.pickob.com";

const EMPTY_POLICY = {
  shipping: [],
  return: [],
  faq: [],
  privacy: [],
  terms: [],
  about: [],
};

const EMPTY_FOOTER_LINKS = { quickLinks: [], customerService: [] };

const StoreSettingsContext = createContext({
  storeName: "",
  logoUrl: "",
  footerInfo: { phone: "", email: "", address: "" },
  contactInfo: { phone: "", email: "", address: "" },
  supportInfo: { phone: "", email: "" },
  socialLinks: {},
  policyContent: EMPTY_POLICY,
  footerLinks: EMPTY_FOOTER_LINKS,
});

const EMPTY_SETTINGS = {
  storeName: "",
  logoUrl: "",
  footerInfo: { phone: "", email: "", address: "" },
  contactInfo: { phone: "", email: "", address: "" },
  supportInfo: { phone: "", email: "" },
  socialLinks: {},
  policyContent: EMPTY_POLICY,
  footerLinks: EMPTY_FOOTER_LINKS,
};

// initialSettings comes from RootLayout's build-time getStoreSettings() call
// (same /api/admin/top-banner data), so the header logo and footer contact
// info render in the static HTML immediately instead of staying blank until
// this provider's own client-side fetch resolves. The fetch below still runs
// in the background to pick up admin edits made since the last deploy.
export function StoreSettingsProvider({ children, initialSettings }) {
  const [settings, setSettings] = useState(initialSettings || EMPTY_SETTINGS);

  useEffect(() => {
    fetch(`${API}/api/admin/top-banner`)
      .then((r) => r.json())
      .then((d) =>
        setSettings({
          storeName: d.storeName || "",
          logoUrl: d.websiteLogo?.url || "",
          footerInfo: d.footerInfo || { phone: "", email: "", address: "" },
          contactInfo: d.contactInfo || { phone: "", email: "", address: "" },
          supportInfo: d.supportInfo || { phone: "", email: "" },
          socialLinks: d.socialLinks || {},
          policyContent: d.policyContent || EMPTY_POLICY,
          footerLinks: d.footerLinks || EMPTY_FOOTER_LINKS,
        }),
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
