import React, { createContext, useContext, useEffect, useState } from "react";
import type { AuthResponse, AuthSessionUser } from "@/types";
import { api } from "@/api/client";

interface AuthContextType {
  user: AuthSessionUser | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isPresident: boolean;
  hasPermission: (permission: string) => boolean;
  setAuthSession: (response: AuthResponse) => void;
  updateUserSession: (user: AuthSessionUser) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,
  isPresident: false,
  hasPermission: () => false,
  setAuthSession: () => {},
  updateUserSession: () => {},
  logout: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<AuthSessionUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const savedToken = localStorage.getItem("cs_token");
    const savedUser = localStorage.getItem("cs_user");

    if (savedToken && savedUser) {
      setToken(savedToken);
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        setUser(null);
      }
    }
    setIsLoading(false);
  }, []);

  const isPresident = user?.roleName === "President";

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    if (user.roleName === "President") return true;
    return user.permissions.includes(permission);
  };

  const setAuthSession = (response: AuthResponse) => {
    setToken(response.token);
    setUser(response.user);
    localStorage.setItem("cs_token", response.token);
    localStorage.setItem("cs_user", JSON.stringify(response.user));
  };

  const updateUserSession = (updatedUser: AuthSessionUser) => {
    setUser(updatedUser);
    localStorage.setItem("cs_user", JSON.stringify(updatedUser));
  };

  const logout = async () => {
    try {
      if (token) {
        await api.post(`/auth/logout?token=${token}`);
      }
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      setToken(null);
      setUser(null);
      localStorage.removeItem("cs_token");
      localStorage.removeItem("cs_user");
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!token && !!user,
        isPresident,
        hasPermission,
        setAuthSession,
        updateUserSession,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
