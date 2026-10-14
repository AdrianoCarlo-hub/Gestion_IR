import { LuCalendar, LuCirclePause, LuCirclePlay, LuCircleCheck, LuClock3 } from 'react-icons/lu';

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
export default function AcompteCard({
  acompte,
  echeancesDetail,
  onSuspendre,
  onReactiver,
  onPayer,
}) {
  if (!acompte) return null;

  const statut = acompte.statut || 'A_PAYER';
  const badgeClass = statut === 'PAYE' ? 'actif'
    : statut === 'SUSPENDU' ? 'suspendu'
    : statut === 'EN_RETARD' ? 'radie'
    : 'a_payer';

  return (
    <article className={'acompte-card acompte-statut-' + statut.toLowerCase()}>
      <header className="acompte-card-header">
        <div className="acompte-card-heading">
          <span className="acompte-card-icon"><LuCalendar aria-hidden="true" /></span>
          <div>
            <span className="acompte-card-overline">Echeance {acompte.numero === 1 ? '1' : '2'}</span>
            <h3 className="acompte-card-title">Acompte n° {acompte.numero} — {acompte.annee}</h3>
          </div>
        </div>
        <span className={'badge badge-' + badgeClass}>{LABELS[statut] || statut}</span>
      </header>

      <div className="acompte-card-body">
        <div className="acompte-detail-ligne">
          <span>Base IR {acompte.annee - 1}</span>
          <strong>{fmt(acompte.baseIrN1)} Ar</strong>
        </div>
        <div className="acompte-detail-ligne">
          <span>Taux</span>
          <strong>{acompte.tauxPct} %</strong>
        </div>
        <div className="acompte-detail-ligne acompte-montant">
          <span>Montant de l'acompte</span>
          <strong>{fmt(acompte.montantAr)} Ar</strong>
        </div>
        <div className="acompte-detail-ligne acompte-date">
          <span><LuClock3 aria-hidden="true" /> Date limite</span>
          <strong>{acompte.dateEcheance || '-'}</strong>
        </div>
        {acompte.numero === 1 && echeancesDetail && (
          <div className="acompte-total-ligne">
            <span>Solde IR {acompte.annee - 1} + acompte 1 au 15 mai</span>
            <strong>{fmt(echeancesDetail.total)} Ar</strong>
          </div>
        )}
      </div>

      <footer className="acompte-card-footer">
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
      </footer>
    </article>
  );
}
