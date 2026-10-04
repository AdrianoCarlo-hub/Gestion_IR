import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { lister as listerContribuables } from '../services/contribuableService';
import * as service from '../services/suspensionService';

const today = new Date().toISOString().slice(0, 10);

export default function Suspensions() {
  const { agent } = useAuth();
  const [contribuables, setContribuables] = useState([]);
  const [selected, setSelected] = useState('');
  const [historique, setHistorique] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formArret, setFormArret] = useState({ dateArret: today, motif: 'MANQUE_ACTIVITE', refDeclaration: '' });
  const [formReprise, setFormReprise] = useState({ dateReprise: today });

  useEffect(() => {
    listerContribuables().then(setContribuables).catch(() => {});
  }, []);

  const charger = async (id) => {
    if (!id) return;
    try {
      setHistorique(await service.parContribuable(id));
    } catch (e) {
      setError(e.response?.data?.message || 'Erreur');
    }
  };

  useEffect(() => {
    if (selected) charger(selected);
  }, [selected]);

  const handleArret = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      await service.declarerArret({
        idContribuable: Number(selected),
        dateArret: formArret.dateArret,
        motif: formArret.motif,
        refDeclaration: formArret.refDeclaration || null,
        idAgent: agent?.idAgent || 3,
      });
      setSuccess('Arret enregistre');
      charger(selected);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur');
    }
  };

  const handleReprise = async (idSuspension) => {
    setError('');
    setSuccess('');
    try {
      await service.declarerReprise(idSuspension, {
        dateReprise: formReprise.dateReprise,
        idAgent: agent?.idAgent || 3,
      });
      setSuccess('Reprise enregistree');
      charger(selected);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur');
    }
  };

  const handleAnnuler = async (id) => {
    if (!confirm('Annuler cette suspension ?')) return;
    try {
      await service.annuler(id);
      charger(selected);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur');
    }
  };

  const enCours = historique.find((h) => h.statut === 'EN_COURS');

  return (
    <div className="page">
      <header className="page-header">
        <h1>Arret / reprise d activite</h1>
        <p className="page-sub">Suspension de l impot pendant l arret</p>
      </header>

      {error && <div className="alert-error" style={{ marginBottom: 16 }}>{error}</div>}
      {success && <div className="alert-success" style={{ marginBottom: 16 }}>{success}</div>}

      <div className="form-panel" style={{ marginBottom: 16 }}>
        <label className="form-label">Contribuable</label>
        <select className="form-input" value={selected} onChange={(e) => setSelected(e.target.value)}>
          <option value="">-- Choisir un contribuable --</option>
          {contribuables.map((c) => (
            <option key={c.idContribuable} value={c.idContribuable}>
              {c.nif} - {c.raisonSociale} ({c.statut})
            </option>
          ))}
        </select>
      </div>

      {selected && !enCours && (
        <form className="form-panel" onSubmit={handleArret} style={{ marginBottom: 16 }}>
          <h3 className="section-title">Declarer un arret</h3>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Date d arret *</label>
              <input type="date" className="form-input" value={formArret.dateArret}
                     onChange={(e) => setFormArret({ ...formArret, dateArret: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="form-label">Motif *</label>
              <select className="form-input" value={formArret.motif}
                      onChange={(e) => setFormArret({ ...formArret, motif: e.target.value })}>
                <option value="MANQUE_ACTIVITE">Manque d activite</option>
                <option value="TRAVAUX">Travaux</option>
                <option value="SAISON">Saison</option>
                <option value="DIFFICULTE_FINANCIERE">Difficulte financiere</option>
                <option value="AUTRE">Autre</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">N° declaration ecrite</label>
              <input className="form-input" value={formArret.refDeclaration}
                     onChange={(e) => setFormArret({ ...formArret, refDeclaration: e.target.value })} />
            </div>
          </div>
          <div className="form-actions">
            <button type="submit" className="btn-primary">Enregistrer l arret</button>
          </div>
        </form>
      )}

      {enCours && (
        <div className="form-panel" style={{ marginBottom: 16 }}>
          <h3 className="section-title">Declarer la reprise</h3>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Date de reprise *</label>
              <input type="date" className="form-input" value={formReprise.dateReprise}
                     onChange={(e) => setFormReprise({ dateReprise: e.target.value })} />
            </div>
          </div>
          <div className="form-actions">
            <button className="btn-validate" onClick={() => handleReprise(enCours.idSuspension)}>
              Enregistrer la reprise
            </button>
          </div>
        </div>
      )}

      {selected && historique.length > 0 && (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date arret</th>
                <th>Date reprise</th>
                <th>Motif</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {historique.map((h) => (
                <tr key={h.idSuspension}>
                  <td>{h.dateArret}</td>
                  <td>{h.dateReprise || '-'}</td>
                  <td>{h.motif}</td>
                  <td><span className={'badge badge-' + (h.statut === 'EN_COURS' ? 'suspendu' : 'actif')}>{h.statut}</span></td>
                  <td>
                    {h.statut === 'EN_COURS' && (
                      <button className="btn-link danger" onClick={() => handleAnnuler(h.idSuspension)}>
                        Annuler
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
