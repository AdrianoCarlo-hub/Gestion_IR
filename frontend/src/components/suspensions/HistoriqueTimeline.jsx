import { LuCirclePause, LuCirclePlay, LuCircleX } from 'react-icons/lu';

const ICONES = {
  VEILLEUSE: LuCirclePause,
  CESSATION: LuCircleX,
  REPRISE: LuCirclePlay,
};

const LABELS = {
  VEILLEUSE: 'Mise en veilleuse',
  CESSATION: 'Cessation definitive',
  REPRISE: "Reprise d activite",
};

const STATUTS = {
  EN_COURS: 'En cours',
  TERMINEE: 'Terminee',
  ANNULEE: 'Annulee',
};

const MOTIFS = {
  MANQUE_ACTIVITE: "Manque d'activite",
  TRAVAUX: 'Travaux',
  SAISON: 'Activite saisonniere',
  DIFFICULTE_FINANCIERE: 'Difficulte financiere',
  REORGANISATION: 'Reorganisation',
  AUTRE: 'Autre',
};

const formatDate = (date) => {
  if (!date) return '';
  const [annee, mois, jour] = date.split('-').map(Number);
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(annee, mois - 1, jour));
};

/**
 * Timeline verticale de l'historique des arrets / reprises d'un contribuable.
 */
export default function HistoriqueTimeline({ historique = [] }) {
  if (!historique.length) {
    return (
      <div className="empty-state" style={{ padding: 24 }}>
        <p>Aucun evenement enregistre</p>
      </div>
    );
  }

  return (
    <ul className="timeline">
      {historique.map((h) => {
        const type = h.typeEvenement || 'VEILLEUSE';
        const Icone = ICONES[type] || LuCirclePause;
        const libelleEvenement = h.dateReprise
          ? "Arret puis reprise d'activite"
          : LABELS[type] || type;
        return (
          <li key={h.idSuspension} className={'timeline-item timeline-' + type.toLowerCase()}>
            <span className="timeline-marker"><Icone className="icon" /></span>
            <div className="timeline-content">
              <div className="timeline-head">
                <strong>{libelleEvenement}</strong>
                <span className={'badge badge-' + (h.statut === 'EN_COURS' ? 'suspendu' : 'actif')}>
                  {STATUTS[h.statut] || h.statut}
                </span>
              </div>
              <div className="timeline-meta">
                {h.dateArret && (
                  <span><strong>Arrêt de l’activité :</strong> {formatDate(h.dateArret)}</span>
                )}
                {h.dateReprise && (
                  <span><strong>Reprise de l’activité :</strong> {formatDate(h.dateReprise)}</span>
                )}
                {h.motif && <span><strong>Motif :</strong> {MOTIFS[h.motif] || h.motif}</span>}
                {h.dateLimiteDeclaration && (
                  <span><strong>Date limite de declaration :</strong> {formatDate(h.dateLimiteDeclaration)}</span>
                )}
                {h.agentArret && <span>Enregistré par : {h.agentArret}</span>}
                {h.agentReprise && <span>Reprise enregistrée par : {h.agentReprise}</span>}
                {h.attestationRadiationNumero && (
                  <span>Attestation : {h.attestationRadiationNumero}</span>
                )}
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
