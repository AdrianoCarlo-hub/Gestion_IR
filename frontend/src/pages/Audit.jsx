import { useEffect, useState } from 'react';
import * as service from '../services/auditService';
import { LoadingBlock, SkeletonTable } from '../components/Spinner';
import { LuScrollText, LuUser, LuClock, LuDatabase, LuTriangleAlert } from "react-icons/lu";

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

  // Compiler les statistiques
  const stats = {
    totalActions: liste.length,
    todayActions: liste.filter(j => j.dateHeure?.startsWith(new Date().toISOString().slice(0, 10))).length,
    agents: [...new Set(liste.map(j => j.agent?.idAgent).filter(Boolean))].length,
    tables: [...new Set(liste.map(j => j.tableCible).filter(Boolean))].length,
  };

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1>Journal d audit</h1>
          <p className="page-sub">Tracabilite de toutes les actions</p>
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

      {/* Cartes de statistiques */}
      <div className="cards-grid" style={{ marginBottom: 24 }}>
        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-card-icon">
              <LuScrollText className="icon" style={{ width: 20, height: 20 }} />
            </div>
          </div>
          <span className="stat-label">Total actions</span>
          <span className="stat-value">{stats.totalActions}</span>
        </div>
        
        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-card-icon blue">
              <LuClock className="icon" style={{ width: 20, height: 20 }} />
            </div>
          </div>
          <span className="stat-label">Actions aujourd'hui</span>
          <span className="stat-value">{stats.todayActions}</span>
        </div>
        
        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-card-icon orange">
              <LuUser className="icon" style={{ width: 20, height: 20 }} />
            </div>
          </div>
          <span className="stat-label">Agents actifs</span>
          <span className="stat-value">{stats.agents}</span>
        </div>
        
        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-card-icon purple">
              <LuDatabase className="icon" style={{ width: 20, height: 20 }} />
            </div>
          </div>
          <span className="stat-label">Tables modifiees</span>
          <span className="stat-value">{stats.tables}</span>
        </div>
      </div>

      {loading ? (
        <SkeletonTable rows={10} cols={6} />
      ) : liste.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <LuScrollText className="icon" />
          </div>
          <h3>Aucune action enregistree</h3>
          <p>Le journal d'audit sera rempli automatiquement lors des operations</p>
        </div>
      ) : (
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
              {liste.map((j) => (
                <tr key={j.idLog}>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    {j.dateHeure?.replace('T', ' ').substring(0, 19)}
                  </td>
                  <td>
                    {j.agent ? (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <LuUser className="icon" style={{ width: 14, height: 14, color: 'var(--primary)' }} />
                        {j.agent.prenom} {j.agent.nom}
                      </span>
                    ) : 'Systeme'}
                  </td>
                  <td><strong>{j.action}</strong></td>
                  <td>
                    <span className="badge badge-info" style={{ fontSize: 11 }}>
                      {j.tableCible || '-'}
                    </span>
                  </td>
                  <td>{j.idCible || '-'}</td>
                  <td style={{ fontSize: 12 }}>{j.adresseIp || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="table-footer">{liste.length} entree(s)</p>
    </div>
  );
}
