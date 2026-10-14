import { useMemo, useState } from 'react';
import { LuX, LuShip } from 'react-icons/lu';

const fmt = (n) => (n == null ? '0' : Number(n).toLocaleString('fr-FR').replace(/\u202f|\u00a0/g, ' '));
const today = new Date().toISOString().slice(0, 10);

/**
 * Modal de saisie d'une quittance de douane (retenue AIRS).
 * Le montant est calcule automatiquement : valeur CAF x taux (2 % par defaut).
 */
export default function AcompteDouaneModal({ ouvert, taux = 2, onFermer, onValider, enCours }) {
  const [ref, setRef] = useState('');
  const [caf, setCaf] = useState('');
  const [date, setDate] = useState(today);

  const montant = useMemo(() => {
    const v = Number(caf);
    if (!v || v <= 0) return 0;
    return Math.round(v * (taux / 100));
  }, [caf, taux]);

  if (!ouvert) return null;

  const valider = (event) => {
    event?.preventDefault();
    if (!ref.trim() || !caf || Number(caf) <= 0) return;
    onValider && onValider({
      referenceDouane: ref.trim(),
      valeurCaf: Number(caf),
      date,
    });
    setRef('');
    setCaf('');
    setDate(today);
  };

  return (
    <div className="modal-overlay visible acomptes-modal-overlay" onClick={onFermer}>
      <div
        className="modal-box legal-modal acomptes-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="acompte-douane-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="modal-header acomptes-modal-header">
          <span className="acompte-modal-icon"><LuShip aria-hidden="true" /></span>
          <div>
            <span className="acompte-modal-eyebrow">Retenue AIRS · {taux} %</span>
            <h3 id="acompte-douane-title">Quittance de douane</h3>
          </div>
          <button type="button" className="btn-icon" onClick={onFermer} aria-label="Fermer">
            <LuX className="icon" />
          </button>
        </header>
        <form onSubmit={valider}>
          <div className="modal-body acomptes-modal-body">
            <div className="form-group">
              <label className="form-label required">Date de la quittance *</label>
              <input type="date" className="form-input" value={date} required
                onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label required">Reference douane *</label>
              <input className="form-input" value={ref} placeholder="N° quittance AIRS" required
                onChange={(e) => setRef(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label required">Valeur CAF (Ar) *</label>
              <input type="number" className="form-input" value={caf} placeholder="Ex : 50000000"
                min="1" step="1" required
                onChange={(e) => setCaf(e.target.value)} />
            </div>
            <div className="douane-recap acomptes-modal-recap">
              <span>Montant calcule automatiquement</span>
              <div><small>Retenue AIRS ({taux} %)</small><strong>{fmt(montant)} Ar</strong></div>
            </div>
          </div>
          <footer className="modal-footer acomptes-modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onFermer}>Annuler</button>
            <button type="submit" className="btn btn-primary" disabled={enCours || !ref.trim() || Number(caf) <= 0}>
              {enCours ? 'Enregistrement...' : 'Enregistrer la quittance'}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}
