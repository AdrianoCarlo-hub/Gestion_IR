import api from './api';

export const resume = async () => {
  const { data } = await api.get('/statistiques/resume');
  return data;
};
