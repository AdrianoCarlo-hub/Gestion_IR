import { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { agent } = useAuth();
  const [stats, setStats] = useState({
    contribuables: 0,
    declarations: 0,
    paiements: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [c, d, p] = await Promise.all([
          api.get('/contribuables').catch(() => ({ data: [] })),
          api.get('/declarations').catch(() => ({ data: [] })),
          api.get('/paiements').catch(() => ({ data: [] })),
        ]);
        setStats({
          contribuables: c.data.length || 0,
          declarations: d.data.length || 0,
          paiements: p.data.length || 0,
        });
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="page">
      <header className="page-header">
        <h1>Tableau de bord</h1>
        <p className="page-sub">
          Bienvenue {agent?.prenom} {agent?.nom} ({agent?.role})
        </p>
      </header>

      <div className="cards-grid">
        <div className="stat-card">
          <span className="stat-label">Contribuables</span>
          <span className="stat-value">{loading ? '...' : stats.contribuables}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Declarations IR</span>
          <span className="stat-value">{loading ? '...' : stats.declarations}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Paiements</span>
          <span className="stat-value">{loading ? '...' : stats.paiements}</span>
        </div>
      </div>

      <div className="info-panel">
        <h2>Modules disponibles</h2>
        <ul>
          <li>Gestion des contribuables et de leurs informations fiscales</li>
          <li>Declaration annuelle de l'IR avec calcul automatique</li>
          <li>Suivi des deficits reportables (5 ans)</li>
          <li>Acomptes (2 x 50%) et paiements avec quittance</li>
          <li>Penalites de retard et suspensions d'activite</li>
          <li>Statistiques et exports</li>
        </ul>
      </div>
    </div>
  );
}
