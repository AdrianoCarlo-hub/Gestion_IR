import { useEffect } from 'react';

export default function ConfirmDialog({
  ouvert,
  titre = 'Confirmation',
  message,
  texteConfirmer = 'Confirmer',
  texteAnnuler = 'Annuler',
  danger = false,
  onConfirmer,
  onAnnuler,
}) {
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape' && ouvert) onAnnuler();
      if (e.key === 'Enter' && ouvert) onConfirmer();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [ouvert, onAnnuler, onConfirmer]);

  if (!ouvert) return null;

  return (
    <div className="modal-overlay" onClick={onAnnuler}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{titre}</h3>
        </div>
        <div className="modal-body">
          <p>{message}</p>
        </div>
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onAnnuler}>
            {texteAnnuler}
          </button>
          <button
            className={danger ? 'btn-danger' : 'btn-primary'}
            onClick={onConfirmer}
          >
            {texteConfirmer}
          </button>
        </div>
      </div>
    </div>
  );
}
