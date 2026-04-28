'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { User } from '@/lib/types';

interface AuthContextType {
  user: User | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  const router = useRouter();
  const pathname = usePathname();

  // ✅ Init auth from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('accessToken');

    console.log('[Auth-Init] Checking storage:', { hasUser: !!storedUser, hasToken: !!token });

    if (storedUser && token) {
      try {
        const parsed = JSON.parse(storedUser);
        console.log('[Auth-Init] Restoring user session:', parsed.email);
        setUser(parsed);
      } catch (err) {
        console.error('[Auth-Init] Failed to parse user. Clearing storage.');
        localStorage.removeItem('user');
        localStorage.removeItem('accessToken');
      }
    }

    setIsInitialized(true);
    setIsLoading(false);
  }, []);

  // ✅ Handle routing safely
  useEffect(() => {
    if (!isInitialized || isLoading) return;

    const isLoginPage = pathname?.startsWith('/login');

    if (!user) {
      // ❌ Not logged in → Force to login page
      if (!isLoginPage) {
        console.log('[Auth] Redirecting to /login');
        router.replace('/login');
      }
    } else {
      // ✅ Logged in → Prevent access to login page
      if (isLoginPage) {
        console.log('[Auth] Redirecting to /dashboard');
        router.replace('/dashboard');
      }
    }
  }, [user, isInitialized, isLoading, pathname, router]);

  const login = (token: string, userData: User) => {
    localStorage.setItem('accessToken', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    // ❌ NO router.push here (important)
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    setUser(null);
    router.replace('/login');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}