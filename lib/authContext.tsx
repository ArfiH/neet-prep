import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '@/lib/api';

const AUTH_TOKEN_KEY = 'auth_token';
const USER_DATA_KEY = 'user_data';

type User = {
  id: number;
  email: string;
  phone: string | null;
  name: string | null;
  neet_rank: number | null;
  category: string | null;
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  initialized: boolean;
  isLoggedIn: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<string>;
  resetPassword: (token: string, newPassword: string) => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  async function loadStoredAuth() {
    try {
      const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
      if (token) {
        await api.init();
        try {
          const profileData = await api.getProfile();
          if (profileData) {
            setUser(profileData);
            await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(profileData));
            return;
          }
        } catch {}
        setUser(null);
        await AsyncStorage.multiRemove([AUTH_TOKEN_KEY, USER_DATA_KEY]);
      }
    } catch (e) {
      console.error('Error loading auth:', e);
    } finally {
      setLoading(false);
      setInitialized(true);
    }
  }

  const isLoggedIn = !!user && !!user.id;

  async function login(email: string, password: string) {
    const data = await api.login(email, password);
    await AsyncStorage.setItem(AUTH_TOKEN_KEY, data.token);
    await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(data.user));
    setUser(data.user);
    await api.init();
  }

  async function register(email: string, password: string, name?: string) {
    const data = await api.register(email, password, name);
    await AsyncStorage.setItem(AUTH_TOKEN_KEY, data.token);
    await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(data.user));
    setUser(data.user);
    await api.init();
  }

  async function logout() {
    await api.logout();
    setUser(null);
  }

  async function forgotPassword(email: string): Promise<string> {
    const data = await api.forgotPassword(email);
    return data.message;
  }

  async function resetPassword(token: string, newPassword: string) {
    await api.resetPassword(token, newPassword);
  }

  async function refreshUser() {
    try {
      await api.init();
      const profileData = await api.getProfile();
      if (profileData) {
        setUser(profileData);
        await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(profileData));
      }
    } catch (e) {
      console.error('Error refreshing user:', e);
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, initialized, isLoggedIn, login, register, logout, forgotPassword, resetPassword, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}