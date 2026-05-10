import { create } from 'zustand';

const useAppStore = create((set) => ({
  sidebarOpen: true,
  notifications: [],
  toasts: [],
  loading: false,

  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),

  setNotifications: (notifications) => set({ notifications }),

  addToast: (toast) => {
    const id = Date.now();
    set((s) => ({ toasts: [...s.toasts, { ...toast, id }] }));
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
    }, toast.duration || 5000);
  },

  removeToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

  setLoading: (loading) => set({ loading }),
}));

export default useAppStore;
