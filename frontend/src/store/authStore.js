import { create } from 'zustand';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

export const useAuthStore = create((set, get) => ({
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: false,
  
  setUser: (user) => set({ user, isAuthenticated: true }),
  
  setToken: (token) => {
    localStorage.setItem('token', token);
    set({ token });
  },
  
  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null, isAuthenticated: false });
  },
  
  register: async (userData) => {
    try {
      const response = await axios.post(`${API_URL}/auth/register`, userData);
      const { access_token, user } = response.data;
      get().setToken(access_token);
      get().setUser(user);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.detail || 'Registration failed' };
    }
  },
  
  login: async (credentials) => {
    try {
      const response = await axios.post(`${API_URL}/auth/login`, credentials);
      const { access_token, user } = response.data;
      get().setToken(access_token);
      get().setUser(user);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.detail || 'Login failed' };
    }
  },
  
  fetchUser: async () => {
    try {
      const token = get().token;
      if (!token) return;
      
      const response = await axios.get(`${API_URL}/users/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      get().setUser(response.data);
    } catch (error) {
      get().logout();
    }
  }
}));