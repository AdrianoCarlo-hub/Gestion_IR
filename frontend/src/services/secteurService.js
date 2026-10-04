import api from './api';

const SECTEURS_STATIQUES = [
  { idSecteur: 1, code: 'AGRICOLE', libelle: 'Agricole' },
  { idSecteur: 2, code: 'ARTISANAL', libelle: 'Artisanal' },
  { idSecteur: 3, code: 'INDUSTRIEL', libelle: 'Industriel' },
  { idSecteur: 4, code: 'MINIER', libelle: 'Minier' },
  { idSecteur: 5, code: 'HOTELIER', libelle: 'Hotelier' },
  { idSecteur: 6, code: 'TOURISTIQUE', libelle: 'Touristique' },
  { idSecteur: 7, code: 'COMMERCE', libelle: 'Commerce' },
  { idSecteur: 8, code: 'SERVICES', libelle: 'Services' },
  { idSecteur: 9, code: 'CARBURANT', libelle: 'Vente de carburants' },
  { idSecteur: 10, code: 'SANTE', libelle: 'Sante' },
  { idSecteur: 11, code: 'EDUCATION', libelle: 'Education' },
];

export const listerSecteurs = async () => {
  try {
    const { data } = await api.get('/secteurs');
    return data;
  } catch {
    return SECTEURS_STATIQUES;
  }
};
