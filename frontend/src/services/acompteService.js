import api from './api';

export const lister = async () => {
  const { data } = await api.get('/acomptes');
  return data;
};

export const parContribuable = async (id) => {
  const { data } = await api.get('/acomptes/contribuable/' + id);
  return data;
};

export const parStatut = async (statut) => {
  const { data } = await api.get('/acomptes/statut/' + statut);
  return data;
};
