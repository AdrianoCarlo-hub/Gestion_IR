import { useEffect, useState } from 'react';
import { lister as listerContribuables } from '../services/contribuableService';
import * as service from '../services/deficitService';
import { LoadingBlock, SkeletonTable } from '../components/Spinner';
import { useToast } from '../context/ToastContext';
import { LuPlus, LuTrendingDown, LuUser, LuCalendar, LuDollarSign, LuTriangleAlert, LuX, LuSave } from "react-icons/lu";

const fmt = (n) => (n == null ? '0' : Number(n).toLocaleString('fr-FR').replace(/\u202f|\u00a0/g, ' '));
const anneeCourante = new Date().getFullYear();

export default function Deficits() {
  const toast = useToast();
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
    if (!form.idContribuable) {
      setError('Contribuable obligatoire');
      return;
    }
    if (!form.montant || Number(form.montant) <= 0) {
      setError('Montant obligatoire et > 0');
      return;
    }
    try {
      await service.creer({
        idContribuable: Number(form.idContribuable),
        anneeOrigine: Number(form.anneeOrigine),
        montant: Number(form.montant),
      });
      setSuccess('Deficit enregistre');
      setShowForm(false);
      setForm({ idContribuable: form.idContribuable, anneeOrigine: anneeCourante, montant: '' });
      charger();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur');
    }
  };

  // Calculer les totaux
  const totalDeficit = liste.reduce((sum, d) => sum + (d.solde || 0), 0);
  const deficitsActifs = liste.filter(d => d.statut === 'ACTIF').length;

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1>Deficits</h1>
          <p className="page-sub">Stock de deficits reportables (5 ans)</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>
          <LuPlus className="icon" />
          Nouveau deficit
        </button>
      </header>

      {error && (
        <div className="alert alert-error" style={{ marginBottom: 16 }}>
          <span className="alert-icon">
            <LuTriangleAlert className="icon" />
          </span>
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="alert alert-success" style={{ marginBottom: 16 }}>
          <span className="alert-icon">
            <LuTriangleAlert className="icon" />
          </span>
          <span>{success}</span>
        </div>
      )}

      {/* Cartes de résumé */}
      <div className="cards-grid" style={{ marginBottom: 24 }}>
        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-card-icon">
              <LuTrendingDown className="icon" style={{ width: 20, height: 20 }} />
            </div>
          </div>
          <span className="stat-label">Deficits actifs</span>
          <span className="stat-value">{deficitsActifs}</span>
        </div>
        
        <div className="stat-card financial ir-du">
          <div className="stat-card-header">
            <div className="stat-card-icon orange">
              <LuDollarSign className="icon" style={{ width: 20, height: 20 }} />
            </div>
          </div>
          <span className="stat-label">Montant total</span>
          <span className="stat-value">{fmt(totalDeficit)} Ar</span>
        </div>
        
        <div className="stat-card financial encaisse">
          <div className="stat-card-header">
            <div className="stat-card-icon blue">
              <LuCalendar className="icon" style={{ width: 20, height: 20 }} />
            </div>
          </div>
          <span className="stat-label">Total deficits</span>
          <span className="stat-value">{liste.length}</span>
        </div>
      </div>

      {showForm && (
        <form className="form-panel" onSubmit={handleSubmit} style={{ marginBottom: 16 }}>
          <h3 className="section-title">
            <LuTrendingDown className="section-icon" />
            Nouveau deficit
          </h3>
          <div className="form-row">
            <div className="form-group" style={{ flex: 2 }}>
              <label className="form-label required">Contribuable *</label>
              <select 
                className="form-select" 
                value={form.idContribuable}
                onChange={(e) => setF('idContribuable', e.target.value)} 
                required
              >
                <option value="">-- Choisir un contribuable --</option>
                {contribuables.map((c) => (
                  <option key={c.idContribuable} value={c.idContribuable}>
                    {c.nif} - {c.raisonSociale}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label required">Annee d'origine *</label>
              <input 
                type="number" 
                className="form-input" 
                value={form.anneeOrigine}
                onChange={(e) => setF('anneeOrigine', e.target.value)} 
                min={2000} 
                required 
              />
            </div>
            <div className="form-group">
              <label className="form-label required">Montant (Ar) *</label>
              <input 
                type="number" 
                className="form-input" 
                value={form.montant}
                onChange={(e) => setF('montant', e.target.value)} 
                min={1} 
                required 
              />
            </div>
          </div>
          <div className="form-actions">
            <button type="submit" className="btn btn-primary">
              <LuSave className="icon" />
              Enregistrer
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>
              <LuX className="icon" />
              Annuler
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <SkeletonTable rows={5} cols={7} />
      ) : liste.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <LuTrendingDown className="icon" />
          </div>
          <h3>Aucun deficit</h3>
          <p>Ajoutez un deficit pour le report sur les declarations futures</p>
        </div>
      ) : (
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
              {liste.map((d) => (
                <tr key={d.idDeficit}>
                  <td>{d.contribuable?.raisonSociale || '-'}</td>
                  <td>{d.anneeOrigine}</td>
                  <td>{fmt(d.montantInitial)} Ar</td>
                  <td>{fmt(d.montantUtilise)} Ar</td>
                  <td><strong>{fmt(d.solde)} Ar</strong></td>
                  <td>{d.anneeExpiration}</td>
                  <td>
                    <span className={'badge badge-' + (d.statut || '').toLowerCase()}>
                      {d.statut}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="table-footer">{liste.length} resultat(s)</p>
    </div>
  );
}
