import api, { extractData, extractPaginated } from './api';

export const notificationService = {
  list: async (params = {}) => {
    const response = await api.get('/notifications', { params });
    return extractPaginated(response);
  },

  unreadCount: async () => {
    const response = await api.get('/notifications/unread-count');
    return extractData(response);
  },

  markRead: async (notificationId) => {
    const response = await api.post(`/notifications/${notificationId}/read`);
    return extractData(response);
  },

  markAllRead: async () => {
    const response = await api.post('/notifications/read-all');
    return extractData(response);
  },

  delete: async (notificationId) => {
    await api.delete(`/notifications/${notificationId}`);
  },
};
