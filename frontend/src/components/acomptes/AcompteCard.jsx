import { LuCalendar, LuCirclePause, LuCirclePlay, LuCircleCheck } from 'react-icons/lu';

const fmt = (n) => (n == null ? '0' : Number(n).toLocaleString('fr-FR').replace(/\u202f|\u00a0/g, ' '));

const LABELS = {
  A_PAYER: 'A payer',
  PAYE: 'Paye',
  EN_RETARD: 'En retard',
  SUSPENDU: 'Suspendu',
};

/**
 * Carte d'un acompte provisionnel (echeance 15 mai / 15 novembre) avec
 * badge de statut et action de suspension / reactivation / reglement.
 */
export default function AcompteCard({ acompte, onSuspendre, onReactiver, onPayer }) {
  if (!acompte) return null;

  const statut = acompte.statut || 'A_PAYER';
  const badgeClass = statut === 'PAYE' ? 'actif'
    : statut === 'SUSPENDU' ? 'suspendu'
    : statut === 'EN_RETARD' ? 'radie'
    : 'a_payer';

  return (
    <div className={'acompte-card acompte-statut-' + statut.toLowerCase()}>
      <div className="acompte-card-head">
        <span className="acompte-card-title">
          <LuCalendar className="icon" />
          Acompte n° {acompte.numero} - {acompte.annee}
        </span>
        <span className={'badge badge-' + badgeClass}>{LABELS[statut] || statut}</span>
      </div>

      <div className="acompte-card-body">
        <div className="acompte-line">
          <span>Base IR N-1</span>
          <strong>{fmt(acompte.baseIrN1)} Ar</strong>
        </div>
        <div className="acompte-line">
          <span>Taux</span>
          <strong>{acompte.tauxPct} %</strong>
        </div>
        <div className="acompte-line">
          <span>Montant</span>
          <strong>{fmt(acompte.montantAr)} Ar</strong>
        </div>
        <div className="acompte-line">
          <span>Echeance</span>
          <strong>{acompte.dateEcheance || '-'}</strong>
        </div>
      </div>

      <div className="acompte-card-actions">
        {statut !== 'PAYE' && statut !== 'SUSPENDU' && (
          <button className="btn btn-secondary" onClick={() => onSuspendre && onSuspendre(acompte)}>
            <LuCirclePause className="icon" />
            Demander suspension
          </button>
        )}
        {statut === 'SUSPENDU' && (
          <button className="btn btn-validate" onClick={() => onReactiver && onReactiver(acompte)}>
            <LuCirclePlay className="icon" />
            Reactiver
          </button>
        )}
        {statut !== 'PAYE' && (
          <button className="btn btn-primary" onClick={() => onPayer && onPayer(acompte)}>
            <LuCircleCheck className="icon" />
            Regler
          </button>
        )}
      </div>
    </div>
  );
}
