import api, { extractData, extractPaginated } from './api';

export const projectService = {
  list: async (params = {}) => {
    const response = await api.get('/projects', { params });
    return extractPaginated(response);
  },

  get: async (uuid) => {
    const response = await api.get(`/projects/${uuid}`);
    return extractData(response);
  },

  create: async (data) => {
    const response = await api.post('/projects', data);
    return extractData(response);
  },

  update: async (uuid, data) => {
    const response = await api.put(`/projects/${uuid}`, data);
    return extractData(response);
  },

  delete: async (uuid) => {
    await api.delete(`/projects/${uuid}`);
  },

  createTask: async (projectUuid, data) => {
    const response = await api.post(`/projects/${projectUuid}/tasks`, data);
    return extractData(response);
  },

  updateTask: async (taskUuid, data) => {
    const response = await api.put(`/tasks/${taskUuid}`, data);
    return extractData(response);
  },

  deleteTask: async (taskUuid) => {
    await api.delete(`/tasks/${taskUuid}`);
  },
};
