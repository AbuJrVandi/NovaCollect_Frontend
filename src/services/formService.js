import api, { extractData, extractPaginated } from './api';

export const formService = {
  list: async (params = {}) => {
    const response = await api.get('/forms', { params });
    return extractPaginated(response);
  },

  get: async (uuid) => {
    const response = await api.get(`/forms/${uuid}`);
    return extractData(response);
  },

  create: async (data) => {
    const response = await api.post('/forms', data);
    return extractData(response);
  },

  update: async (uuid, data) => {
    const response = await api.put(`/forms/${uuid}`, data);
    return extractData(response);
  },

  delete: async (uuid) => {
    await api.delete(`/forms/${uuid}`);
  },

  publish: async (uuid) => {
    const response = await api.post(`/forms/${uuid}/publish`);
    return extractData(response);
  },

  draft: async (uuid) => {
    const response = await api.post(`/forms/${uuid}/draft`);
    return extractData(response);
  },

  archive: async (uuid) => {
    const response = await api.post(`/forms/${uuid}/archive`);
    return extractData(response);
  },

  addSection: async (formUuid, data) => {
    const response = await api.post(`/forms/${formUuid}/sections`, data);
    return extractData(response);
  },

  updateSection: async (formUuid, sectionId, data) => {
    const response = await api.put(`/forms/${formUuid}/sections/${sectionId}`, data);
    return extractData(response);
  },

  deleteSection: async (formUuid, sectionId) => {
    await api.delete(`/forms/${formUuid}/sections/${sectionId}`);
  },

  addField: async (formUuid, data) => {
    const response = await api.post(`/forms/${formUuid}/fields`, data);
    return extractData(response);
  },

  updateField: async (formUuid, fieldId, data) => {
    const response = await api.put(`/forms/${formUuid}/fields/${fieldId}`, data);
    return extractData(response);
  },

  deleteField: async (formUuid, fieldId) => {
    await api.delete(`/forms/${formUuid}/fields/${fieldId}`);
  },
};
