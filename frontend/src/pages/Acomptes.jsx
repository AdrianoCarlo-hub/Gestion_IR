import { useEffect, useState } from 'react';
import * as service from '../services/acompteService';

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

  return (
    <div className="page">
      <header className="page-header">
        <h1>Acomptes</h1>
        <p className="page-sub">Suivi des acomptes (2 x 50 % de l IR N-1)</p>
      </header>

      {error && <div className="alert-error" style={{ marginBottom: 16 }}>{error}</div>}

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
            {loading ? (
              <tr><td colSpan={8} style={{ textAlign: 'center' }}>Chargement...</td></tr>
            ) : liste.length === 0 ? (
              <tr><td colSpan={8} style={{ textAlign: 'center' }}>Aucun acompte</td></tr>
            ) : (
              liste.map((a) => (
                <tr key={a.idAcompte}>
                  <td>{a.contribuable?.raisonSociale || '-'}</td>
                  <td>{a.annee}</td>
                  <td>{a.numero}</td>
                  <td>{a.tauxPct} %</td>
                  <td>{fmt(a.baseIrN1)} Ar</td>
                  <td>{fmt(a.montantAr)} Ar</td>
                  <td>{a.dateEcheance}</td>
                  <td><span className={'badge badge-' + (a.statut || '').toLowerCase()}>{a.statut}</span></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <p className="table-footer">{liste.length} resultat(s)</p>
    </div>
  );
}
