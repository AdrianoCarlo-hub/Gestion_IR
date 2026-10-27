import api from './api';

export const lister = async () => {
  const { data } = await api.get('/paiements');
  return data;
};

// Detail du montant a regler avant enregistrement
export const recap = async (idDeclaration, typeReglement, date) => {
  const params = { typeReglement };
  if (date) params.date = date;
  const { data } = await api.get('/paiements/recap/' + idDeclaration, { params });
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
