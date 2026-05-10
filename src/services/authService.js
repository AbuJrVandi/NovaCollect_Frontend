import api, { extractData, extractMessage } from './api';

export const authService = {
  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    const data = extractData(response);
    return {
      user: data.user ?? data,
      token: data.token,
    };
  },

  register: async (credentials) => {
    const response = await api.post('/auth/register', credentials);
    const data = extractData(response);
    return {
      user: data.user ?? data,
      token: data.token,
      organization_uuid: data.organization_uuid,
    };
  },

  logout: async () => {
    const response = await api.post('/auth/logout');
    return extractMessage(response);
  },

  profile: async () => {
    const response = await api.get('/auth/profile');
    return extractData(response);
  },

  updateProfile: async (data) => {
    const response = await api.put('/auth/profile', data);
    return extractData(response);
  },

  forgotPassword: async (email) => {
    const response = await api.post('/auth/forgot-password', { email });
    return extractMessage(response);
  },

  resetPassword: async (data) => {
    const response = await api.post('/auth/reset-password', data);
    return extractMessage(response);
  },
};
