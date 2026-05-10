import api, { extractData, extractPaginated } from './api';

export const exportService = {
  list: async (params = {}) => {
    const response = await api.get('/exports', { params });
    return extractPaginated(response);
  },

  get: async (uuid) => {
    const response = await api.get(`/exports/${uuid}`);
    return extractData(response);
  },

  create: async (data) => {
    const response = await api.post('/exports', data);
    return extractData(response);
  },
};
