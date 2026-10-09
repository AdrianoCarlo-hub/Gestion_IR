import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import * as statService from '../services/statistiqueService';
import { LoadingBlock } from '../components/Spinner';
import BarChartCard from '../components/charts/BarChartCard';
import PieChartCard from '../components/charts/PieChartCard';
import { LuUsers, LuFileText, LuCreditCard, LuCalendar } from 'react-icons/lu';

const fmt = (n) =>
  n == null ? '0' : Number(n).toLocaleString('fr-FR').replace(/\u202f|\u00a0/g, ' ');

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

  if (loading) return <LoadingBlock message="Chargement du tableau de bord..." />;

  const annee = new Date().getFullYear();
  const heure = new Date().getHours();
  const salutation = heure < 12 ? 'Bonjour' : heure < 18 ? 'Bon apres-midi' : 'Bonsoir';

  return (
    <div className="dashboard-page">
      <header className="page-header">
        <h1>Tableau de bord</h1>
        <p className="page-sub">
          {salutation} {agent?.prenom} {agent?.nom} — {agent?.role}
        </p>
      </header>

      {error && <div className="alert-error">{error}</div>}

      {stats && (
        <>
          <div className="cards-grid">
            <div className="stat-card">
              <LuUsers className="stat-icon" size={20} />
              <span className="stat-label">Contribuables</span>
              <span className="stat-value">{stats.contribuables}</span>
            </div>
            <div className="stat-card">
              <LuFileText className="stat-icon" size={20} />
              <span className="stat-label">Declarations IR</span>
              <span className="stat-value">{stats.declarations}</span>
            </div>
            <div className="stat-card">
              <LuCreditCard className="stat-icon" size={20} />
              <span className="stat-label">Paiements</span>
              <span className="stat-value">{stats.paiements}</span>
            </div>
            <div className="stat-card">
              <LuCalendar className="stat-icon" size={20} />
              <span className="stat-label">Acomptes</span>
              <span className="stat-value">{stats.acomptes}</span>
            </div>
          </div>

          <div className="cards-grid financial">
            <div className="stat-card accent">
              <span className="stat-label">IR total du ({annee})</span>
              <span className="stat-value">{fmt(stats.irTotal)} Ar</span>
            </div>
            <div className="stat-card accent-green">
              <span className="stat-label">Total encaisse</span>
              <span className="stat-value">{fmt(stats.encaisse)} Ar</span>
            </div>
            <div className="stat-card accent-orange">
              <span className="stat-label">Reste a payer</span>
              <span className="stat-value">{fmt(stats.soldeAPayer)} Ar</span>
            </div>
            <div className="stat-card accent">
              <span className="stat-label">Taux de recouvrement</span>
              <span className="stat-value">{stats.tauxRecouvrement} %</span>
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: Math.min(stats.tauxRecouvrement, 100) + '%' }}
                />
              </div>
            </div>
          </div>

          <div className="charts-grid-2">
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
        </>
      )}
    </div>
  );
}
