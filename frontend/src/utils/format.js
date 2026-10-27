export function formatAr(valeur) {
  if (valeur === null || valeur === undefined || Number.isNaN(Number(valeur))) return '-';
  return new Intl.NumberFormat('fr-FR').format(Number(valeur)) + ' Ar';
}

export function formatNombre(valeur) {
  if (valeur === null || valeur === undefined || Number.isNaN(Number(valeur))) return '-';
  return new Intl.NumberFormat('fr-FR').format(Number(valeur));
}

export function formatDate(valeur) {
  if (!valeur) return '-';
  const d = typeof valeur === 'string' ? new Date(valeur) : valeur;
  if (Number.isNaN(d.getTime())) return valeur;
  return d.toLocaleDateString('fr-FR');
}

export const STATUT_DECLARATION = {
  BROUILLON: { couleur: 'default', libelle: 'Brouillon' },
  CALCULEE: { couleur: 'processing', libelle: 'Calculee' },
  VALIDEE: { couleur: 'blue', libelle: 'Validee' },
  PAYEE: { couleur: 'success', libelle: 'Payee' },
  EN_RETARD: { couleur: 'error', libelle: 'En retard' },
};

export const STATUT_ACOMPTE = {
  A_PAYER: { couleur: 'orange', libelle: 'A payer' },
  PROVISIONNEL: { couleur: 'blue', libelle: 'Provisionnel' },
  PAYE: { couleur: 'success', libelle: 'Paye' },
  EN_RETARD: { couleur: 'error', libelle: 'En retard' },
  SUSPENDU: { couleur: 'default', libelle: 'Suspendu' },
  ANNULE: { couleur: 'default', libelle: 'Annule' },
};

export const STATUT_PENALITE = {
  DUE: { couleur: 'error', libelle: 'Due' },
  PAYEE: { couleur: 'success', libelle: 'Payee' },
  ANNULEE: { couleur: 'default', libelle: 'Annulee' },
  EN_DEMANDE_REMISE: { couleur: 'warning', libelle: 'Remise demandee' },
};

export const TYPE_PENALITE = {
  AMENDE_DEPOT: 'Amende de depot',
  INTERET_RETARD: 'Interets de retard',
  INTERET_RETARD_ACOMPTE: 'Interets acompte',
  MAJORATION: 'Majoration',
  AMENDE_SPECIFIQUE: 'Amende specifique',
};
