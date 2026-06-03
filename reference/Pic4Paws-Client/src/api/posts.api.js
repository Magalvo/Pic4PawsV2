import { apiClient } from './client';

const baseURL = '/posts';

export const getAll = () => {
  return apiClient.get(`${baseURL}/`);
};

export const userPosts = userId => {
  return apiClient.get(`${baseURL}/${userId}`);
};

export const liking = async postId => {
  return apiClient.patch(`${baseURL}/${postId}/like`);
};

export const upload = uploadData => {
  return apiClient.post(`${baseURL}/upload`, uploadData);
};

export const addPost = formData => {
  return apiClient.post(`${baseURL}/create`, formData);
};

export const addComment = async (postId, commentText) => {
  try {
    return await apiClient.post(`${baseURL}/${postId}/comment`, {
      commentText: commentText
    });
  } catch (error) {
    console.error('Error creating comment:', error);
    throw error; // Rethrow the error to handle it in the calling function
  }
};
