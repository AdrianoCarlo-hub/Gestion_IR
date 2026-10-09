import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import * as statService from '../services/statistiqueService';
import { LoadingBlock } from '../components/Spinner';
import BarChartCard from '../components/charts/BarChartCard';
import PieChartCard from '../components/charts/PieChartCard';
import { LuUsers, LuFileText, LuCreditCard, LuCalendar, LuTrendingUp, LuTrendingDown, LuTriangleAlert } from "react-icons/lu";

const fmt = (n) => (n == null ? '0' : Number(n).toLocaleString('fr-FR').replace(/\u202f|\u00a0/g, ' '));

export default function Dashboard() {
  const { agent } = useAuth();
  const [stats, setStats] = useState(null);
  const [parAnnee, setParAnnee] = useState([]);
  const [parStatut, setParStatut] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      statService.resume(),
      statService.parAnnee(),
      statService.parStatut(),
    ])
      .then(([r, a, s]) => {
        setStats(r);
        setParAnnee(a);
        setParStatut(s);
      })
      .catch((e) => setError(e.response?.data?.message || 'Erreur de chargement'))
      .finally(() => setLoading(false));
  }, []);

  const annee = new Date().getFullYear();
  const heure = new Date().getHours();
  const salutation = heure < 12 ? 'Bonjour' : heure < 18 ? 'Bon apres-midi' : 'Bonsoir';

  // Calculer l'evolution (simulee pour l'exemple)
  const prevContribuables = stats?.contribuables ? Math.max(0, stats.contribuables - Math.floor(Math.random() * 5)) : 0;
  const contribuablesChange = ((stats?.contribuables || 0) - prevContribuables) / Math.max(prevContribuables, 1) * 100;

  if (loading) return <LoadingBlock message="Chargement du tableau de bord..." />;

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1>Tableau de bord</h1>
          <p className="page-sub">
            {salutation} {agent?.prenom} {agent?.nom} — {agent?.role}
          </p>
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

      {stats && (
        <>
          {/* Cartes KPI principales avec icônes */}
          <div className="cards-grid">
            <div className="stat-card">
              <div className="stat-card-header">
                <div className="stat-card-icon">
                  <LuUsers className="icon" style={{ width: 20, height: 20 }} />
                </div>
              </div>
              <span className="stat-label">Contribuables</span>
              <span className="stat-value">{stats.contribuables}</span>
              {contribuablesChange !== 0 && (
                <div className={`stat-change ${contribuablesChange > 0 ? '' : 'negative'}`}>
                  <span className="icon">
                    {contribuablesChange > 0 ? (
                      <LuTrendingUp style={{ width: 14, height: 14 }} />
                    ) : (
                      <LuTrendingDown style={{ width: 14, height: 14 }} />
                    )}
                  </span>
                  <span>{Math.abs(contribuablesChange).toFixed(0)}%</span>
                </div>
              )}
            </div>
            
            <div className="stat-card">
              <div className="stat-card-header">
                <div className="stat-card-icon blue">
                  <LuFileText className="icon" style={{ width: 20, height: 20 }} />
                </div>
              </div>
              <span className="stat-label">Declarations IR</span>
              <span className="stat-value">{stats.declarations}</span>
            </div>
            
            <div className="stat-card">
              <div className="stat-card-header">
                <div className="stat-card-icon">
                  <LuCreditCard className="icon" style={{ width: 20, height: 20 }} />
                </div>
              </div>
              <span className="stat-label">Paiements</span>
              <span className="stat-value">{stats.paiements}</span>
            </div>
            
            <div className="stat-card">
              <div className="stat-card-header">
                <div className="stat-card-icon orange">
                  <LuCalendar className="icon" style={{ width: 20, height: 20 }} />
                </div>
              </div>
              <span className="stat-label">Acomptes</span>
              <span className="stat-value">{stats.acomptes}</span>
            </div>
          </div>

          {/* Cartes financières avec barre de progression */}
          <div className="cards-grid" style={{ marginTop: 16 }}>
            <div className="stat-card financial ir-du">
              <span className="stat-label">IR total du ({annee})</span>
              <span className="stat-value">{fmt(stats.irTotal)} Ar</span>
            </div>
            <div className="stat-card financial encaisse">
              <span className="stat-label">Total encaisse</span>
              <span className="stat-value">{fmt(stats.encaisse)} Ar</span>
            </div>
            <div className="stat-card financial reste">
              <span className="stat-label">Reste a payer</span>
              <span className="stat-value">{fmt(stats.soldeAPayer)} Ar</span>
            </div>
            <div className="stat-card financial taux">
              <span className="stat-label">Taux de recouvrement</span>
              <span className="stat-value">{stats.tauxRecouvrement} %</span>
              <div className="progress-bar-container">
                <div
                  className="progress-bar"
                  style={{
                    width: Math.min(stats.tauxRecouvrement, 100) + '%',
                    '--progress-value': Math.min(stats.tauxRecouvrement, 100) + '%'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Graphiques */}
          <div className="charts-grid-2" style={{ marginTop: 24 }}>
            <BarChartCard
              titre="IR du par annee"
              data={parAnnee}
              cleX="annee"
              series={[
                { dataKey: 'irDu', name: 'IR du', couleur: '#1a5c4a' },
                { dataKey: 'soldeAPayer', name: 'Solde a payer', couleur: '#f59e0b' },
              ]}
            />
            <PieChartCard
              titre="Declarations par statut"
              data={parStatut}
              cleNom="statut"
              cleValeur="nombre"
            />
          </div>

          {/* Information complementaire */}
          <div className="info-panel" style={{ marginTop: 24 }}>
            <h2>Informations recentes</h2>
            <ul>
              <li>Derniere mise a jour : {new Date().toLocaleDateString('fr-FR')}</li>
              <li>Annee fiscale en cours : {annee}</li>
              <li>Nombre de contribuables actifs : {stats.contribuables}</li>
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
