import api from './api';

export const lister = async (annee) => {
  const params = {};
  if (annee) params.annee = annee;
  const { data } = await api.get('/declarations', { params });
  return data;
};

export const trouver = async (id) => {
  const { data } = await api.get('/declarations/' + id);
  return data;
};

export const listerParContribuable = async (idContribuable) => {
  const { data } = await api.get('/declarations/contribuable/' + idContribuable);
  return data;
};

export const listerCharges = async (id) => {
  const { data } = await api.get('/declarations/' + id + '/charges');
  return data;
};

export const creer = async (payload) => {
  const { data } = await api.post('/declarations', payload);
  return data;
};

export const modifierCaHt = async (id, caHt) => {
  const { data } = await api.put('/declarations/' + id + '/ca?caHt=' + caHt);
  return data;
};

export const ajouterCharge = async (id, charge) => {
  const { data } = await api.post('/declarations/' + id + '/charges', charge);
  return data;
};

export const supprimerCharge = async (idLigne) => {
  await api.delete('/declarations/charges/' + idLigne);
};

export const calculer = async (id, payload) => {
  const { data } = await api.post('/declarations/' + id + '/calculer', payload);
  return data;
};

export const valider = async (id) => {
  const { data } = await api.post('/declarations/' + id + '/valider');
  return data;
};

export const marquerPayee = async (id) => {
  const { data } = await api.post('/declarations/' + id + '/marquer-payee');
  return data;
};
