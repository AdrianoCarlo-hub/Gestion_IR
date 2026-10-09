import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import * as statService from '../services/statistiqueService';
import { LoadingBlock } from '../components/Spinner';
import BarChartCard from '../components/charts/BarChartCard';
import PieChartCard from '../components/charts/PieChartCard';
import {
  LuUsers,
  LuFileText,
  LuCreditCard,
  LuCalendar,
  LuTriangleAlert,
  LuCircleAlert,
  LuClock,
} from 'react-icons/lu';

const fmt = (n) =>
  n == null ? '0' : Number(n).toLocaleString('fr-FR').replace(/\u202f|\u00a0/g, ' ');

export default function Dashboard() {
  const { agent } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [parAnnee, setParAnnee] = useState([]);
  const [parStatut, setParStatut] = useState([]);
  const [alertes, setAlertes] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      statService.resume(),
      statService.parAnnee(),
      statService.parStatut(),
      statService.alertes().catch(() => null),
    ])
      .then(([r, a, s, al]) => {
        setStats(r);
        setParAnnee(a);
        setParStatut(s);
        setAlertes(al);
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
          {/* 4 cartes KPI compactes */}
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

          {/* 5 cartes financieres (ajout : en retard) */}
          <div className="cards-grid financial" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
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
            <div className="stat-card accent" style={{ borderLeftColor: '#dc2626' }}>
              <LuCircleAlert className="stat-icon" size={20} style={{ color: '#dc2626' }} />
              <span className="stat-label">Contribuables en retard</span>
              <span className="stat-value" style={{ color: '#dc2626' }}>
                {alertes ? alertes.nbContribuablesEnRetard : stats.nbEnRetard || 0}
              </span>
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

          {/* Graphiques */}
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

          {/* Section Alertes */}
          {alertes && (
            <div className="charts-grid-2">
              {/* Top 5 impayes */}
              <div className="chart-card">
                <h3 className="chart-title">
                  <LuTriangleAlert size={14} style={{ marginRight: 8, color: '#dc2626' }} />
                  Top 5 des impayes ({fmt(alertes.montantTotalImpaye)} Ar au total)
                </h3>
                {alertes.top5Impayes.length === 0 ? (
                  <p style={{ color: '#94a3b8', fontSize: 13, padding: 12 }}>
                    Aucun impaye
                  </p>
                ) : (
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>NIF</th>
                        <th>Contribuable</th>
                        <th>Solde</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {alertes.top5Impayes.map((c) => (
                        <tr key={c.idContribuable}>
                          <td><strong>{c.nif}</strong></td>
                          <td>{c.raisonSociale}</td>
                          <td style={{ color: '#dc2626', fontWeight: 600 }}>
                            {fmt(c.soldeAPayer)} Ar
                          </td>
                          <td>
                            <button
                              className="btn-link"
                              onClick={() => navigate('/contribuables/' + c.idContribuable)}
                            >
                              Voir
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Echeances proches */}
              <div className="chart-card">
                <h3 className="chart-title">
                  <LuClock size={14} style={{ marginRight: 8, color: '#f59e0b' }} />
                  Echeances dans les 30 jours ({alertes.acomptesAvenir.length})
                </h3>
                {alertes.acomptesAvenir.length === 0 ? (
                  <p style={{ color: '#94a3b8', fontSize: 13, padding: 12 }}>
                    Aucune echeance imminente
                  </p>
                ) : (
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Contribuable</th>
                        <th>N°</th>
                        <th>Echeance</th>
                        <th>Montant</th>
                        <th>Dans</th>
                      </tr>
                    </thead>
                    <tbody>
                      {alertes.acomptesAvenir.map((a) => (
                        <tr key={a.idAcompte}>
                          <td>{a.raisonSociale}</td>
                          <td>{a.annee} n°{a.numero}</td>
                          <td>{a.dateEcheance}</td>
                          <td>{fmt(a.montant)} Ar</td>
                          <td>
                            <span className={'badge ' + (a.joursRestants <= 7 ? 'badge-radie' : 'badge-suspendu')}>
                              {a.joursRestants} j
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
