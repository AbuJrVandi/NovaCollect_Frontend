import api, { extractData } from './api';

export const analyticsService = {
  get: async () => {
    const response = await api.get('/analytics');
    return extractData(response);
  },

  dashboardStats: async () => {
    const response = await api.get('/dashboard/stats');
    return extractData(response);
  },
};
