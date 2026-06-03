import { apiClient } from './client';

const baseURL = '/auth';

export const signup = async user => {
  return apiClient.post(`${baseURL}/register`, user);
};

export const signin = async user => {
  return apiClient.post(`${baseURL}/login`, user);
};

export const signupGoogle = user => {
  return apiClient.post(`${baseURL}/signup-google`, user);
};

export const upload = uploadData => {
  return apiClient.post(`${baseURL}/upload`, uploadData);
};
