import { LuCircleCheck, LuCirclePause, LuCircleX, LuClock } from 'react-icons/lu';

const STATUTS = {
  ACTIF: { classe: 'actif', label: 'Actif', icone: LuCircleCheck },
  VEILLEUSE: { classe: 'suspendu', label: 'En veilleuse', icone: LuCirclePause },
  SUSPENDU: { classe: 'suspendu', label: 'Suspendu', icone: LuCirclePause },
  CESSE: { classe: 'cesse', label: 'Cesse', icone: LuCircleX },
  RADIE: { classe: 'radie', label: 'Radie', icone: LuCircleX },
};

/**
 * Bandeau du statut d'activite courant d'un contribuable.
 */
export default function StatutBanner({ statut = 'ACTIF', moisActifs = 12 }) {
  const info = STATUTS[statut] || STATUTS.ACTIF;
  const Icone = info.icone;

  return (
    <div className={'statut-banner statut-' + info.classe}>
      <div className="statut-banner-icon">
        <Icone className="icon" />
      </div>
      <div className="statut-banner-texte">
        <span className="statut-banner-label">Statut d activite</span>
        <strong className="statut-banner-valeur">{info.label}</strong>
      </div>
      <div className="statut-banner-mois">
        <LuClock className="icon" />
        <span>{moisActifs} mois actifs</span>
      </div>
    </div>
  );
}
