import api from './api';

export const parContribuable = async (id) => {
  const { data } = await api.get('/suspensions/contribuable/' + id);
  return data;
};

export const situation = async (idContribuable) => {
  const { data } = await api.get('/suspensions/situation/' + idContribuable);
  return data;
};

export const changerStatut = async (idContribuable, statut, idAgent, details = {}) => {
  const { data } = await api.post('/suspensions/contribuable/' + idContribuable + '/statut', {
    statut,
    idAgent,
    ...details,
  });
  return data;
};

export const simuler = async (idContribuable, dateArret) => {
  const params = {};
  if (dateArret) params.dateArret = dateArret;
  const { data } = await api.get('/suspensions/simuler/' + idContribuable, { params });
  return data;
};

export const declarerArret = async (payload) => {
  const { data } = await api.post('/suspensions/arret', payload);
  return data;
};

export const declarerVeilleuse = async (payload) => {
  const { data } = await api.post('/suspensions/veilleuse', payload);
  return data;
};

export const declarerCessation = async (payload) => {
  const { data } = await api.post('/suspensions/cessation', payload);
  return data;
};

export const declarerReprise = async (id, payload) => {
  const { data } = await api.post('/suspensions/' + id + '/reprise', payload);
  return data;
};

export const attestationRadiation = async (id) => {
  const { data } = await api.post('/suspensions/' + id + '/attestation-radiation');
  return data;
};

export const annuler = async (id) => {
  const { data } = await api.post('/suspensions/' + id + '/annuler');
  return data;
};
