import api from './api';

export const lister = async () => {
  const { data } = await api.get('/deficits');
  return data;
};

export const parContribuable = async (id) => {
  const { data } = await api.get('/deficits/contribuable/' + id);
  return data;
};

export const creer = async (payload) => {
  const { data } = await api.post('/deficits', payload);
  return data;
};
