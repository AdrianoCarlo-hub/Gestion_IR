import { useState } from 'react';
import { LuChevronDown, LuChevronRight, LuCalculator } from 'react-icons/lu';

const fmt = (n) => (n == null ? '0' : Number(n).toLocaleString('fr-FR').replace(/\u202f|\u00a0/g, ' '));

const STATUT_BADGE = {
  DUE: 'radie',
  PAYEE: 'actif',
  ANNULEE: 'cesse',
  EN_DEMANDE_REMISE: 'info',
};

/**
 * Accordion de decompte detaille d'une penalite (formule + article + dates).
 */
export default function DecompteDetail({ detail }) {
  const [ouvert, setOuvert] = useState(false);

  return (
    <div className={'decompte-panel' + (ouvert ? ' ouvert' : '')}>
      <button className="decompte-head" onClick={() => setOuvert((o) => !o)}>
        {ouvert ? <LuChevronDown className="icon" /> : <LuChevronRight className="icon" />}
        <span className="decompte-type">{detail.type}</span>
        {detail.motif && <span className="decompte-motif">{detail.motif}</span>}
        <span className={'badge badge-' + (STATUT_BADGE[detail.statut] || 'info')}>{detail.statut}</span>
        <strong className="decompte-montant">{fmt(detail.montantAr)} Ar</strong>
      </button>

      {ouvert && (
        <div className="decompte-body">
          <div className="decompte-formule">
            <LuCalculator className="icon" />
            <code>{detail.formule}</code>
          </div>
          <div className="decompte-meta">
            {detail.baseCalculAr != null && (
              <span><b>Base :</b> {fmt(detail.baseCalculAr)} Ar</span>
            )}
            {detail.tauxPct != null && <span><b>Taux :</b> {detail.tauxPct} %</span>}
            {detail.nbMois != null && detail.nbMois > 0 && (
              <span><b>Retard :</b> {detail.nbMois} mois</span>
            )}
            {detail.dateLimite && <span><b>Echeance :</b> {detail.dateLimite}</span>}
            {detail.articleRef && <span><b>Article :</b> {detail.articleRef}</span>}
            {detail.motifAnnulation && (
              <span><b>Motif annulation :</b> {detail.motifAnnulation}</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
