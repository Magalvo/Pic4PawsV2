import axios from 'axios';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_BASE_URL
});

export const petfinderClient = axios.create({
  baseURL: import.meta.env.VITE_PET_URL
});

apiClient.interceptors.request.use(config => {
  const storedToken = localStorage.getItem('authToken');

  if (storedToken) {
    config.headers = {
      ...config.headers,
      Authorization: `Bearer ${storedToken}`
    };
  }

  return config;
});

export const getStoredUserId = () => localStorage.getItem('userId');
