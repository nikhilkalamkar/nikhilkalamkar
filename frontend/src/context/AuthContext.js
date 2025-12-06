import React, { createContext, useContext, useState, useEffect } from 'react';
import { currentUser as mockCurrentUser } from '../mock/mockData';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkAuthStatus = () => {
    const storedUser = localStorage.getItem('ishukart_user');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        console.log('[AuthContext] Found stored user:', user);
        setCurrentUser(user);
        setIsAuthenticated(true);
        return true;
      } catch (error) {
        console.error('[AuthContext] Error parsing stored user:', error);
        localStorage.removeItem('ishukart_user');
        return false;
      }
    }
    return false;
  };

  useEffect(() => {
    // Initial auth check
    checkAuthStatus();
    setLoading(false);

    // Listen for storage changes (from OAuth callback or other tabs)
    const handleStorageChange = (e) => {
      if (e.key === 'ishukart_user') {
        console.log('[AuthContext] Storage changed, re-checking auth');
        checkAuthStatus();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const login = async (email, password) => {
    // Mock login - will be replaced with actual API call
    const user = mockCurrentUser;
    localStorage.setItem('ishukart_user', JSON.stringify(user));
    setCurrentUser(user);
    setIsAuthenticated(true);
    return user;
  };

  const signup = async (email, password, username, fullName) => {
    // Mock signup - will be replaced with actual API call
    const user = { ...mockCurrentUser, email, username, fullName };
    localStorage.setItem('ishukart_user', JSON.stringify(user));
    setCurrentUser(user);
    setIsAuthenticated(true);
    return user;
  };

  const logout = () => {
    localStorage.removeItem('ishukart_user');
    setCurrentUser(null);
    setIsAuthenticated(false);
  };

  const value = {
    currentUser,
    isAuthenticated,
    loading,
    login,
    signup,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
