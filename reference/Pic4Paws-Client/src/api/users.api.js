import { apiClient } from './client';

export const baseURL = '/users';

export const findEmail = async userEmail => {
  return apiClient.get(`${baseURL}/`, {
    params: { userEmail }
  });
};

export const getId = async userId => {
  return apiClient.get(`${baseURL}/${userId}`);
};

export const getUserFriends = async userId => {
  return apiClient.get(`${baseURL}/${userId}/friends`);
};

export const patchingFriend = async (userId, friendId) => {
  return apiClient.patch(`${baseURL}/${userId}/${friendId}`);
};

export const editUser = async updatedUser => {
  return apiClient.put(`${baseURL}/${updatedUser._id}`, updatedUser);
};
