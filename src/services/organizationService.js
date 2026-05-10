import api, { extractData, extractPaginated } from './api';

export const organizationService = {
  list: async (params = {}) => {
    const response = await api.get('/organizations', { params });
    return extractPaginated(response);
  },

  get: async (uuid) => {
    const response = await api.get(`/organizations/${uuid}`);
    return extractData(response);
  },

  create: async (data) => {
    const response = await api.post('/organizations', data);
    return extractData(response);
  },

  update: async (uuid, data) => {
    const response = await api.put(`/organizations/${uuid}`, data);
    return extractData(response);
  },

  delete: async (uuid) => {
    await api.delete(`/organizations/${uuid}`);
  },

  switch: async (uuid) => {
    const response = await api.post(`/organizations/${uuid}/switch`);
    return extractData(response);
  },

  users: async (uuid) => {
    const response = await api.get(`/organizations/${uuid}/users`);
    return extractData(response);
  },

  invite: async (uuid, data) => {
    const response = await api.post(`/organizations/${uuid}/invite`, data);
    return extractData(response);
  },
};
