import { useEffect, useState } from 'react';
import { lister as listerDeclarations } from '../services/declarationService';
import * as service from '../services/penaliteService';

const fmt = (n) => (n == null ? '0' : Number(n).toLocaleString('fr-FR').replace(/\u202f|\u00a0/g, ' '));
const today = new Date().toISOString().slice(0, 10);

export default function Penalites() {
  const [declarations, setDeclarations] = useState([]);
  const [selected, setSelected] = useState('');
  const [penalites, setPenalites] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [date, setDate] = useState(today);

  useEffect(() => {
    listerDeclarations().then(setDeclarations).catch(() => {});
  }, []);

  const charger = async (id) => {
    if (!id) return;
    try {
      setPenalites(await service.parDeclaration(id));
    } catch (e) {
      setError(e.response?.data?.message || 'Erreur');
    }
  };

  useEffect(() => { if (selected) charger(selected); }, [selected]);

  const handleAmende = async () => {
    setError(''); setSuccess('');
    try {
      await service.calculerAmende(Number(selected), date);
      setSuccess('Amende de depot tardif calculee');
      charger(selected);
    } catch (e) {
      setError(e.response?.data?.message || 'Erreur');
    }
  };

  const handleInteret = async () => {
    setError(''); setSuccess('');
    try {
      await service.calculerInteret(Number(selected), date);
      setSuccess('Interet de retard calcule');
      charger(selected);
    } catch (e) {
      setError(e.response?.data?.message || 'Erreur');
    }
  };

  const handleAnnuler = async (id) => {
    if (!confirm('Annuler cette penalite ?')) return;
    try {
      await service.annuler(id);
      charger(selected);
    } catch (e) {
      setError(e.response?.data?.message || 'Erreur');
    }
  };

  return (
    <div className="page">
      <header className="page-header">
        <h1>Penalites</h1>
        <p className="page-sub">Amendes de retard et interets (1 % par mois)</p>
      </header>

      {error && <div className="alert-error" style={{ marginBottom: 16 }}>{error}</div>}
      {success && <div className="alert-success" style={{ marginBottom: 16 }}>{success}</div>}

      <div className="form-panel" style={{ marginBottom: 16 }}>
        <div className="form-row">
          <div className="form-group" style={{ flex: 2 }}>
            <label className="form-label">Declaration</label>
            <select className="form-input" value={selected} onChange={(e) => setSelected(e.target.value)}>
              <option value="">-- Choisir une declaration --</option>
              {declarations.map((d) => (
                <option key={d.idDeclaration} value={d.idDeclaration}>
                  {d.contribuable?.raisonSociale} - {d.annee} ({d.statut})
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Date de reference</label>
            <input type="date" className="form-input" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
        </div>

        {selected && (
          <div className="form-actions">
            <button className="btn-primary" onClick={handleAmende}>Calculer amende depot tardif</button>
            <button className="btn-primary" onClick={handleInteret}>Calculer interet de retard</button>
          </div>
        )}
      </div>

      {selected && (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Nb mois</th>
                <th>Taux</th>
                <th>Montant</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {penalites.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center' }}>Aucune penalite</td></tr>
              ) : (
                penalites.map((p) => (
                  <tr key={p.idPenalite}>
                    <td>{p.type}</td>
                    <td>{p.nbMois}</td>
                    <td>{p.tauxPct} %</td>
                    <td>{fmt(p.montantAr)} Ar</td>
                    <td><span className={'badge badge-' + (p.statut === 'PAYEE' ? 'actif' : p.statut === 'DUE' ? 'suspendu' : 'radie')}>{p.statut}</span></td>
                    <td>
                      {p.statut !== 'ANNULEE' && (
                        <button className="btn-link danger" onClick={() => handleAnnuler(p.idPenalite)}>Annuler</button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
