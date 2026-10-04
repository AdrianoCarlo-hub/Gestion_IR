import api from './api';

export const lister = async () => {
  const { data } = await api.get('/paiements');
  return data;
};

export const parContribuable = async (id) => {
  const { data } = await api.get('/paiements/contribuable/' + id);
  return data;
};

export const enregistrer = async (payload) => {
  const { data } = await api.post('/paiements', payload);
  return data;
};

export const annuler = async (id, motif) => {
  const { data } = await api.post('/paiements/' + id + '/annuler', { motif });
  return data;
};
