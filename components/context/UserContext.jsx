"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

const UserContext = createContext({
  user: null,
  setUser: () => {},
  refreshUser: () => {},
  loading: true,
});

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const API = process.env.NEXT_PUBLIC_API_URL || "https://api.pickob.com";

  // Memoized so its identity is stable across renders. Many components run
  // `useEffect(() => { if (!user) refreshUser(); }, [user, refreshUser])`; if
  // refreshUser were recreated every render, that effect would re-fire in a
  // loop whenever the user is logged out (me → null → setUser(null) → render →
  // new refreshUser → effect again), hammering /api/auth/me until it 429s.
  const refreshUser = useCallback(async () => {
    try {
      setLoading(true);
      // `cache: "no-store"` stops the browser from sending a conditional
      // request that the server can answer with a bodiless 304 — parsing an
      // empty 304 body used to throw and wrongly clear the logged-in user.
      const r = await fetch(`${API}/api/auth/me`, {
        credentials: "include",
        cache: "no-store",
      });
      const data = await r.json().catch(() => ({}));
      const nextUser = data.user || null;
      setUser(nextUser);
      return nextUser;
    } catch (err) {
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, [API]);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  return (
    <UserContext.Provider value={{ user, setUser, refreshUser, loading }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);

export default UserContext;
