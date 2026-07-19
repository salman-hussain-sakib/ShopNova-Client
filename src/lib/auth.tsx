'use client';

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { api, User } from './api';
import { useToast } from '@/components/Toast';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, phone?: string) => Promise<void>;
  demoLogin: () => Promise<void>;
  googleLogin: (value: any, type?: 'credential' | 'accessToken' | 'profile') => Promise<void>;
  facebookLogin: (accessToken: string) => Promise<void>;
  updateProfile: (data: { name?: string; email?: string; phone?: string; avatar?: string }) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  const saveAuth = useCallback((newToken: string, newUser: User) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setUser(newUser);
  }, []);

  const logout = useCallback(() => {
    const wasLoggedIn = !!localStorage.getItem('token');
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    if (wasLoggedIn) toast('Logged out successfully', 'success');
  }, [toast]);

  useEffect(() => {
    const stored = localStorage.getItem('token');
    if (!stored) {
      setLoading(false);
      return;
    }
    setToken(stored);
    api<{ user: User }>('/auth/me')
      .then(({ user }) => setUser(user))
      .catch(() => logout())
      .finally(() => setLoading(false));
  }, [logout]);

  const login = async (identifier: string, password: string) => {
    const { user, token } = await api<{ user: User; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier, password }),
    });
    saveAuth(token, user);
    toast(`Welcome back, ${user.name.split(' ')[0]}!`, 'success');
  };

  const register = async (name: string, email: string, password: string, phone?: string) => {
    const { user, token } = await api<{ user: User; token: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, phone }),
    });
    saveAuth(token, user);
    toast(`Account created! Welcome, ${user.name.split(' ')[0]}!`, 'success');
  };

  const demoLogin = async () => {
    const { user, token } = await api<{ user: User; token: string }>('/auth/demo-login', {
      method: 'POST',
    });
    saveAuth(token, user);
    toast(`Welcome back, ${user.name.split(' ')[0]}!`, 'success');
  };

  const googleLogin = async (value: any, type: 'credential' | 'accessToken' | 'profile' = 'credential') => {
    const body = type === 'credential' ? { credential: value } : type === 'accessToken' ? { accessToken: value } : { profile: value };
    const { user, token } = await api<{ user: User; token: string }>('/auth/social-g', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    saveAuth(token, user);
    toast(`Welcome, ${user.name.split(' ')[0]}!`, 'success');
  };

  const facebookLogin = async (accessToken: string) => {
    const { user, token } = await api<{ user: User; token: string }>('/auth/social-fb', {
      method: 'POST',
      body: JSON.stringify({ accessToken }),
    });
    saveAuth(token, user);
    toast(`Welcome, ${user.name.split(' ')[0]}!`, 'success');
  };

  const updateProfile = async (data: { name?: string; email?: string; phone?: string; avatar?: string }) => {
    const { user: updatedUser } = await api<{ user: User }>('/auth/me', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, demoLogin, googleLogin, facebookLogin, updateProfile, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
