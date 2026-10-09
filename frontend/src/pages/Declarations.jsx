import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import SearchBar from '../components/SearchBar';
import { lister as listerContribuables } from '../services/contribuableService';
import * as service from '../services/declarationService';
import DeclarationForm from './DeclarationForm';
import { LuPlus } from 'react-icons/lu';

const anneeCourante = new Date().getFullYear();
const SEUIL_REEL_OBLIGATOIRE = 400000000;

const fmt = (n) =>
  n == null ? '0' : Number(n).toLocaleString('fr-FR').replace(/\u202f|\u00a0/g, ' ');

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

  const chargerAvec = async (a) => {
    setLoading(true);
    setError('');
    try {
      const data = await service.lister(a || undefined);
      setListe(data);
    } catch (e) {
      setError(e.response?.data?.message || 'Erreur');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    charger();
    listerContribuables().then(setContribuables).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const contribuableSelectionne = contribuables.find(
    (c) => String(c.idContribuable) === String(nouveauContribuable)
  );

  const erreurAnnee = (() => {
    if (!contribuableSelectionne) return null;
    const anneeImm = contribuableSelectionne.dateImmatriculation
      ? new Date(contribuableSelectionne.dateImmatriculation).getFullYear()
      : null;
    if (anneeImm && Number(nouvelleAnnee) < anneeImm) {
      return 'L annee doit etre >= a l annee d immatriculation (' + anneeImm + ')';
    }
    if (Number(nouvelleAnnee) > anneeCourante) {
      return 'L annee ne peut pas etre dans le futur (max ' + anneeCourante + ')';
    }
    return null;
  })();

  const handleCreerDeclaration = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (erreurAnnee) {
      setError(erreurAnnee);
      return;
    }

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

  return (
    <div className="page">
      <header className="page-header">
        <h1>Declarations IR</h1>
        <p className="page-sub">Declaration annuelle avec calcul automatique de l impot</p>
      </header>

      {error && <div className="alert-error" style={{ marginBottom: 16 }}>{error}</div>}
      {success && <div className="alert-success" style={{ marginBottom: 16 }}>{success}</div>}

      {mode === 'liste' && (
        <>
          <SearchBar
            value={annee}
            onChange={(v) => {
              setAnnee(v);
              chargerAvec(v);
            }}
            placeholder="Recherche par annee (ex: 2026)"
          >
            <button type="button" className="btn-secondary" onClick={handleNouvelle}>
              <LuPlus size={14} /> Nouvelle declaration
            </button>
          </SearchBar>

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
                {loading ? (
                  <tr><td colSpan={7} style={{ textAlign: 'center' }}>Chargement...</td></tr>
                ) : liste.length === 0 ? (
                  <tr><td colSpan={7} style={{ textAlign: 'center' }}>Aucune declaration</td></tr>
                ) : (
                  liste.map((d) => (
                    <tr key={d.idDeclaration}>
                      <td>{d.contribuable ? d.contribuable.nif : '-'}</td>
                      <td>{d.contribuable ? d.contribuable.raisonSociale : '-'}</td>
                      <td>{d.annee}</td>
                      <td>{fmt(d.irDu)} Ar</td>
                      <td>{fmt(d.soldeAPayer)} Ar</td>
                      <td>
                        <span className={'badge badge-' + (d.statut || '').toLowerCase()}>
                          {d.statut}
                        </span>
                      </td>
                      <td>
                        <button className="btn-link" onClick={() => handleOuvrir(d.idDeclaration)}>
                          Ouvrir
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <p className="table-footer">{liste.length} resultat(s)</p>
        </>
      )}

      {mode === 'nouveau' && (
        <>
          <h2 className="form-title">Nouvelle declaration IR</h2>
          <form className="form-panel" onSubmit={handleCreerDeclaration}>
            <div className="form-row">
              <div className="form-group" style={{ flex: 2 }}>
                <label className="form-label">Contribuable *</label>
                <select
                  className="form-input"
                  value={nouveauContribuable}
                  onChange={(e) => setNouveauContribuable(e.target.value)}
                >
                  {contribuables.map((c) => (
                    <option key={c.idContribuable} value={c.idContribuable}>
                      {c.nif} - {c.raisonSociale}
                    </option>
                  ))}
                </select>
                {contribuableSelectionne && (
                  <span style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
                    Regime : {contribuableSelectionne.regime}
                    {' — '}
                    Immatriculation : {contribuableSelectionne.dateImmatriculation}
                  </span>
                )}
              </div>
              <div className="form-group">
                <label className="form-label">Annee *</label>
                <input
                  type="number"
                  className={'form-input ' + (erreurAnnee ? 'input-error' : '')}
                  value={nouvelleAnnee}
                  onChange={(e) => setNouvelleAnnee(e.target.value)}
                  min={2000}
                  max={anneeCourante}
                />
                {erreurAnnee && <span className="error-msg">{erreurAnnee}</span>}
              </div>
            </div>

            {contribuableSelectionne &&
             contribuableSelectionne.regime === 'REEL_OBLIGATOIRE' && (
              <div className="alert-warning" style={{ marginBottom: 12 }}>
                Regime <strong>REEL OBLIGATOIRE</strong> : le CA HT devra etre
                &ge; {fmt(SEUIL_REEL_OBLIGATOIRE)} Ar.
              </div>
            )}

            <div className="form-actions">
              <button type="submit" className="btn-primary">Creer la declaration</button>
              <button type="button" className="btn-secondary" onClick={handleRetour}>
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
