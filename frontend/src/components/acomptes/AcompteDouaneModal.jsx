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

  const valider = () => {
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
    <div className="modal-overlay visible" onClick={onFermer}>
      <div className="modal-box legal-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3><LuShip className="icon" /> Enregistrer une quittance de douane</h3>
          <button className="btn-icon" onClick={onFermer}><LuX className="icon" /></button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label required">Date de la quittance *</label>
            <input type="date" className="form-input" value={date}
              onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label required">Reference douane *</label>
            <input className="form-input" value={ref} placeholder="N° quittance AIRS"
              onChange={(e) => setRef(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label required">Valeur CAF (Ar) *</label>
            <input type="number" className="form-input" value={caf} placeholder="Ex : 50000000"
              onChange={(e) => setCaf(e.target.value)} />
          </div>
          <div className="douane-recap">
            <span>Retenue AIRS ({taux} %)</span>
            <strong>{fmt(montant)} Ar</strong>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onFermer}>Annuler</button>
          <button className="btn btn-primary" onClick={valider} disabled={enCours}>
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
}
