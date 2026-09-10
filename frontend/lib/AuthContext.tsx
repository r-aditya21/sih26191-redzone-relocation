"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { AuthUser, getToken, saveToken, clearToken, fetchMe } from "./auth";

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  setSession: (token: string, user: AuthUser) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const PUBLIC_PATHS = ["/login", "/register"];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const token = getToken();

    if (!token) {
      setLoading(false);
      if (!PUBLIC_PATHS.includes(pathname)) {
        router.replace("/login");
      }
      return;
    }

    fetchMe(token)
      .then((me) => {
        setUser(me);
        if (PUBLIC_PATHS.includes(pathname)) {
          router.replace("/");
        }
      })
      .catch(() => {
        clearToken();
        if (!PUBLIC_PATHS.includes(pathname)) {
          router.replace("/login");
        }
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  function setSession(token: string, authUser: AuthUser) {
    saveToken(token);
    setUser(authUser);
    router.replace("/");
  }

  function logout() {
    clearToken();
    setUser(null);
    router.replace("/login");
  }

  return (
    <AuthContext.Provider value={{ user, loading, setSession, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
