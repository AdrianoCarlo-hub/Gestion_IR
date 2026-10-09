import { useEffect, useState } from 'react';
import { lister as listerDeclarations } from '../services/declarationService';
import * as service from '../services/penaliteService';
import { LoadingBlock, SkeletonTable } from '../components/Spinner';
import { useToast } from '../context/ToastContext';
import { LuTriangleAlert, LuCalendar, LuPercent, LuDollarSign, LuFileText, LuTrash2, LuCalculator, LuCircleAlert, LuCheck } from "react-icons/lu";

const fmt = (n) => (n == null ? '0' : Number(n).toLocaleString('fr-FR').replace(/\u202f|\u00a0/g, ' '));
const today = new Date().toISOString().slice(0, 10);

export default function Penalites() {
  const toast = useToast();
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
      toast.error(e.response?.data?.message || 'Erreur');
    }
  };

  const handleInteret = async () => {
    setError(''); setSuccess('');
    try {
      await service.calculerInteret(Number(selected), date);
      setSuccess('Interet de retard calcule');
      charger(selected);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Erreur');
    }
  };

  const handleAnnuler = async (id) => {
    if (!confirm('Annuler cette penalite ?')) return;
    try {
      await service.annuler(id);
      charger(selected);
      toast.success('Penalite annulee');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Erreur');
    }
  };

  // Calculer les totaux
  const totalMontant = penalites.reduce((sum, p) => sum + (p.montantAr || 0), 0);
  const penalitesPayees = penalites.filter(p => p.statut === 'PAYEE').length;
  const penalitesDue = penalites.filter(p => p.statut === 'DUE').length;

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1>Penalites</h1>
          <p className="page-sub">Amendes de retard et interets (1 % par mois)</p>
        </div>
      </header>

      {error && (
        <div className="alert alert-error" style={{ marginBottom: 16 }}>
          <span className="alert-icon">
            <LuCircleAlert className="icon" />
          </span>
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="alert alert-success" style={{ marginBottom: 16 }}>
          <span className="alert-icon">
            <LuCircleAlert className="icon" />
          </span>
          <span>{success}</span>
        </div>
      )}

      {/* Cartes de résumé */}
      {selected && penalites.length > 0 && (
        <div className="cards-grid" style={{ marginBottom: 24 }}>
          <div className="stat-card">
            <div className="stat-card-header">
              <div className="stat-card-icon">
                <LuTriangleAlert className="icon" style={{ width: 20, height: 20 }} />
              </div>
            </div>
            <span className="stat-label">Total penalites</span>
            <span className="stat-value">{penalites.length}</span>
          </div>
          
          <div className="stat-card financial ir-du">
            <div className="stat-card-header">
              <div className="stat-card-icon blue">
                <LuDollarSign className="icon" style={{ width: 20, height: 20 }} />
              </div>
            </div>
            <span className="stat-label">Montant total</span>
            <span className="stat-value">{fmt(totalMontant)} Ar</span>
          </div>
          
          <div className="stat-card financial encaisse">
            <div className="stat-card-header">
              <div className="stat-card-icon">
                <LuCheck className="icon" style={{ width: 20, height: 20 }} />
              </div>
            </div>
            <span className="stat-label">Payees</span>
            <span className="stat-value">{penalitesPayees}</span>
          </div>
          
          <div className="stat-card financial reste">
            <div className="stat-card-header">
              <div className="stat-card-icon orange">
                <LuCalendar className="icon" style={{ width: 20, height: 20 }} />
              </div>
            </div>
            <span className="stat-label">A payer</span>
            <span className="stat-value">{penalitesDue}</span>
          </div>
        </div>
      )}

      <div className="form-panel" style={{ marginBottom: 16 }}>
        <label className="form-label">Declaration</label>
        <select 
          className="form-select" 
          value={selected} 
          onChange={(e) => setSelected(e.target.value)}
        >
          <option value="">-- Choisir une declaration --</option>
          {declarations.map((d) => (
            <option key={d.idDeclaration} value={d.idDeclaration}>
              {d.contribuable?.raisonSociale} - {d.annee} ({d.statut})
            </option>
          ))}
        </select>

        <div className="form-row" style={{ marginTop: 16 }}>
          <div className="form-group">
            <label className="form-label">Date de reference</label>
            <input 
              type="date" 
              className="form-input" 
              value={date} 
              onChange={(e) => setDate(e.target.value)} 
            />
          </div>
        </div>

        {selected && (
          <div className="form-actions" style={{ marginTop: 16 }}>
            <button className="btn btn-primary" onClick={handleAmende}>
              <LuTriangleAlert className="icon" />
              Calculer amende
            </button>
            <button className="btn btn-primary" onClick={handleInteret}>
              <LuCalculator className="icon" />
              Calculer interet
            </button>
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
              {loading ? (
                <tr><td colSpan={6}><LoadingBlock message="Chargement..." /></td></tr>
              ) : penalites.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center' }}>Aucune penalite</td></tr>
              ) : (
                penalites.map((p) => (
                  <tr key={p.idPenalite}>
                    <td>
                      <span className="badge badge-warning" style={{ fontSize: 11 }}>
                        {p.type}
                      </span>
                    </td>
                    <td>{p.nbMois}</td>
                    <td>{p.tauxPct} %</td>
                    <td><strong>{fmt(p.montantAr)} Ar</strong></td>
                    <td>
                      <span className={'badge badge-' + (p.statut === 'PAYEE' ? 'actif' : p.statut === 'DUE' ? 'suspendu' : 'radie')}>
                        {p.statut}
                      </span>
                    </td>
                    <td>
                      {p.statut !== 'ANNULEE' && (
                        <button 
                          className="btn-icon delete"
                          onClick={() => handleAnnuler(p.idPenalite)}
                          title="Annuler"
                        >
                          <LuTrash2 className="icon" />
                        </button>
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


