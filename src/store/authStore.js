import { create } from 'zustand';
import { authService } from '../services/authService';
import { extractError } from '../services/api';

const useAuthStore = create((set, get) => ({
  user: null,
  token: localStorage.getItem('auth_token') || null,
  isAuthenticated: !!localStorage.getItem('auth_token'),
  loading: false,
  error: null,

  login: async (credentials) => {
    set({ loading: true, error: null });
    try {
      const result = await authService.login(credentials);
      localStorage.setItem('auth_token', result.token);
      set({ token: result.token, user: result.user, isAuthenticated: true, loading: false });
      return result;
    } catch (err) {
      set({ error: extractError(err), loading: false });
      throw err;
    }
  },

  register: async (credentials) => {
    set({ loading: true, error: null });
    try {
      const result = await authService.register(credentials);
      localStorage.setItem('auth_token', result.token);
      set({ token: result.token, user: result.user, isAuthenticated: true, loading: false });
      return result;
    } catch (err) {
      set({ error: extractError(err), loading: false });
      throw err;
    }
  },

  fetchProfile: async () => {
    try {
      const user = await authService.profile();
      set({ user, isAuthenticated: true });
      return user;
    } catch {
      get().logout();
    }
  },

  logout: async () => {
    try {
      await authService.logout();
    } catch {
      // proceed with local logout
    }
    localStorage.removeItem('auth_token');
    set({ user: null, token: null, isAuthenticated: false });
    window.location.href = '/login';
  },

  clearError: () => set({ error: null }),
}));

export default useAuthStore;
