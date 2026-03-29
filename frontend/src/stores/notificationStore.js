import { create } from 'zustand';
import api from '../api/axios';
import { useAuthStore } from './authStore';

export const useNotificationStore = create((set, get) => ({
  notifications: [],
  total: 0,
  loading: false,
  page: 1,
  lastPage: 1,
  _pollId: null,

  // fetch notifications; page=1 replaces, page>1 appends
  fetch: async (page = 1, append = false) => {
    set({ loading: true });
    try {
      // don't attempt to fetch if we're not authenticated
      const auth = useAuthStore.getState();
      if (!auth || !auth.isAuthenticated) {
        set({ loading: false });
        return;
      }

      const res = await api.get(`/notifications?page=${page}`);
      const data = res.data;
      const items = data.data || data;
      if (append && page > 1) {
        set((s) => ({ notifications: [...(s.notifications || []), ...items], total: data.total || s.total, page: data.current_page || page, lastPage: data.last_page || s.lastPage }));
      } else {
        set({ notifications: items, total: data.total || 0, page: data.current_page || 1, lastPage: data.last_page || 1 });
      }
    } catch (e) {
      // if unauthorized, force logout so app state is consistent
      if (e?.response?.status === 401) {
        try {
          useAuthStore.getState().logout();
        } catch (_err) {
          // ignore
        }
        set({ loading: false });
        return;
      }
      console.error('Failed to load notifications', e);
    } finally {
      set({ loading: false });
    }
  },

  markRead: async (id) => {
    const prev = get().notifications;
    try {
      // optimistic update: mark locally first
      set((s) => ({ notifications: s.notifications.map(n => n.id === id ? { ...n, read_at: n.read_at || new Date().toISOString() } : n) }));
      await api.put(`/notifications/${id}/read`);
      // keep local state; optionally you could refresh the list
    } catch (e) {
      // if unauthorized, logout to clear invalid token
      if (e?.response?.status === 401) {
        try { useAuthStore.getState().logout(); } catch (_err) {}
      }
      console.error('Failed to mark notification read', e);
      // revert on failure
      set({ notifications: prev });
    }
  },

  markAll: async () => {
    const prev = get().notifications;
    try {
      // optimistic: mark all locally
      set((s) => ({ notifications: s.notifications.map(n => ({ ...n, read_at: n.read_at || new Date().toISOString() })) }));
      await api.put('/notifications/mark-all-read');
    } catch (e) {
      if (e?.response?.status === 401) {
        try { useAuthStore.getState().logout(); } catch (_err) {}
      }
      console.error('Failed to mark all notifications read', e);
      // revert on failure
      set({ notifications: prev });
    }
  },

  startPolling: (interval = 30000) => {
    // avoid double polling
    if (get()._pollId) return;
    const id = setInterval(() => get().fetch(), interval);
    set({ _pollId: id });
  },

  stopPolling: () => {
    const id = get()._pollId;
    if (id) clearInterval(id);
    set({ _pollId: null });
  }
}));
