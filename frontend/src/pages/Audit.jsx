import { useEffect, useState } from 'react';
import * as service from '../services/auditService';

export default function Audit() {
  const [liste, setListe] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    service.lister()
      .then(setListe)
      .catch((e) => setError(e.response?.data?.message || 'Erreur'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page">
      <header className="page-header">
        <h1>Journal d audit</h1>
        <p className="page-sub">Tracabilite de toutes les actions</p>
      </header>

      {error && <div className="alert-error" style={{ marginBottom: 16 }}>{error}</div>}

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Date / Heure</th>
              <th>Agent</th>
              <th>Action</th>
              <th>Table</th>
              <th>ID cible</th>
              <th>IP</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ textAlign: 'center' }}>Chargement...</td></tr>
            ) : liste.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: 'center' }}>Aucune action enregistree</td></tr>
            ) : (
              liste.map((j) => (
                <tr key={j.idLog}>
                  <td>{j.dateHeure?.replace('T', ' ').substring(0, 19)}</td>
                  <td>{j.agent ? j.agent.prenom + ' ' + j.agent.nom : 'Systeme'}</td>
                  <td><strong>{j.action}</strong></td>
                  <td>{j.tableCible || '-'}</td>
                  <td>{j.idCible || '-'}</td>
                  <td>{j.adresseIp || '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <p className="table-footer">{liste.length} entree(s)</p>
    </div>
  );
}
