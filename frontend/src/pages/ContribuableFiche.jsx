import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { trouver } from '../services/contribuableService';
import * as situationService from '../services/situationService';
import { LoadingBlock } from '../components/Spinner';
import {
  LuArrowLeft,
  LuUser,
  LuFileText,
  LuCreditCard,
  LuTriangleAlert,
  LuCircleCheck,
} from 'react-icons/lu';

const fmt = (n) =>
  n == null ? '0' : Number(n).toLocaleString('fr-FR').replace(/\u202f|\u00a0/g, ' ');

export default function ContribuableFiche() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [contribuable, setContribuable] = useState(null);
  const [situation, setSituation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      trouver(id),
      situationService.getSituationFiscale(id),
    ])
      .then(([c, s]) => {
        setContribuable(c);
        setSituation(s);
      })
      .catch((e) => setError(e.response?.data?.message || 'Erreur'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <LoadingBlock message="Chargement de la fiche..." />;
  if (error) return <div className="page"><div className="alert-error">{error}</div></div>;
  if (!contribuable) return null;

  const statutFiscal = (() => {
    if (!situation) return 'inconnu';
    if (situation.enRetard) return 'retard';
    if (situation.resteAPayer > 0) return 'a_payer';
    return 'a_jour';
  })();

  const badgeConfig = {
    a_jour:  { classe: 'badge-actif',    label: 'A jour',    icone: LuCircleCheck },
    a_payer: { classe: 'badge-suspendu', label: 'A payer',   icone: LuFileText },
    retard:  { classe: 'badge-radie',    label: 'En retard', icone: LuTriangleAlert },
    inconnu: { classe: 'badge-cesse',    label: 'Inconnu',   icone: LuFileText },
  };
  const Badge = badgeConfig[statutFiscal];
  const IconeBadge = Badge.icone;

  return (
    <div className="page">
      {/* En-tete */}
      <div className="decl-header">
        <div>
          <button className="btn-link" onClick={() => navigate('/contribuables')}>
            <LuArrowLeft size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />
            Retour a la liste
          </button>
          <h1 style={{ fontSize: 22, color: 'var(--teal)', marginTop: 8 }}>
            {contribuable.raisonSociale}
          </h1>
          <p className="page-sub">
            NIF : <strong>{contribuable.nif}</strong>
            {' — '}
            {contribuable.formeJuridique}
            {contribuable.secteur && ' — ' + contribuable.secteur.libelle}
          </p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
          <span
            className={'badge ' + Badge.classe}
            style={{ fontSize: 13, padding: '6px 14px', display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <IconeBadge size={14} />
            {Badge.label}
          </span>
        </div>
      </div>

      {/* Cartes financieres */}
      {situation && (
        <div className="cards-grid financial" style={{ marginTop: 16 }}>
          <div className="stat-card accent">
            <span className="stat-label">Total IR du</span>
            <span className="stat-value">{fmt(situation.totalDu)} Ar</span>
          </div>
          <div className="stat-card accent-green">
            <span className="stat-label">Total paye</span>
            <span className="stat-value">{fmt(situation.totalPaye)} Ar</span>
          </div>
          <div className="stat-card accent-orange">
            <span className="stat-label">Reste a payer</span>
            <span className="stat-value">{fmt(situation.resteAPayer)} Ar</span>
          </div>
          <div className="stat-card accent">
            <span className="stat-label">Declarations impayees</span>
            <span className="stat-value">{situation.nbDeclarationsImpayees}</span>
          </div>
        </div>
      )}

      <div className="charts-grid-2" style={{ marginTop: 20 }}>
        {/* Colonne 1 : Informations + Declarations */}
        <div>
          <div className="form-panel" style={{ marginBottom: 16 }}>
            <h3 className="section-title">
              <LuUser size={14} style={{ marginRight: 8, verticalAlign: 'middle' }} />
              Informations generales
            </h3>
            <table className="info-table">
              <tbody>
                <tr><td>NIF</td><td><strong>{contribuable.nif}</strong></td></tr>
                {contribuable.stat && <tr><td>STAT</td><td>{contribuable.stat}</td></tr>}
                <tr><td>Dirigeant</td><td>{contribuable.nomDirigeant}</td></tr>
                <tr><td>CIN</td><td>{contribuable.cinDirigeant}</td></tr>
                <tr><td>Adresse</td><td>{contribuable.adresse}</td></tr>
                {contribuable.telephone && <tr><td>Telephone</td><td>{contribuable.telephone}</td></tr>}
                {contribuable.email && <tr><td>E-mail</td><td>{contribuable.email}</td></tr>}
                <tr><td>Secteur</td><td>{contribuable.secteur ? contribuable.secteur.libelle : '-'}</td></tr>
                <tr><td>Regime</td><td>{contribuable.regime}</td></tr>
                <tr><td>Date immatriculation</td><td>{contribuable.dateImmatriculation}</td></tr>
                <tr><td>Statut</td><td>
                  <span className={'badge badge-' + (contribuable.statut || '').toLowerCase()}>
                    {contribuable.statut}
                  </span>
                </td></tr>
              </tbody>
            </table>
          </div>

          <div className="form-panel">
            <h3 className="section-title">
              <LuFileText size={14} style={{ marginRight: 8, verticalAlign: 'middle' }} />
              Declarations ({situation && situation.declarations ? situation.declarations.length : 0})
            </h3>
            {!situation || !situation.declarations || situation.declarations.length === 0 ? (
              <p style={{ color: '#94a3b8', fontSize: 13 }}>Aucune declaration</p>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Annee</th>
                    <th>IR du</th>
                    <th>Solde</th>
                    <th>Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {situation.declarations.map((d) => (
                    <tr key={d.idDeclaration}>
                      <td><strong>{d.annee}</strong></td>
                      <td>{fmt(d.irDu)} Ar</td>
                      <td style={{
                        color: d.soldeAPayer > 0 ? '#dc2626' : '#10b981',
                        fontWeight: 600
                      }}>
                        {fmt(d.soldeAPayer)} Ar
                      </td>
                      <td>
                        <span className={'badge badge-' + (d.statut || '').toLowerCase()}>
                          {d.statut}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Colonne 2 : Paiements */}
        <div>
          <div className="form-panel">
            <h3 className="section-title">
              <LuCreditCard size={14} style={{ marginRight: 8, verticalAlign: 'middle' }} />
              Paiements ({situation && situation.paiements ? situation.paiements.length : 0})
            </h3>
            {!situation || !situation.paiements || situation.paiements.length === 0 ? (
              <p style={{ color: '#94a3b8', fontSize: 13 }}>Aucun paiement</p>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Quittance</th>
                    <th>Date</th>
                    <th>Montant</th>
                    <th>Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {situation.paiements.map((p) => (
                    <tr key={p.idPaiement} style={{ opacity: p.annule ? 0.5 : 1 }}>
                      <td><strong>{p.referenceQuittance}</strong></td>
                      <td>{p.datePaiement}</td>
                      <td>{fmt(p.montantAr)} Ar</td>
                      <td>
                        <span className={'badge badge-' + (p.annule ? 'radie' : 'actif')}>
                          {p.annule ? 'ANNULE' : 'VALIDE'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
