import api from './api';

export const getSituationFiscale = async (idContribuable) => {
  const { data } = await api.get('/contribuables/' + idContribuable + '/situation-fiscale');
  return data;
};
