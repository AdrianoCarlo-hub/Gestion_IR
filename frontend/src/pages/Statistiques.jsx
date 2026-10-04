import { useEffect, useState } from 'react';
import * as service from '../services/statistiqueService';
import * as exportService from '../services/exportService';

const fmt = (n) => (n == null ? '0' : Number(n).toLocaleString('fr-FR').replace(/\u202f|\u00a0/g, ' '));

export default function Statistiques() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    service.resume()
      .then(setData)
      .catch((e) => setError(e.response?.data?.message || 'Erreur'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page">
      <header className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>Statistiques</h1>
          <p className="page-sub">Chiffres cles de l application</p>
        </div>
        <button className="btn-primary" onClick={() => exportService.exportStatistiquesPdf()}>
          Exporter PDF
        </button>
      </header>

      {error && <div className="alert-error" style={{ marginBottom: 16 }}>{error}</div>}
      {loading && <p>Chargement...</p>}

      {data && (
        <>
          <div className="cards-grid">
            <div className="stat-card">
              <span className="stat-label">Contribuables</span>
              <span className="stat-value">{data.contribuables}</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Declarations</span>
              <span className="stat-value">{data.declarations}</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Paiements</span>
              <span className="stat-value">{data.paiements}</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Acomptes</span>
              <span className="stat-value">{data.acomptes}</span>
            </div>
          </div>

          <div className="cards-grid">
            <div className="stat-card">
              <span className="stat-label">IR total du</span>
              <span className="stat-value">{fmt(data.irTotal)} Ar</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Encaissement</span>
              <span className="stat-value">{fmt(data.encaisse)} Ar</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Reste a payer</span>
              <span className="stat-value">{fmt(data.soldeAPayer)} Ar</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Taux recouvrement</span>
              <span className="stat-value">{data.tauxRecouvrement} %</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Deficits actifs</span>
              <span className="stat-value">{data.deficitsActifs}</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
