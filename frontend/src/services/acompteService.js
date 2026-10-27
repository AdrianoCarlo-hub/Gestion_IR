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

export const getSituation = async (idContribuable, annee) => {
  const params = {};
  if (annee) params.annee = annee;
  const { data } = await api.get('/acomptes/situation/' + idContribuable, { params });
  return data;
};

// Tableau des acomptes : une ligne par annee du contribuable
export const situationParAnnee = async (idContribuable) => {
  const { data } = await api.get('/acomptes/par-annee/' + idContribuable);
  return data;
};

export const getEcheances = async (idContribuable, annee) => {
  const { data } = await api.get('/acomptes/echeances/' + idContribuable + '/' + annee);
  return data;
};

export const getChronologie = async (idContribuable) => {
  const { data } = await api.get('/acomptes/echeances/chronologie/' + idContribuable);
  return data;
};

export const enregistrerDouane = async (payload) => {
  const { data } = await api.post('/acomptes/douane', payload);
  return data;
};

export const suspendre = async (id) => {
  const { data } = await api.post('/acomptes/' + id + '/suspendre');
  return data;
};

export const reactiver = async (id) => {
  const { data } = await api.post('/acomptes/' + id + '/reactiver');
  return data;
};

export const changerStatut = async (id, statut) => {
  const { data } = await api.patch('/acomptes/' + id + '/statut', { statut });
  return data;
};
