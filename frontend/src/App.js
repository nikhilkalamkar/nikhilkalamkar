import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import '@/App.css';
import Landing from '@/pages/Landing';
import Camera from '@/pages/Camera';
import Stories from '@/pages/Stories';
import Chats from '@/pages/Chats';
import ChatView from '@/pages/ChatView';
import Profile from '@/pages/Profile';
import BottomNav from '@/components/BottomNav';
import { Toaster } from '@/components/ui/sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

export const AuthContext = React.createContext();

function AppContent({ user, token, login, logout }) {
  const location = useLocation();
  const hideBottomNav = location.pathname.startsWith('/chat/');

  if (!user) {
    return (
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    );
  }

  return (
    <>
      <Routes>
        <Route path="/" element={<Camera />} />
        <Route path="/stories" element={<Stories />} />
        <Route path="/chats" element={<Chats />} />
        <Route path="/chat/:friendId" element={<ChatView />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
      {!hideBottomNav && <BottomNav />}
    </>
  );
}

function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      fetchCurrentUser();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchCurrentUser = async () => {
    try {
      const response = await axios.get(`${API}/users/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(response.data);
    } catch (error) {
      console.error('Failed to fetch user:', error);
      localStorage.removeItem('token');
      setToken(null);
    } finally {
      setLoading(false);
    }
  };

  const login = (newToken, userData) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#F5E618] border-t-transparent" />
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      <BrowserRouter>
        <div className="App">
          {!user ? (
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          ) : (
            <>
              <Routes>
                <Route path="/" element={<Camera />} />
                <Route path="/stories" element={<Stories />} />
                <Route path="/chats" element={<Chats />} />
                <Route path="/chat/:friendId" element={<ChatView />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
              <BottomNav />
            </>
          )}
          <Toaster position="top-center" />
        </div>
      </BrowserRouter>
    </AuthContext.Provider>
  );
}

import React from 'react';
export default App;