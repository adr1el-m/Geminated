'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface AuthUser {
  name: string;
  role: string;
  token: string;
}

interface AuthContextType {
  user: AuthUser | null;
  login: (token: string, role: string, name: string) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const storedUser = localStorage.getItem('haliya_auth');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        localStorage.removeItem('haliya_auth');
      }
    }
    setIsLoading(false);
  }, []);

  const login = (token: string, role: string, name: string) => {
    const normalizedRole = (role || 'patient').toLowerCase();
    const authData = { token, role: normalizedRole, name: name || 'User' };
    
    setUser(authData);
    localStorage.setItem('haliya_auth', JSON.stringify(authData));
    
    // Explicit redirection logic
    if (normalizedRole === 'patient') {
      router.push('/dashboard/patient');
    } else {
      // Both 'admin' and 'facility' go to facility dashboard
      router.push('/dashboard/facility');
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('haliya_auth');
    router.push('/');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
