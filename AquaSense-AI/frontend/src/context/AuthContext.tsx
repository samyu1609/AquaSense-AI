import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '../types';
import { getAuthToken, loginUser as apiLogin, registerUser as apiRegister, removeAuthToken, setAuthToken } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, pass: string) => Promise<void>;
  register: (name: string, email: string, pass: string) => Promise<void>;
  logout: () => void;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setTokenState] = useState<string | null>(getAuthToken());

  useEffect(() => {
    const savedUser = localStorage.getItem('aquasense_user');
    if (savedUser && token) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        logout();
      }
    }
  }, [token]);

  const login = async (email: string, pass: string) => {
    const res = await apiLogin(email, pass);
    setAuthToken(res.access_token);
    setTokenState(res.access_token);
    setUser(res.user);
    localStorage.setItem('aquasense_user', JSON.stringify(res.user));
  };

  const register = async (name: string, email: string, pass: string) => {
    const newUser = await apiRegister(name, email, pass);
    await login(email, pass);
  };

  const logout = () => {
    removeAuthToken();
    localStorage.removeItem('aquasense_user');
    setTokenState(null);
    setUser(null);
  };

  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
