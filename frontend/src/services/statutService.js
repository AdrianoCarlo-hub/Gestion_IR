import api from './api';

export const changerStatutContribuable = async (id, statut) => {
  const { data } = await api.patch('/contribuables/' + id + '/statut?statut=' + statut);
  return data;
};

export const changerStatutDeclaration = async (id, statut) => {
  const { data } = await api.patch('/declarations/' + id + '/statut', { statut });
  return data;
};

export const changerStatutAcompte = async (id, statut) => {
  const { data } = await api.patch('/acomptes/' + id + '/statut', { statut });
  return data;
};

export const changerStatutPenalite = async (id, statut) => {
  const { data } = await api.patch('/penalites/' + id + '/statut', { statut });
  return data;
};
