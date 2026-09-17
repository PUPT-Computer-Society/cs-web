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
  logoutAll: () => Promise<void>;
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
  logoutAll: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<AuthSessionUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const revalidateSession = async () => {
      const savedUser = localStorage.getItem("cs_user");
      if (savedUser) {
        try {
          setUser(JSON.parse(savedUser));
        } catch {
          setUser(null);
        }
      }

      try {
        const freshUser = await api.get<AuthSessionUser>("/auth/me");
        setUser(freshUser);
        setToken(localStorage.getItem("cs_token") || "cookie_active");
        localStorage.setItem("cs_user", JSON.stringify(freshUser));
      } catch {
        setUser(null);
        setToken(null);
        localStorage.removeItem("cs_user");
        localStorage.removeItem("cs_token");
      } finally {
        setIsLoading(false);
      }
    };

    revalidateSession();
  }, []);

  const isPresident = user?.roleName === "President";

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    if (user.roleName === "President") return true;
    return user.permissions.includes(permission);
  };

  const setAuthSession = (response: AuthResponse) => {
    setToken(response.token || "cookie_active");
    setUser(response.user);
    localStorage.setItem("cs_user", JSON.stringify(response.user));
    if (response.token) {
      localStorage.setItem("cs_token", response.token);
    }
  };

  const updateUserSession = (updatedUser: AuthSessionUser) => {
    setUser(updatedUser);
    localStorage.setItem("cs_user", JSON.stringify(updatedUser));
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (err) {
      console.error("[logout] {Revoke}:", err);
    } finally {
      setToken(null);
      setUser(null);
      localStorage.removeItem("cs_token");
      localStorage.removeItem("cs_user");
    }
  };

  const logoutAll = async () => {
    try {
      await api.post("/auth/logout/all");
    } catch (err) {
      console.error("[logoutAll] {RevokeAll}:", err);
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
        logoutAll,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
