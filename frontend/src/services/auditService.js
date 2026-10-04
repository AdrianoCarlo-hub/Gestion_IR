import api from './api';

export const lister = async () => {
  const { data } = await api.get('/audit');
  return data;
};
