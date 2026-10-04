import api from './api';

export const lister = async (filtres = {}) => {
  const params = {};
  if (filtres.motCle) params.motCle = filtres.motCle;
  if (filtres.statut) params.statut = filtres.statut;
  if (filtres.idSecteur) params.idSecteur = filtres.idSecteur;
  const { data } = await api.get('/contribuables', { params });
  return data;
};

export const trouver = async (id) => {
  const { data } = await api.get('/contribuables/' + id);
  return data;
};

export const creer = async (payload) => {
  const { data } = await api.post('/contribuables', payload);
  return data;
};

export const modifier = async (id, payload) => {
  const { data } = await api.put('/contribuables/' + id, payload);
  return data;
};

export const changerStatut = async (id, statut) => {
  const { data } = await api.patch('/contribuables/' + id + '/statut?statut=' + statut);
  return data;
};
