import api, { extractData, extractPaginated } from './api';

export const submissionService = {
  list: async (params = {}) => {
    const response = await api.get('/submissions', { params });
    return extractPaginated(response);
  },

  get: async (uuid) => {
    const response = await api.get(`/submissions/${uuid}`);
    return extractData(response);
  },

  create: async (data) => {
    const formData = new FormData();
    formData.append('form_uuid', data.form_uuid);
    formData.append('payload', JSON.stringify(data.payload));

    if (data.status) formData.append('status', data.status);
    if (data.project_uuid) formData.append('project_uuid', data.project_uuid);
    if (data.external_id) formData.append('external_id', data.external_id);
    if (data.device_metadata) formData.append('device_metadata', JSON.stringify(data.device_metadata));
    if (data.latitude) formData.append('latitude', String(data.latitude));
    if (data.longitude) formData.append('longitude', String(data.longitude));

    if (data.files && Array.isArray(data.files)) {
      data.files.forEach((file) => {
        formData.append(`files[${file.field_key}]`, file.file);
      });
    }

    const response = await api.post('/submissions', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return extractData(response);
  },

  update: async (uuid, data) => {
    const formData = new FormData();
    formData.append('_method', 'PUT');
    if (data.payload) formData.append('payload', JSON.stringify(data.payload));
    if (data.status) formData.append('status', data.status);

    if (data.files && Array.isArray(data.files)) {
      data.files.forEach((file) => {
        formData.append(`files[${file.field_key}]`, file.file);
      });
    }

    const response = await api.post(`/submissions/${uuid}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return extractData(response);
  },

  delete: async (uuid) => {
    await api.delete(`/submissions/${uuid}`);
  },
};
