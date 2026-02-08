"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';

const UserContext = createContext({ user: null, setUser: () => {}, refreshUser: () => {} });

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  const refreshUser = async () => {
    try {
      const r = await fetch(`${API}/api/auth/me`, { credentials: 'include' });
      const data = await r.json();
      setUser(data.user || null);
    } catch (err) {
      setUser(null);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  return (
    <UserContext.Provider value={{ user, setUser, refreshUser }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);

export default UserContext;