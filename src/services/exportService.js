import api, { extractData, extractPaginated } from './api';

function normalizeFilters(filters = {}) {
  const formUuid = filters.formId || filters.formUuid || filters.form_uuid;
  const normalized = {
    ...filters,
    form_uuid: formUuid || undefined,
  };

  delete normalized.formId;
  delete normalized.formUuid;

  return Object.fromEntries(
    Object.entries(normalized).filter(([, value]) => value !== '' && value !== null && value !== undefined)
  );
}

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
    const payload = {
      ...data,
      filters: data.filters ? normalizeFilters(data.filters) : null,
    };
    const response = await api.post('/exports', payload);
    return extractData(response);
  },
};
