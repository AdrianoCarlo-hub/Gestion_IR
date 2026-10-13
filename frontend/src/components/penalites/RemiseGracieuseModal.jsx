import { useState } from 'react';
import { LuX, LuHandHeart, LuTriangleAlert } from 'react-icons/lu';

const fmt = (n) => (n == null ? '0' : Number(n).toLocaleString('fr-FR').replace(/\u202f|\u00a0/g, ' '));

/**
 * Modal de demande de remise gracieuse d'une penalite.
 * Avertissement legal : la remise gracieuse est exceptionnelle et soumise a decision.
 */
export default function RemiseGracieuseModal({ ouvert, penalite, onFermer, onValider }) {
  const [motif, setMotif] = useState('');
  const [justificatif, setJustificatif] = useState('');

  if (!ouvert || !penalite) return null;

  const valider = () => {
    if (!motif.trim()) return;
    onValider && onValider({ motif: motif.trim(), justificatif: justificatif.trim() });
    setMotif('');
    setJustificatif('');
  };

  return (
    <div className="modal-overlay visible" onClick={onFermer}>
      <div className="modal-box legal-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3><LuHandHeart className="icon" /> Demande de remise gracieuse</h3>
          <button className="btn-icon" onClick={onFermer}><LuX className="icon" /></button>
        </div>
        <div className="modal-body">
          <div className="legal-warning">
            <LuTriangleAlert className="icon" />
            <span>
              La remise gracieuse est exceptionnelle et soumise a la decision du responsable.
              Elle ne suspend pas l exigibilite de la penalite ({fmt(penalite.montantAr)} Ar).
            </span>
          </div>
          <div className="form-group">
            <label className="form-label required">Motif de la demande *</label>
            <textarea className="form-input" rows={3} value={motif}
              onChange={(e) => setMotif(e.target.value)}
              placeholder="Ex : difficulte financiere temporaire..." />
          </div>
          <div className="form-group">
            <label className="form-label">Justificatif (reference)</label>
            <input className="form-input" value={justificatif}
              onChange={(e) => setJustificatif(e.target.value)}
              placeholder="N° du document joint" />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onFermer}>Annuler</button>
          <button className="btn btn-primary" onClick={valider}>Envoyer la demande</button>
        </div>
      </div>
    </div>
  );
}
