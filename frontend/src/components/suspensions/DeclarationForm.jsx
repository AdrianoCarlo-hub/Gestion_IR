import { useState } from 'react';
import { LuCirclePause, LuCirclePlay, LuCircleX, LuSend } from 'react-icons/lu';

const today = new Date().toISOString().slice(0, 10);

const MOTIFS = [
  { value: 'MANQUE_ACTIVITE', label: "Manque d activite" },
  { value: 'TRAVAUX', label: 'Travaux' },
  { value: 'SAISON', label: 'Saison' },
  { value: 'DIFFICULTE_FINANCIERE', label: 'Difficulte financiere' },
  { value: 'REORGANISATION', label: 'Reorganisation' },
  { value: 'AUTRE', label: 'Autre' },
];

/**
 * Formulaire de declaration d'arret / reprise d'activite.
 * 3 modes : VEILLEUSE (arret temporaire), CESSATION (definitive), REPRISE.
 */
export default function DeclarationForm({ onSoumettre, enCours, enCoursId }) {
  const [type, setType] = useState('VEILLEUSE');
  const [date, setDate] = useState(today);
  const [motif, setMotif] = useState('MANQUE_ACTIVITE');
  const [refDeclaration, setRefDeclaration] = useState('');
  const [justificatif, setJustificatif] = useState('');

  const soumettre = (e) => {
    e.preventDefault();
    if (type === 'REPRISE') {
      if (!enCoursId) return;
      onSoumettre('REPRISE', { dateReprise: date });
      return;
    }
    if (type === 'VEILLEUSE') {
      onSoumettre('VEILLEUSE', {
        dateArret: date,
        motif,
        refDeclaration: refDeclaration || null,
      });
    } else {
      onSoumettre('CESSATION', {
        dateArret: date,
        motif,
        justificatif: justificatif || null,
      });
    }
  };

  return (
    <form className="form-panel declaration-form" onSubmit={soumettre} style={{ marginBottom: 16 }}>
      <h3 className="section-title">Declaration d evenement</h3>

      <div className="radio-group">
        <label className={'radio-card' + (type === 'VEILLEUSE' ? ' actif' : '')}>
          <input type="radio" name="type" checked={type === 'VEILLEUSE'}
            onChange={() => setType('VEILLEUSE')} disabled={!!enCours} />
          <LuCirclePause className="icon" />
          <span>Mise en veilleuse</span>
        </label>
        <label className={'radio-card' + (type === 'CESSATION' ? ' actif' : '')}>
          <input type="radio" name="type" checked={type === 'CESSATION'}
            onChange={() => setType('CESSATION')} disabled={!!enCours} />
          <LuCircleX className="icon" />
          <span>Cessation definitive</span>
        </label>
        <label className={'radio-card' + (type === 'REPRISE' ? ' actif' : '')}>
          <input type="radio" name="type" checked={type === 'REPRISE'}
            onChange={() => setType('REPRISE')} disabled={!enCours} />
          <LuCirclePlay className="icon" />
          <span>Reprise d activite</span>
        </label>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label required">
            {type === 'REPRISE' ? 'Date de reprise *' : 'Date d arret *'}
          </label>
          <input type="date" className="form-input" value={date}
            onChange={(e) => setDate(e.target.value)} required />
        </div>

        {type === 'VEILLEUSE' && (
          <>
            <div className="form-group">
              <label className="form-label required">Motif *</label>
              <select className="form-input" value={motif}
                onChange={(e) => setMotif(e.target.value)}>
                {MOTIFS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">N° declaration ecrite</label>
              <input className="form-input" value={refDeclaration}
                onChange={(e) => setRefDeclaration(e.target.value)} />
            </div>
          </>
        )}

        {type === 'CESSATION' && (
          <>
            <div className="form-group">
              <label className="form-label">Motif</label>
              <select className="form-input" value={motif}
                onChange={(e) => setMotif(e.target.value)}>
                {MOTIFS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Justificatif (bilan de cloture)</label>
              <input className="form-input" value={justificatif}
                onChange={(e) => setJustificatif(e.target.value)} />
            </div>
          </>
        )}
      </div>

      <div className="form-actions">
        <button type="submit" className="btn btn-primary"
          disabled={type === 'REPRISE' && !enCoursId}>
          <LuSend className="icon" />
          Soumettre la declaration
        </button>
      </div>
    </form>
  );
}
