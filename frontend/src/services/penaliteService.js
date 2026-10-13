import api from './api';

export const parDeclaration = async (idDeclaration) => {
  const { data } = await api.get('/penalites/declaration/' + idDeclaration);
  return data;
};

export const situation = async (idContribuable, annee) => {
  const params = {};
  if (annee) params.annee = annee;
  const { data } = await api.get('/penalites/situation/' + idContribuable, { params });
  return data;
};

export const calculerAmende = async (idDeclaration, dateDepot) => {
  const { data } = await api.post('/penalites/amende-depot',
    { idDeclaration, dateDepot });
  return data;
};

export const calculerDepot = async (idDeclaration, dateDepot) => {
  const { data } = await api.post('/penalites/calculer-depot/' + idDeclaration,
    { dateDepot });
  return data;
};

export const calculerMajoration = async (idDeclaration, datePaiement) => {
  const { data } = await api.post('/penalites/calculer-majoration/' + idDeclaration,
    { datePaiement });
  return data;
};

export const calculerInteret = async (idDeclaration, datePaiement) => {
  const { data } = await api.post('/penalites/interet-retard',
    { idDeclaration, datePaiement });
  return data;
};

export const specifique = async (idDeclaration, motif, complementImpot) => {
  const { data } = await api.post('/penalites/specifique/' + idDeclaration,
    { motif, complementImpot });
  return data;
};

export const remiseGracieuse = async (id, motif, justificatif) => {
  const { data } = await api.post('/penalites/' + id + '/remise-gracieuse',
    { motif, justificatif });
  return data;
};

export const deciderRemise = async (id, accordee, decision, idAgent) => {
  const { data } = await api.post('/penalites/' + id + '/decider-remise',
    { accordee, decision, idAgent });
  return data;
};

export const annuler = async (id, motif) => {
  const { data } = await api.post('/penalites/' + id + '/annuler', { motif });
  return data;
};

export const changerStatut = async (id, statut) => {
  const { data } = await api.patch('/penalites/' + id + '/statut', { statut });
  return data;
};
