import api from './api';

export const parDeclaration = async (idDeclaration) => {
  const { data } = await api.get('/penalites/declaration/' + idDeclaration);
  return data;
};

export const calculerAmende = async (idDeclaration, dateDepot) => {
  const { data } = await api.post('/penalites/amende-depot',
    { idDeclaration, dateDepot });
  return data;
};

export const calculerInteret = async (idDeclaration, datePaiement) => {
  const { data } = await api.post('/penalites/interet-retard',
    { idDeclaration, datePaiement });
  return data;
};

export const annuler = async (id) => {
  const { data } = await api.post('/penalites/' + id + '/annuler');
  return data;
};
