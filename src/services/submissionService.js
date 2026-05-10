import api, { extractData, extractPaginated } from './api';

function resolveIdentifier(data, aliases) {
  for (const alias of aliases) {
    if (data?.[alias]) return data[alias];
  }
  return null;
}

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
    const formUuid = resolveIdentifier(data, ['formId', 'formUuid', 'form_uuid']);
    const projectUuid = resolveIdentifier(data, ['projectId', 'projectUuid', 'project_uuid']);
    const externalId = resolveIdentifier(data, ['externalId', 'external_id']);
    const deviceMetadata = data.deviceMetadata || data.device_metadata;

    const formData = new FormData();
    formData.append('form_uuid', formUuid);
    formData.append('payload', JSON.stringify(data.payload));

    if (data.status) formData.append('status', data.status);
    if (projectUuid) formData.append('project_uuid', projectUuid);
    if (externalId) formData.append('external_id', externalId);
    if (deviceMetadata) formData.append('device_metadata', JSON.stringify(deviceMetadata));
    if (data.latitude) formData.append('latitude', String(data.latitude));
    if (data.longitude) formData.append('longitude', String(data.longitude));

    if (data.files && Array.isArray(data.files)) {
      data.files.forEach((file) => {
        formData.append(`files[${file.fieldKey || file.field_key}]`, file.file);
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
        formData.append(`files[${file.fieldKey || file.field_key}]`, file.file);
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
