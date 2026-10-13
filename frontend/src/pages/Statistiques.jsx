import { useEffect, useState } from 'react';
import * as statService from '../services/statistiqueService';
import { LoadingBlock } from '../components/Spinner';
import BarChartCard from '../components/charts/BarChartCard';
import PieChartCard from '../components/charts/PieChartCard';

const fmt = (n) =>
  n == null ? '0' : Number(n).toLocaleString('fr-FR').replace(/\u202f|\u00a0/g, ' ');

export default function Statistiques() {
  const [resume, setResume] = useState(null);
  const [parAnnee, setParAnnee] = useState([]);
  const [parSecteur, setParSecteur] = useState([]);
  const [parStatut, setParStatut] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      statService.resume(),
      statService.parAnnee(),
      statService.parSecteur(),
      statService.parStatut(),
    ])
      .then(([r, a, s, st]) => {
        setResume(r);
        setParAnnee(a);
        setParSecteur(s);
        setParStatut(st);
      })
      .catch((e) => setError(e.response?.data?.message || 'Erreur de chargement'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingBlock message="Chargement des statistiques..." />;

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1>Statistiques</h1>
          <p className="page-sub">Synthese de l impot sur le revenu</p>
        </div>
      </header>

      {error && <div className="alert-error">{error}</div>}

      {resume && (
        <div className="cards-grid financial" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
          <div className="stat-card accent">
            <span className="stat-label">IR total du</span>
            <span className="stat-value">{fmt(resume.irTotal)} Ar</span>
          </div>
          <div className="stat-card accent-green">
            <span className="stat-label">Total encaisse</span>
            <span className="stat-value">{fmt(resume.encaisse)} Ar</span>
          </div>
          <div className="stat-card accent-orange">
            <span className="stat-label">Reste a payer</span>
            <span className="stat-value">{fmt(resume.soldeAPayer)} Ar</span>
          </div>
          <div className="stat-card accent">
            <span className="stat-label">Taux de recouvrement</span>
            <span className="stat-value">{resume.tauxRecouvrement} %</span>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: Math.min(resume.tauxRecouvrement, 100) + '%' }}
              />
            </div>
          </div>
        </div>
      )}

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

      <div className="charts-grid-2">
        <BarChartCard
          titre="IR du par secteur"
          data={parSecteur}
          cleX="code"
          series={[{ dataKey: 'irDu', name: 'IR du', couleur: '#3b82f6' }]}
        />

        <div className="chart-card">
          <h3 className="chart-title">Detail par secteur</h3>
          {parSecteur.length === 0 ? (
            <p style={{ color: '#94a3b8', fontSize: 13, padding: 12 }}>Aucune donnee</p>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Secteur</th>
                  <th>Declarations</th>
                  <th>IR du</th>
                </tr>
              </thead>
              <tbody>
                {parSecteur.map((s) => (
                  <tr key={s.code}>
                    <td>{s.libelle}</td>
                    <td>{s.nbDeclarations}</td>
                    <td><strong>{fmt(s.irDu)} Ar</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
