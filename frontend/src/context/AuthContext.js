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

  useEffect(() => {
    // Check if user is logged in
    const checkAuthStatus = async () => {
      const storedUser = localStorage.getItem('ishukart_user');
      if (storedUser) {
        try {
          const user = JSON.parse(storedUser);
          console.log('[AuthContext] Found stored user:', user);
          setCurrentUser(user);
          setIsAuthenticated(true);
        } catch (error) {
          console.error('[AuthContext] Error parsing stored user:', error);
          localStorage.removeItem('ishukart_user');
        }
      }
      setLoading(false);
    };
    
    checkAuthStatus();
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
