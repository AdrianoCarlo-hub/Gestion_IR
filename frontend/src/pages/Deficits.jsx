import { useEffect, useState } from 'react';
import { lister as listerContribuables } from '../services/contribuableService';
import * as service from '../services/deficitService';

const fmt = (n) => (n == null ? '0' : Number(n).toLocaleString('fr-FR').replace(/\u202f|\u00a0/g, ' '));
const anneeCourante = new Date().getFullYear();

export default function Deficits() {
  const [liste, setListe] = useState([]);
  const [contribuables, setContribuables] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({
    idContribuable: '',
    anneeOrigine: anneeCourante,
    montant: '',
  });

  const charger = async () => {
    setLoading(true);
    try {
      setListe(await service.lister());
    } catch (e) {
      setError(e.response?.data?.message || 'Erreur');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    charger();
    listerContribuables().then(setContribuables).catch(() => {});
  }, []);

  const setF = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      await service.creer({
        idContribuable: Number(form.idContribuable),
        anneeOrigine: Number(form.anneeOrigine),
        montant: Number(form.montant),
      });
      setSuccess('Deficit enregistre');
      setShowForm(false);
      setForm({ ...form, montant: '' });
      charger();
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur');
    }
  };

  return (
    <div className="page">
      <header className="page-header">
        <h1>Deficits</h1>
        <p className="page-sub">Stock de deficits reportables (5 ans)</p>
      </header>

      {error && <div className="alert-error" style={{ marginBottom: 16 }}>{error}</div>}
      {success && <div className="alert-success" style={{ marginBottom: 16 }}>{success}</div>}

      {!showForm && (
        <button className="btn-primary" onClick={() => setShowForm(true)} style={{ marginBottom: 16 }}>
          + Nouveau deficit
        </button>
      )}

      {showForm && (
        <form className="form-panel" onSubmit={handleSubmit} style={{ marginBottom: 16 }}>
          <h3 className="section-title">Nouveau deficit</h3>
          <div className="form-row">
            <div className="form-group" style={{ flex: 2 }}>
              <label className="form-label">Contribuable *</label>
              <select className="form-input" value={form.idContribuable}
                      onChange={(e) => setF('idContribuable', e.target.value)} required>
                <option value="">-- Choisir --</option>
                {contribuables.map((c) => (
                  <option key={c.idContribuable} value={c.idContribuable}>
                    {c.nif} - {c.raisonSociale}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Annee d origine *</label>
              <input type="number" className="form-input" value={form.anneeOrigine}
                     onChange={(e) => setF('anneeOrigine', e.target.value)} min={2000} required />
            </div>
            <div className="form-group">
              <label className="form-label">Montant (Ar) *</label>
              <input type="number" className="form-input" value={form.montant}
                     onChange={(e) => setF('montant', e.target.value)} min={1} required />
            </div>
          </div>
          <div className="form-actions">
            <button type="submit" className="btn-primary">Enregistrer</button>
            <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Annuler</button>
          </div>
        </form>
      )}

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Contribuable</th>
              <th>Annee origine</th>
              <th>Montant initial</th>
              <th>Utilise</th>
              <th>Solde</th>
              <th>Expiration</th>
              <th>Statut</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ textAlign: 'center' }}>Chargement...</td></tr>
            ) : liste.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign: 'center' }}>Aucun deficit</td></tr>
            ) : (
              liste.map((d) => (
                <tr key={d.idDeficit}>
                  <td>{d.contribuable?.raisonSociale || '-'}</td>
                  <td>{d.anneeOrigine}</td>
                  <td>{fmt(d.montantInitial)} Ar</td>
                  <td>{fmt(d.montantUtilise)} Ar</td>
                  <td><strong>{fmt(d.solde)} Ar</strong></td>
                  <td>{d.anneeExpiration}</td>
                  <td><span className={'badge badge-' + (d.statut || '').toLowerCase()}>{d.statut}</span></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <p className="table-footer">{liste.length} resultat(s)</p>
    </div>
  );
}
