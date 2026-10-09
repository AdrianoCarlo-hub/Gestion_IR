import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { lister as listerContribuables } from '../services/contribuableService';
import * as service from '../services/declarationService';
import * as exportService from '../services/exportService';
import DeclarationForm from './DeclarationForm';
import { LoadingBlock, SkeletonTable } from '../components/Spinner';
import { LuSearch, LuPlus, LuFileText, LuEye, LuCalendar, LuTriangleAlert, LuDownload, LuFilter } from "react-icons/lu";

const anneeCourante = new Date().getFullYear();

const fmt = (n) => (n == null ? '0' : Number(n).toLocaleString('fr-FR').replace(/\u202f|\u00a0/g, ' '));

export default function Declarations() {
  const { agent } = useAuth();
  const [liste, setListe] = useState([]);
  const [contribuables, setContribuables] = useState([]);
  const [annee, setAnnee] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [mode, setMode] = useState('liste');
  const [idEnEdition, setIdEnEdition] = useState(null);
  const [nouveauContribuable, setNouveauContribuable] = useState('');
  const [nouvelleAnnee, setNouvelleAnnee] = useState(anneeCourante);

  const charger = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await service.lister(annee || undefined);
      setListe(data);
    } catch (e) {
      setError(e.response?.data?.message || 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    charger();
    listerContribuables().then(setContribuables).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRecherche = (e) => {
    e.preventDefault();
    charger();
  };

  const handleNouvelle = () => {
    if (contribuables.length === 0) {
      setError('Aucun contribuable disponible. Creez-en un d abord.');
      return;
    }
    setNouveauContribuable(String(contribuables[0].idContribuable));
    setNouvelleAnnee(anneeCourante);
    setMode('nouveau');
    setError('');
    setSuccess('');
  };

  const handleCreerDeclaration = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const payload = {
        idContribuable: Number(nouveauContribuable),
        annee: Number(nouvelleAnnee),
        dateDebut: nouvelleAnnee + '-01-01',
        dateFin: nouvelleAnnee + '-12-31',
        idAgent: agent?.idAgent || 3,
      };
      const d = await service.creer(payload);
      setIdEnEdition(d.idDeclaration);
      setMode('editer');
      setSuccess('Declaration creee (brouillon)');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Erreur');
    }
  };

  const handleOuvrir = (id) => {
    setIdEnEdition(id);
    setMode('editer');
    setError('');
    setSuccess('');
  };

  const handleRetour = () => {
    setMode('liste');
    setIdEnEdition(null);
    charger();
  };

  // Filtrer les declarations en retard
  const declarationsEnRetard = liste.filter(d => d.statut === 'EN_RETARD');

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1>Declarations IR</h1>
          <p className="page-sub">Declaration annuelle avec calcul automatique de l impot</p>
        </div>
        <button className="btn btn-primary" onClick={handleNouvelle}>
          <LuPlus className="icon" />
          Nouvelle declaration
        </button>
      </header>

      {error && (
        <div className="alert alert-error" style={{ marginBottom: 16 }}>
          <span className="alert-icon">
            <LuTriangleAlert className="icon" />
          </span>
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="alert alert-success" style={{ marginBottom: 16 }}>
          <span className="alert-icon">
            <LuTriangleAlert className="icon" />
          </span>
          <span>{success}</span>
        </div>
      )}

      {mode === 'liste' && (
        <>
          <form className="search-bar" onSubmit={handleRecherche}>
            <div className="search-input-wrapper">
              <LuSearch className="search-input-icon" />
              <input
                type="number"
                className="form-input form-input-with-icon"
                placeholder="Annee (ex: 2026)"
                value={annee}
                onChange={(e) => setAnnee(e.target.value)}
              />
            </div>
            <button type="submit" className="btn btn-secondary">
              <LuSearch className="icon" />
              Rechercher
            </button>
            <button type="button" className="btn btn-outline" onClick={() => exportService.exportDeclarations()}>
              <LuDownload className="icon" />
              Exporter Excel
            </button>
          </form>

          {/* Alerte si declarations en retard */}
          {declarationsEnRetard.length > 0 && (
            <div className="alert alert-warning" style={{ marginBottom: 16 }}>
              <span className="alert-icon">
                <LuTriangleAlert className="icon" />
              </span>
              <span>
                {declarationsEnRetard.length} declaration(s) en retard de paiement
              </span>
            </div>
          )}

          {loading ? (
            <SkeletonTable rows={5} cols={7} />
          ) : liste.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">
                <LuFileText className="icon" />
              </div>
              <h3>Aucune declaration</h3>
              <p>Creez une nouvelle declaration pour commencer</p>
              <button className="btn btn-primary" onClick={handleNouvelle}>
                <LuPlus className="icon" />
                Nouvelle declaration
              </button>
            </div>
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>NIF</th>
                    <th>Contribuable</th>
                    <th>Annee</th>
                    <th>IR du</th>
                    <th>Solde a payer</th>
                    <th>Statut</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {liste.map((d) => (
                    <tr key={d.idDeclaration}>
                      <td>{d.contribuable?.nif || '-'}</td>
                      <td>{d.contribuable?.raisonSociale || '-'}</td>
                      <td>{d.annee}</td>
                      <td className={d.irDu > 1000000 ? 'font-bold' : ''}>
                        {fmt(d.irDu)} Ar
                      </td>
                      <td className={d.soldeAPayer > 0 ? 'text-danger font-semibold' : ''}>
                        {fmt(d.soldeAPayer)} Ar
                      </td>
                      <td>
                        <span className={'badge badge-' + (d.statut || '').toLowerCase()}>
                          {d.statut}
                        </span>
                        {d.statut === 'EN_RETARD' && (
                          <span 
                            className="badge badge-danger" 
                            style={{ marginLeft: 4, fontSize: 10 }}
                            title="En retard"
                          >
                            ⚠️
                          </span>
                        )}
                      </td>
                      <td>
                        <button className="btn-link" onClick={() => handleOuvrir(d.idDeclaration)}>
                          <LuEye className="icon" style={{ width: 14, height: 14, verticalAlign: 'middle', marginRight: 4 }} />
                          Ouvrir
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <p className="table-footer">{liste.length} resultat(s)</p>
        </>
      )}

      {mode === 'nouveau' && (
        <>
          <div className="decl-header">
            <div>
              <h2 className="form-title">Nouvelle declaration IR</h2>
              <p className="page-sub">
                Creer une declaration pour l'annee fiscale
              </p>
            </div>
            <button className="btn btn-secondary" onClick={handleRetour}>
              Retour a la liste
            </button>
          </div>
          <form className="form-panel" onSubmit={handleCreerDeclaration}>
            <div className="form-row">
              <div className="form-group" style={{ flex: 2 }}>
                <label className="form-label">Contribuable *</label>
                <select
                  className="form-select"
                  value={nouveauContribuable}
                  onChange={(e) => setNouveauContribuable(e.target.value)}
                >
                  {contribuables.map((c) => (
                    <option key={c.idContribuable} value={c.idContribuable}>
                      {c.nif} - {c.raisonSociale}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Annee *</label>
                <input
                  type="number"
                  className="form-input"
                  value={nouvelleAnnee}
                  onChange={(e) => setNouvelleAnnee(e.target.value)}
                  min={2000}
                  max={2100}
                />
              </div>
            </div>
            <div className="form-actions">
              <button type="submit" className="btn btn-primary">
                <LuFileText className="icon" />
                Creer la declaration
              </button>
              <button type="button" className="btn btn-secondary" onClick={handleRetour}>
                Annuler
              </button>
            </div>
          </form>
        </>
      )}

      {mode === 'editer' && idEnEdition && (
        <DeclarationForm
          idDeclaration={idEnEdition}
          onRetour={handleRetour}
        />
      )}
    </div>
  );
}
