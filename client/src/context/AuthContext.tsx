import { createContext, useContext, useEffect, useState } from 'react';
import { apiFetch, setAccessToken } from '../lib/apiFetch';

interface AuthContextType {
  isAuthenticated: boolean;
  isAppAdmin: boolean;
  initializing: boolean;
  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

function decodeJwtPayload(token: string): { isAppAdmin?: boolean } | null {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAppAdmin, setIsAppAdmin] = useState(false);
  const [initializing, setInitializing] = useState(true);

  const doRefresh = async (): Promise<boolean> => {
    const r = await fetch('/api/auth/refresh', { method: 'POST', credentials: 'include' }).catch(() => null);
    if (r?.ok) {
      const data = await r.json().catch(() => null);
      if (data?.accessToken) {
        setAccessToken(data.accessToken);
        setIsAuthenticated(true);
        setIsAppAdmin(decodeJwtPayload(data.accessToken)?.isAppAdmin ?? false);
        return true;
      }
    }
    return false;
  };

  // Initial session restore on page load
  useEffect(() => {
    doRefresh().finally(() => setInitializing(false));
  }, []);

  // Background refresh every 13 minutes — keeps the 15-min token alive while the admin is open.
  // On failure (refresh cookie expired) sets isAuthenticated=false so Admin.tsx shows the login form.
  useEffect(() => {
    if (!isAuthenticated) return;
    const id = setInterval(() => {
      doRefresh().then((ok) => {
        if (!ok) {
          setAccessToken(null);
          setIsAuthenticated(false);
          setIsAppAdmin(false);
        }
      });
    }, 13 * 60 * 1000);
    return () => clearInterval(id);
  }, [isAuthenticated]);

  const login = (token: string) => {
    setAccessToken(token);
    setIsAuthenticated(true);
    setIsAppAdmin(decodeJwtPayload(token)?.isAppAdmin ?? false);
  };

  const logout = async () => {
    try {
      await apiFetch('/api/auth/logout', { method: 'POST' });
    } catch { /* clear locally regardless */ }
    setAccessToken(null);
    setIsAuthenticated(false);
    setIsAppAdmin(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, isAppAdmin, initializing, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
