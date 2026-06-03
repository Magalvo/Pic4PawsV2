import { apiClient } from './client';

const baseURL = '/pets';

export const getPets = async () => {
  return apiClient.get(`${baseURL}/`);
};

export const getPet = async id => {
  return apiClient.get(`${baseURL}/${id}`);
};

export const createPet = async newPet => {
  return apiClient.post(`${baseURL}/`, newPet);
};

export const removePet = async id => {
  return apiClient.delete(`${baseURL}/${id}`);
};

export const editPet = async updatedPet => {
  return apiClient.put(`${baseURL}/${updatedPet._id}`, updatedPet);
};

export const upload = async uploadData => {
  return apiClient.post(`${baseURL}/upload`, uploadData);
};
