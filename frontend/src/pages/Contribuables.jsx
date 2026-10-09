import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import ContribuableForm from '../components/ContribuableForm';
import * as service from '../services/contribuableService';
import * as exportService from '../services/exportService';
import { LoadingBlock, SkeletonTable } from '../components/Spinner';
import { LuSearch, LuPlus, LuPencil, LuEye, LuTrash2, LuDownload, LuUsers, LuFilter, LuCircleAlert } from "react-icons/lu";

export default function Contribuables() {
  const { agent } = useAuth();
  const [liste, setListe] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [motCle, setMotCle] = useState('');
  const [statut, setStatut] = useState('');
  const [mode, setMode] = useState('liste');
  const [enEdition, setEnEdition] = useState(null);

  const charger = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await service.lister({ motCle, statut });
      setListe(data);
    } catch (e) {
      setError(e.response?.data?.message || 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    charger();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRecherche = (e) => {
    e.preventDefault();
    charger();
  };

  const handleNouveau = () => {
    setEnEdition(null);
    setMode('form');
    setSuccess('');
  };

  const handleEditer = async (id) => {
    try {
      const c = await service.trouver(id);
      setEnEdition({
        ...c,
        idSecteur: c.secteur?.idSecteur || '',
      });
      setMode('form');
      setSuccess('');
    } catch (e) {
      setError(e.response?.data?.message || 'Erreur');
    }
  };

  const handleVoir = async (id) => {
    try {
      const c = await service.trouver(id);
      setEnEdition({
        ...c,
        idSecteur: c.secteur?.idSecteur || '',
      });
      setMode('view');
      setSuccess('');
    } catch (e) {
      setError(e.response?.data?.message || 'Erreur');
    }
  };

  const handleRetour = () => {
    setMode('liste');
    setEnEdition(null);
    setSuccess('');
    setError('');
  };

  const handleSubmit = async (payload) => {
    try {
      setError('');
      if (enEdition) {
        await service.modifier(enEdition.idContribuable, payload);
        setSuccess('Contribuable modifie avec succes');
      } else {
        await service.creer({
          ...payload,
          centre: { idCentre: 1 },
          agent: { idAgent: agent?.idAgent || 3 },
        });
        setSuccess('Contribuable cree avec succes');
      }
      setMode('liste');
      charger();
    } catch (e) {
      setError(e.response?.data?.message || 'Erreur');
    }
  };

  const statuts = [
    { value: '', label: 'Tous statuts' },
    { value: 'ACTIF', label: 'Actif' },
    { value: 'SUSPENDU', label: 'Suspendu' },
    { value: 'CESSE', label: 'Cesse' },
    { value: 'RADIE', label: 'Radie' },
  ];

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1>Contribuables</h1>
          <p className="page-sub">Gestion des contribuables soumis a l'IR</p>
        </div>
        <button className="btn btn-primary" onClick={handleNouveau}>
          <LuPlus className="icon" />
          Nouveau
        </button>
      </header>

      {error && (
        <div className="alert alert-error" style={{ marginBottom: 16 }}>
          <span className="alert-icon">
            <LuCircleAlert className="icon" />
          </span>
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="alert alert-success" style={{ marginBottom: 16 }}>
          <span className="alert-icon">
            <LuCircleAlert className="icon" />
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
                className="form-input form-input-with-icon"
                placeholder="Recherche (NIF, nom, STAT, telephone)"
                value={motCle}
                onChange={(e) => setMotCle(e.target.value)}
              />
            </div>
            <select
              className="form-select"
              value={statut}
              onChange={(e) => setStatut(e.target.value)}
            >
              {statuts.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
            <button type="submit" className="btn btn-secondary">
              <LuSearch className="icon" />
              Rechercher
            </button>
            <button 
              type="button" 
              className="btn btn-outline"
              onClick={() => exportService.exportContribuables()}
            >
              <LuDownload className="icon" />
              Exporter Excel
            </button>
          </form>

          {loading ? (
            <SkeletonTable rows={5} cols={6} />
          ) : liste.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">
                <LuUsers className="icon" />
              </div>
              <h3>Aucun contribuable</h3>
              <p>Commencez par ajouter un contribuable pour gerer l'IR</p>
              <button className="btn btn-primary" onClick={handleNouveau}>
                <LuPlus className="icon" />
                Ajouter un contribuable
              </button>
            </div>
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>NIF</th>
                    <th>Raison sociale</th>
                    <th>Dirigeant</th>
                    <th>Regime</th>
                    <th>Statut</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {liste.map((c) => (
                    <tr key={c.idContribuable}>
                      <td><strong>{c.nif}</strong></td>
                      <td>{c.raisonSociale}</td>
                      <td>{c.nomDirigeant}</td>
                      <td>{c.regime === 'REEL_OBLIGATOIRE' ? 'Reel oblig.' : 'Reel option'}</td>
                      <td>
                        <span className={'badge badge-' + c.statut?.toLowerCase()}>
                          {c.statut}
                        </span>
                      </td>
                      <td>
                        <div className="table-actions">
                          <button 
                            className="btn-icon"
                            onClick={() => handleVoir(c.idContribuable)}
                            title="Voir"
                          >
                            <LuEye className="icon" />
                          </button>
                          <button 
                            className="btn-icon"
                            onClick={() => handleEditer(c.idContribuable)}
                            title="Modifier"
                          >
                            <LuPencil className="icon" />
                          </button>
                        </div>
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

      {mode === 'view' && enEdition && (
        <>
          <div className="decl-header">
            <div>
              <h2 className="form-title">Fiche contribuable</h2>
              <p className="page-sub">
                NIF : {enEdition.nif} | STAT : {enEdition.stat || 'N/A'}
              </p>
            </div>
            <button className="btn btn-secondary" onClick={handleRetour}>
              Retour a la liste
            </button>
          </div>
          
          <div className="form-panel">
            <h3 className="section-title">
              <LuUsers className="section-icon" />
              Informations generales
            </h3>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Raison sociale</label>
                <div className="form-input" style={{ padding: '10px 12px', background: 'var(--bg-hover)' }}>
                  {enEdition.raisonSociale}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Forme juridique</label>
                <div className="form-input" style={{ padding: '10px 12px', background: 'var(--bg-hover)' }}>
                  {enEdition.formeJuridique}
                </div>
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Nom du dirigeant</label>
                <div className="form-input" style={{ padding: '10px 12px', background: 'var(--bg-hover)' }}>
                  {enEdition.nomDirigeant}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">CIN du dirigeant</label>
                <div className="form-input" style={{ padding: '10px 12px', background: 'var(--bg-hover)' }}>
                  {enEdition.cinDirigeant}
                </div>
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Adresse</label>
                <div className="form-input" style={{ padding: '10px 12px', background: 'var(--bg-hover)' }}>
                  {enEdition.adresse}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Telephone</label>
                <div className="form-input" style={{ padding: '10px 12px', background: 'var(--bg-hover)' }}>
                  {enEdition.telephone || 'N/A'}
                </div>
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Email</label>
                <div className="form-input" style={{ padding: '10px 12px', background: 'var(--bg-hover)' }}>
                  {enEdition.email || 'N/A'}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Secteur</label>
                <div className="form-input" style={{ padding: '10px 12px', background: 'var(--bg-hover)' }}>
                  {enEdition.secteur?.libelle || 'N/A'}
                </div>
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Regime</label>
                <div className="form-input" style={{ padding: '10px 12px', background: 'var(--bg-hover)' }}>
                  {enEdition.regime === 'REEL_OBLIGATOIRE' ? 'Reel obligatoire' : 'Reel sur option'}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Statut</label>
                <div className="form-input" style={{ padding: '10px 12px', background: 'var(--bg-hover)' }}>
                  <span className={'badge badge-' + (enEdition.statut || '').toLowerCase()}>
                    {enEdition.statut}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="form-actions">
            <button className="btn btn-secondary" onClick={handleRetour}>
              Retour
            </button>
            <button className="btn btn-primary" onClick={() => handleEditer(enEdition.idContribuable)}>
              <LuPencil className="icon" />
              Modifier
            </button>
          </div>
        </>
      )}

      {mode === 'form' && (
        <>
          <div className="decl-header">
            <div>
              <h2 className="form-title">
                {enEdition ? 'Modifier un contribuable' : 'Nouveau contribuable'}
              </h2>
              <p className="page-sub">
                Remplissez tous les champs obligatoires marque par *
              </p>
            </div>
            <button className="btn btn-secondary" onClick={handleRetour}>
              Retour a la liste
            </button>
          </div>
          <ContribuableForm
            initial={enEdition}
            onSubmit={handleSubmit}
            onCancel={handleRetour}
          />
        </>
      )}
    </div>
  );
}
