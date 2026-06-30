"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

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

  const refreshUser = async () => {
    try {
      setLoading(true);
      const r = await fetch(`${API}/api/auth/me`, { credentials: "include" });
      const data = await r.json();
      setUser(data.user || null);
    } catch (err) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  return (
    <UserContext.Provider value={{ user, setUser, refreshUser, loading }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);

export default UserContext;
