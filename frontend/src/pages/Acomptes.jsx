import { useEffect, useState } from 'react';
import * as service from '../services/acompteService';
import { LoadingBlock, SkeletonTable } from '../components/Spinner';
import { LuCalendar, LuPercent, LuDollarSign, LuUser, LuFileText, LuTriangleAlert } from "react-icons/lu";

const fmt = (n) => (n == null ? '0' : Number(n).toLocaleString('fr-FR').replace(/\u202f|\u00a0/g, ' '));

export default function Acomptes() {
  const [liste, setListe] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    service.lister()
      .then(setListe)
      .catch((e) => setError(e.response?.data?.message || 'Erreur'))
      .finally(() => setLoading(false));
  }, []);

  // Calculer les totaux
  const totalMontant = liste.reduce((sum, a) => sum + (a.montantAr || 0), 0);
  const acomptesEnCours = liste.filter(a => a.statut === 'A_PAYER').length;
  const acomptesPayes = liste.filter(a => a.statut === 'PAYE').length;

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1>Acomptes</h1>
          <p className="page-sub">Suivi des acomptes (2 x 50 % de l IR N-1)</p>
        </div>
      </header>

      {error && (
        <div className="alert alert-error" style={{ marginBottom: 16 }}>
          <span className="alert-icon">
            <LuTriangleAlert className="icon" />
          </span>
          <span>{error}</span>
        </div>
      )}

      {/* Cartes de résumé */}
      <div className="cards-grid" style={{ marginBottom: 24 }}>
        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-card-icon">
              <LuCalendar className="icon" style={{ width: 20, height: 20 }} />
            </div>
          </div>
          <span className="stat-label">Total acomptes</span>
          <span className="stat-value">{liste.length}</span>
        </div>
        
        <div className="stat-card financial encaisse">
          <div className="stat-card-header">
            <div className="stat-card-icon blue">
              <LuDollarSign className="icon" style={{ width: 20, height: 20 }} />
            </div>
          </div>
          <span className="stat-label">Montant total</span>
          <span className="stat-value">{fmt(totalMontant)} Ar</span>
        </div>
        
        <div className="stat-card financial reste">
          <div className="stat-card-header">
            <div className="stat-card-icon orange">
              <LuPercent className="icon" style={{ width: 20, height: 20 }} />
            </div>
          </div>
          <span className="stat-label">A payer</span>
          <span className="stat-value">{acomptesEnCours}</span>
        </div>
        
        <div className="stat-card financial ir-du">
          <div className="stat-card-header">
            <div className="stat-card-icon">
              <LuUser className="icon" style={{ width: 20, height: 20 }} />
            </div>
          </div>
          <span className="stat-label">Payes</span>
          <span className="stat-value">{acomptesPayes}</span>
        </div>
      </div>

      {loading ? (
        <SkeletonTable rows={5} cols={8} />
      ) : liste.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <LuCalendar className="icon" />
          </div>
          <h3>Aucun acompte</h3>
          <p>Les acomptes seront generes automatiquement lors de la validation des declarations</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Contribuable</th>
                <th>Annee</th>
                <th>N°</th>
                <th>Taux</th>
                <th>Base IR N-1</th>
                <th>Montant</th>
                <th>Echeance</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
              {liste.map((a) => (
                <tr key={a.idAcompte}>
                  <td>{a.contribuable?.raisonSociale || '-'}</td>
                  <td>{a.annee}</td>
                  <td><span className="badge badge-info">{a.numero}</span></td>
                  <td>{a.tauxPct} %</td>
                  <td>{fmt(a.baseIrN1)} Ar</td>
                  <td><strong>{fmt(a.montantAr)} Ar</strong></td>
                  <td>{a.dateEcheance}</td>
                  <td>
                    <span className={'badge badge-' + (a.statut || '').toLowerCase()}>
                      {a.statut}
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
