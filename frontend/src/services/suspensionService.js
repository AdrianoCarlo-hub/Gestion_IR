import api from './api';

export const parContribuable = async (id) => {
  const { data } = await api.get('/suspensions/contribuable/' + id);
  return data;
};

export const declarerArret = async (payload) => {
  const { data } = await api.post('/suspensions/arret', payload);
  return data;
};

export const declarerReprise = async (id, payload) => {
  const { data } = await api.post('/suspensions/' + id + '/reprise', payload);
  return data;
};

export const annuler = async (id) => {
  const { data } = await api.post('/suspensions/' + id + '/annuler');
  return data;
};
