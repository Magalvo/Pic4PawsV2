import axios from 'axios';

const petfinderProxyURL =
  import.meta.env.VITE_PETFINDER_PROXY_URL || '/.netlify/functions/petfinder';

export const getApiPets = async (params = {}) => {
  return axios.get(petfinderProxyURL, {
    params: {
      path: '/animals',
      ...params
    }
  });
};

export const getApiPet = async animalId => {
  return axios.get(petfinderProxyURL, {
    params: {
      path: `/animals/${animalId}`
    }
  });
};
