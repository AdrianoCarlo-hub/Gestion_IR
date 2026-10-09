import api from './api';

export const resume = async () => {
  const { data } = await api.get('/statistiques/resume');
  return data;
};

export const parAnnee = async () => {
  const { data } = await api.get('/statistiques/par-annee');
  return data;
};

export const parSecteur = async () => {
  const { data } = await api.get('/statistiques/par-secteur');
  return data;
};

export const parStatut = async () => {
  const { data } = await api.get('/statistiques/par-statut');
  return data;
};

export const alertes = async () => {
  const { data } = await api.get('/statistiques/alertes');
  return data;
};
