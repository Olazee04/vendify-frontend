'use client';
import { useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import { User } from '@/types';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userCookie = Cookies.get('vendify_user');
    if (userCookie) {
      try {
        setUser(JSON.parse(userCookie));
      } catch {
        Cookies.remove('vendify_user');
      }
    }
    setLoading(false);
  }, []);

  const saveAuth = (userData: User, token: string, refreshToken: string) => {
    Cookies.set('vendify_token', token, { expires: 1 });
    Cookies.set('vendify_refresh', refreshToken, { expires: 7 });
    Cookies.set('vendify_user', JSON.stringify(userData), { expires: 1 });
    setUser(userData);
  };

  const logout = () => {
    Cookies.remove('vendify_token');
    Cookies.remove('vendify_refresh');
    Cookies.remove('vendify_user');
    setUser(null);
    window.location.href = '/login';
  };

  const isAuthenticated = !!Cookies.get('vendify_token');

  return { user, loading, saveAuth, logout, isAuthenticated };
}