import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import * as api from './api';

type User = {
  id: number;
  email: string;
  name: string | null;
  category: string | null;
  role?: string;
  email_verified: boolean;
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  isLoggedIn: boolean;
  isAdmin: boolean;
  login: (email: string, password: string, forceLogin?: boolean) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<{ message: string; email: string }>;
  logout: () => Promise<void>;
  verifyEmail: (token: string) => Promise<void>;
  resendVerification: (email: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<string>;
  resetPassword: (token: string, newPassword: string) => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Load user on mount if token exists
  useEffect(() => {
    if (api.isLoggedIn()) {
      api.getProfile()
        .then((data) => {
          if (data && data.email_verified) {
            setUser(data);
          } else {
            api.clearToken();
          }
        })
        .catch((err) => {
          api.logError('AuthProvider.getProfile', err);
          api.clearToken();
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  // Listen for session-invalidated events from api.ts
  useEffect(() => {
    const handler = () => {
      setUser(null);
    };
    window.addEventListener('session-invalidated', handler);
    return () => window.removeEventListener('session-invalidated', handler);
  }, []);

  const login = useCallback(async (email: string, password: string, forceLogin = false) => {
    const data = await api.login(email, password, forceLogin);
    setUser(data.user);
  }, []);

  const register = useCallback(async (email: string, password: string, name?: string) => {
    return api.register(email, password, name);
  }, []);

  const logout = useCallback(async () => {
    await api.logout();
    setUser(null);
  }, []);

  const verifyEmail = useCallback(async (token: string) => {
    const data = await api.verifyEmail(token);
    setUser(data.user);
  }, []);

  const resendVerification = useCallback(async (email: string) => {
    await api.resendVerification(email);
  }, []);

  const forgotPassword = useCallback(async (email: string): Promise<string> => {
    const data = await api.forgotPassword(email);
    return data.message;
  }, []);

  const resetPassword = useCallback(async (token: string, newPassword: string) => {
    await api.resetPassword(token, newPassword);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const data = await api.getProfile();
      if (data) setUser(data);
    } catch (err) {
      api.logError('refreshUser', err);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isLoggedIn: !!user,
        isAdmin: user?.role === 'admin',
        login,
        register,
        logout,
        verifyEmail,
        resendVerification,
        forgotPassword,
        resetPassword,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
