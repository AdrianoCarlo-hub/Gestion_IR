import { useEffect } from 'react';

/**
 * Modal generique pour changer le statut d'une entite.
 *
 * Props :
 *  - ouvert          : boolean
 *  - titre           : titre du modal
 *  - statutActuel    : statut actuel (pour info)
 *  - options         : [{ value, label, couleur }]
 *  - onChoisir       : (nouveauStatut) => void
 *  - onFermer        : () => void
 */
export default function StatutModal({
  ouvert,
  titre = 'Changer le statut',
  statutActuel,
  options = [],
  onChoisir,
  onFermer,
}) {
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape' && ouvert) onFermer();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [ouvert, onFermer]);

  if (!ouvert) return null;

  return (
    <div className="modal-overlay" onClick={onFermer}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{titre}</h3>
        </div>
        <div className="modal-body">
          {statutActuel && (
            <p style={{ marginBottom: 16, color: '#64748b' }}>
              Statut actuel : <strong>{statutActuel}</strong>
            </p>
          )}
          <div className="statut-options">
            {options.map((opt) => (
              <button
                key={opt.value}
                className={
                  'statut-option' +
                  (opt.value === statutActuel ? ' statut-option-active' : '')
                }
                onClick={() => {
                  if (opt.value !== statutActuel) onChoisir(opt.value);
                  onFermer();
                }}
                disabled={opt.value === statutActuel}
              >
                <span
                  className="statut-dot"
                  style={{ background: opt.couleur || '#64748b' }}
                />
                <span className="statut-option-label">{opt.label}</span>
                {opt.value === statutActuel && (
                  <span className="statut-option-badge">Actuel</span>
                )}
              </button>
            ))}
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onFermer}>
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
}
