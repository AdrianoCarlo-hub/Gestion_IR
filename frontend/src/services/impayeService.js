import api from './api';

export const lister = async (annee) => {
  const params = {};
  if (annee) params.annee = annee;
  const { data } = await api.get('/declarations/impayees', { params });
  return data;
};
