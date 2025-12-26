import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, AuthState, LoginCredentials, RegisterData } from '@/types';
import { api, authApi } from '@/lib/api';

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: localStorage.getItem('auth_token'),
    isAuthenticated: false,
    isLoading: true,
  });

  const checkAuth = useCallback(async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      setState({ user: null, token: null, isAuthenticated: false, isLoading: false });
      return;
    }

    try {
      api.setToken(token);
      const user = await authApi.me();
      setState({ user, token, isAuthenticated: true, isLoading: false });
    } catch {
      localStorage.removeItem('auth_token');
      api.setToken(null);
      setState({ user: null, token: null, isAuthenticated: false, isLoading: false });
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = async (credentials: LoginCredentials & { userType?: "doctor" | "patient" }) => {
    const userType = credentials.userType || "doctor";
    const response = await authApi.login(credentials.email, credentials.password, userType);
    api.setToken(response.token);
    setState({
      user: response.user,
      token: response.token,
      isAuthenticated: true,
      isLoading: false,
    });
  };

  const register = async (data: RegisterData & { userType?: "doctor" | "patient" }) => {
    const userType = data.userType || "doctor";
    const response = userType === "patient" 
      ? await authApi.registerPatient(data)
      : await authApi.registerDoctor(data);
    api.setToken(response.token);
    setState({
      user: response.user,
      token: response.token,
      isAuthenticated: true,
      isLoading: false,
    });
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    api.setToken(null);
    setState({ user: null, token: null, isAuthenticated: false, isLoading: false });
  };

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout }}>
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