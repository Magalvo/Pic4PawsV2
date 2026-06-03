import { apiClient } from './client';

const baseURL = '/messages';

export const userMessages = async conversationId => {
  return apiClient.get(`${baseURL}/${conversationId}`);
};

export const sendMessage = async message => {
  return apiClient.post(`${baseURL}/`, {
    message
  });
};
