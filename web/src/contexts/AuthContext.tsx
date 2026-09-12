import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { getToken, setToken, clearToken, setUnauthorizedHandler } from '../services/apiClient';
import * as authService from '../services/auth.service';
import type { AuthUser } from '../services/auth.service';

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setUnauthorizedHandler(() => setUser(null));
    return () => setUnauthorizedHandler(null);
  }, []);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }
    authService
      .getMe()
      .then(setUser)
      .catch(() => {
        clearToken();
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  async function login(email: string, password: string) {
    const { token, user: loggedInUser } = await authService.login(email, password);
    setToken(token);
    setUser(loggedInUser);
  }

  function logout() {
    clearToken();
    setUser(null);
  }

  const value = useMemo<AuthContextValue>(
    () => ({ user, loading, isAuthenticated: !!user, login, logout }),
    [user, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth phải được gọi bên trong <AuthProvider>');
  return ctx;
}
