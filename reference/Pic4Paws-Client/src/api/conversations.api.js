import { apiClient } from './client';

const baseURL = '/conversations';

export const userConversations = async userId => {
  return apiClient.get(`${baseURL}/${userId}`);
};

export const onlineConversations = async (currentId, userId) => {
  return apiClient.get(`${baseURL}/find/${currentId}/${userId}`);
};

export const createConversation = async receiverId => {
  return apiClient.post(`${baseURL}/`, { receiverId });
};
