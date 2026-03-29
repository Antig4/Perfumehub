import { create } from 'zustand';
import api from '../api/axios';

export const useAuthStore = create((set, get) => ({
  user: null,
  token: localStorage.getItem('token') || null,
  isAuthenticated: !!localStorage.getItem('token'),
  isLoading: false,

  setAuth: (user, token) => {
    localStorage.setItem('token', token);
    set({ user, token, isAuthenticated: true });
  },

  logout: async () => {
    try {
      if (get().token) {
        await api.post('/logout');
      }
    } catch (e) {
      console.error(e);
    } finally {
      localStorage.removeItem('token');
      set({ user: null, token: null, isAuthenticated: false });
    }
  },

  fetchUser: async () => {
    if (!get().token) return;
    set({ isLoading: true });
    try {
      const response = await api.get('/me');
      // backend returns { user: { ... } }
      const serverUser = response.data?.user || response.data || null;
      set({ user: serverUser, isAuthenticated: true });
    } catch (error) {
      localStorage.removeItem('token');
      set({ user: null, token: null, isAuthenticated: false });
    } finally {
      set({ isLoading: false });
    }
  }
}));
