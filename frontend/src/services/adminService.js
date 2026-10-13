import api from './api';

// --- Agents (ADMIN) ---
export const listerAgents = async () => {
  const { data } = await api.get('/agents');
  return data;
};

export const creerAgent = async (payload) => {
  const { data } = await api.post('/agents', payload);
  return data;
};

export const modifierAgent = async (id, payload) => {
  const { data } = await api.put('/agents/' + id, payload);
  return data;
};

export const changerStatutAgent = async (id, statut) => {
  const { data } = await api.patch('/agents/' + id + '/statut?statut=' + statut);
  return data;
};

export const reinitialiserMotDePasse = async (id, motDePasse) => {
  const { data } = await api.post('/agents/' + id + '/reinitialiser-mot-de-passe', { motDePasse });
  return data;
};

// --- Parametres fiscaux (ADMIN) ---
export const listerParametres = async () => {
  const { data } = await api.get('/parametres');
  return data;
};

export const modifierParametre = async (id, valeur) => {
  const { data } = await api.put('/parametres/' + id, { valeur });
  return data;
};

// --- Centres fiscaux ---
export const listerCentres = async () => {
  const { data } = await api.get('/centres');
  return data;
};
