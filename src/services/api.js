import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'https://novacollect.onrender.com/api/v1';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 90000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export function extractData(response) {
  return response.data.data ?? response.data;
}

export function extractPaginated(response) {
  return {
    data: response.data.data ?? [],
    pagination: response.data.meta?.pagination ?? {},
  };
}

export function extractMessage(response) {
  return response.data.message ?? 'Operation successful.';
}

export function extractError(err) {
  if (err.response?.data?.message) {
    const parts = [err.response.data.message];
    const errors = err.response.data.errors;
    if (errors && typeof errors === 'object') {
      const fieldMessages = Object.values(errors).flat().filter(Boolean);
      if (fieldMessages.length > 0) {
        parts.push(fieldMessages.join('. '));
      }
    }
    return parts.join(' ');
  }
  if (err.code === 'ECONNABORTED') {
    return 'Server is taking too long to respond. The backend may be starting up — please try again.';
  }
  if (err.message === 'Network Error') {
    return 'Could not reach the server. The backend may be temporarily unavailable — please try again.';
  }
  return 'An unexpected error occurred.';
}

export default api;
