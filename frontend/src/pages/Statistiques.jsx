import { useEffect, useState } from 'react';
import * as service from '../services/statistiqueService';
import * as exportService from '../services/exportService';
import { LoadingBlock } from '../components/Spinner';
import BarChartCard from '../components/charts/BarChartCard';
import PieChartCard from '../components/charts/PieChartCard';

const fmt = (n) => (n == null ? '0' : Number(n).toLocaleString('fr-FR').replace(/\u202f|\u00a0/g, ' '));

export default function Statistiques() {
  const [resume, setResume] = useState(null);
  const [parAnnee, setParAnnee] = useState([]);
  const [parSecteur, setParSecteur] = useState([]);
  const [parStatut, setParStatut] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      service.resume(),
      service.parAnnee(),
      service.parSecteur(),
      service.parStatut(),
    ])
      .then(([r, a, s, st]) => {
        setResume(r);
        setParAnnee(a);
        setParSecteur(s);
        setParStatut(st);
      })
      .catch((e) => setError(e.response?.data?.message || 'Erreur'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingBlock message="Chargement des statistiques..." />;

  return (
    <div className="page">
      <header className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>Statistiques</h1>
          <p className="page-sub">Analyse des donnees fiscales</p>
        </div>
        <button className="btn-primary" onClick={() => exportService.exportStatistiquesPdf()}>
          Exporter PDF
        </button>
      </header>

      {error && <div className="alert-error" style={{ marginBottom: 16 }}>{error}</div>}

      {resume && (
        <>
          {/* CARTES CHIFFRES CLES */}
          <div className="cards-grid">
            <div className="stat-card">
              <span className="stat-label">Contribuables</span>
              <span className="stat-value">{resume.contribuables}</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Declarations</span>
              <span className="stat-value">{resume.declarations}</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Paiements</span>
              <span className="stat-value">{resume.paiements}</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Acomptes</span>
              <span className="stat-value">{resume.acomptes}</span>
            </div>
          </div>

          <div className="cards-grid" style={{ marginTop: 16 }}>
            <div className="stat-card accent">
              <span className="stat-label">IR total du</span>
              <span className="stat-value">{fmt(resume.irTotal)} Ar</span>
            </div>
            <div className="stat-card accent-green">
              <span className="stat-label">Encaissement</span>
              <span className="stat-value">{fmt(resume.encaisse)} Ar</span>
            </div>
            <div className="stat-card accent-orange">
              <span className="stat-label">Reste a payer</span>
              <span className="stat-value">{fmt(resume.soldeAPayer)} Ar</span>
            </div>
            <div className="stat-card accent">
              <span className="stat-label">Taux recouvrement</span>
              <span className="stat-value">{resume.tauxRecouvrement} %</span>
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: Math.min(resume.tauxRecouvrement, 100) + '%' }}
                />
              </div>
            </div>
          </div>

          {/* GRAPHIQUES */}
          <div className="charts-grid-2" style={{ marginTop: 24 }}>
            <BarChartCard
              titre="IR du par annee"
              data={parAnnee}
              cleX="annee"
              series={[{ dataKey: 'irDu', name: 'IR du', couleur: '#1a5c4a' }]}
            />
            <BarChartCard
              titre="Nombre de declarations par annee"
              data={parAnnee}
              cleX="annee"
              series={[{ dataKey: 'nbDeclarations', name: 'Declarations', couleur: '#3b82f6' }]}
            />
          </div>

          <div className="charts-grid-2">
            <PieChartCard
              titre="Repartition de l IR par secteur"
              data={parSecteur}
              cleNom="libelle"
              cleValeur="irDu"
            />
            <PieChartCard
              titre="Declarations par statut"
              data={parStatut}
              cleNom="statut"
              cleValeur="nombre"
            />
          </div>

          {/* TABLEAU DETAIL PAR ANNEE */}
          <div className="chart-card">
            <h3 className="chart-title">Detail par annee</h3>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Annee</th>
                  <th>Declarations</th>
                  <th>IR du</th>
                  <th>Solde a payer</th>
                </tr>
              </thead>
              <tbody>
                {parAnnee.map((a) => (
                  <tr key={a.annee}>
                    <td><strong>{a.annee}</strong></td>
                    <td>{a.nbDeclarations}</td>
                    <td>{fmt(a.irDu)} Ar</td>
                    <td>{fmt(a.soldeAPayer)} Ar</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
