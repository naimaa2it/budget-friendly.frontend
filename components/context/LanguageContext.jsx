"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { t as translate } from "@/lib/translations";

const LanguageContext = createContext({
  lang: "en",
  setLang: () => {},
  t: (key) => key,
});

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState("en");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("ya_lang");
      if (saved === "bn") setLangState("bn");
    } catch {}
  }, []);

  const setLang = useCallback((l) => {
    setLangState(l);
    try { localStorage.setItem("ya_lang", l); } catch {}
  }, []);

  const t = useCallback((key) => translate(lang, key), [lang]);

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
