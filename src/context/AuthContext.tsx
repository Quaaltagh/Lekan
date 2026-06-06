'use client';
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService, UserRole } from '@/services/authService';

interface User {
  id: string;
  email: string;
  full_name?: string;
  role: UserRole;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string, role: UserRole) => Promise<void>;
  register: (email: string, password: string, role: UserRole, full_name?: string) => Promise<void>;
  logout: () => void;
  setSession: (token: string, user: User) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('lekan_token');
    const savedUser = localStorage.getItem('lekan_user');
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string, role: UserRole) => {
    const data = await authService.login({ email, password, role });
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem('lekan_token', data.token);
    localStorage.setItem('lekan_user', JSON.stringify(data.user));
  };

  const register = async (email: string, password: string, role: UserRole, full_name?: string) => {
    const data = await authService.register({ email, password, role, full_name });
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem('lekan_token', data.token);
    localStorage.setItem('lekan_user', JSON.stringify(data.user));
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    setToken(null);
    localStorage.removeItem('lekan_token');
    localStorage.removeItem('lekan_user');
  };

  const setSession = (token: string, user: User) => {
    setToken(token);
    setUser(user);
    localStorage.setItem('lekan_token', token);
    localStorage.setItem('lekan_user', JSON.stringify(user));
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, register, logout, setSession }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth harus digunakan di dalam AuthProvider');
  return ctx;
}