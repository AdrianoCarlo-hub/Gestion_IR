import api from './api';

export const login = async (email, motDePasse) => {
  const { data } = await api.post('/auth/login', { email, motDePasse });
  return data;
};
