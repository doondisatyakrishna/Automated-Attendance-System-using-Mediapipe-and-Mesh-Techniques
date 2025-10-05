import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from '../types';
import { getMyProfile } from '../api';

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string) => void;
  logout: () => void;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const AuthProviderComponent: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    navigate('/preview');
  }, [navigate]);

  useEffect(() => {
    const bootstrapAuth = async () => {
      if (token) {
        try {
          const profileData = await getMyProfile();
          setUser(profileData);
        } catch (error) {
          console.error("Invalid session token, logging out.", error);
          logout();
        }
      }
      setIsLoading(false);
    };
    bootstrapAuth();
  }, [token, logout]);

  // --- THE FIX: Navigation is now handled inside the login function ---
  const login = useCallback((authToken: string) => {
    setToken(authToken);
    localStorage.setItem('token', authToken);
    getMyProfile().then(profileData => {
      setUser(profileData);
      // Navigate to the dashboard AFTER the user profile is fetched and set
      navigate('/dashboard'); 
    }).catch(err => {
        console.error("Failed to fetch profile after login", err);
        logout();
    });
  }, [logout, navigate]);

  const isAuthenticated = !!token;

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated, isLoading, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => (
  <AuthProviderComponent>{children}</AuthProviderComponent>
);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}