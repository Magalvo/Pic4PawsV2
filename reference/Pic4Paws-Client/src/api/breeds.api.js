import axios from 'axios';

const catURL = `https://api.thecatapi.com/v1`;
const dogURL = `https://api.thedogapi.com/v1`;

export const getCatBreed = async breedName => {
  return axios.get(`${catURL}/breeds/search?q=${breedName}`, {
    headers: {
      'x-api-key': import.meta.env.VITE_CAT_API
    }
  });
};

export const getDogBreed = async breedName => {
  return axios.get(`${dogURL}/breeds/search?q=${breedName}`, {
    headers: {
      'x-api-key': import.meta.env.VITE_DOG_API
    }
  });
};

export const getCatImages = async query_params => {
  return axios.get(`${catURL}/images/search`, {
    headers: {
      'x-api-key': import.meta.env.VITE_CAT_API
    },
    params: query_params
  });
};

export const getDogImages = async query_params => {
  return axios.get(`${dogURL}/images/search`, {
    headers: {
      'x-api-key': import.meta.env.VITE_DOG_API
    },
    params: query_params
  });
};
