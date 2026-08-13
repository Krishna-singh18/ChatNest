// Ye user authentication state aur login logic manage karta hai (Manages user auth state and logic)
'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '@/types';
import { api } from '@/lib/api';
import { useRouter, usePathname } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (identifier: string, password?: string) => Promise<void>;
  loginWithOtp: (identifier: string, otp?: string) => Promise<void>;
  registerUser: (data: { phone_number?: string; username?: string; display_name: string; password?: string }) => Promise<void>;
  logout: () => void;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const savedToken = localStorage.getItem('chatnest_token');
    if (savedToken) {
      setToken(savedToken);
      api
        .getMe(savedToken)
        .then((userData) => {
          setUser(userData);
        })
        .catch(() => {
          localStorage.removeItem('chatnest_token');
          setToken(null);
          setUser(null);
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isLoading) {
      if (!user && pathname !== '/' && !pathname?.startsWith('/login') && !pathname?.startsWith('/register')) {
        router.push('/login');
      }
    }
  }, [user, isLoading, pathname, router]);


  const login = async (identifier: string, password?: string) => {
    const res = await api.login(identifier, password);
    localStorage.setItem('chatnest_token', res.access_token);
    setToken(res.access_token);
    setUser(res.user);
    router.push('/chat');
  };

  const loginWithOtp = async (identifier: string, otp: string = '123456') => {
    const res = await api.verifyOtp(identifier, otp);
    localStorage.setItem('chatnest_token', res.access_token);
    setToken(res.access_token);
    setUser(res.user);
    router.push('/chat');
  };

  const registerUser = async (data: { phone_number?: string; username?: string; display_name: string; password?: string }) => {
    const createdUser = await api.register(data);
    const identifier = createdUser.phone_number || createdUser.username || '';
    if (data.password) {
      await login(identifier, data.password);
    } else {
      await loginWithOtp(identifier, '123456');
    }
  };

  const logout = () => {
    localStorage.removeItem('chatnest_token');
    setToken(null);
    setUser(null);
    router.push('/login');
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, loginWithOtp, registerUser, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
