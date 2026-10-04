import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import ContribuableForm from '../components/ContribuableForm';
import * as service from '../services/contribuableService';

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

  return (
    <div className="page">
      <header className="page-header">
        <h1>Contribuables</h1>
        <p className="page-sub">Gestion des contribuables soumis a l'IR</p>
      </header>

      {error && <div className="alert-error" style={{ marginBottom: 16 }}>{error}</div>}
      {success && <div className="alert-success" style={{ marginBottom: 16 }}>{success}</div>}

      {mode === 'liste' && (
        <>
          <form className="search-bar" onSubmit={handleRecherche}>
            <input
              className="form-input"
              placeholder="Recherche (NIF, nom, STAT, telephone)"
              value={motCle}
              onChange={(e) => setMotCle(e.target.value)}
            />
            <select
              className="form-input"
              value={statut}
              onChange={(e) => setStatut(e.target.value)}
            >
              <option value="">Tous statuts</option>
              <option value="ACTIF">Actif</option>
              <option value="SUSPENDU">Suspendu</option>
              <option value="CESSE">Cesse</option>
              <option value="RADIE">Radie</option>
            </select>
            <button type="submit" className="btn-primary">Rechercher</button>
            <button type="button" className="btn-secondary" onClick={handleNouveau}>
              + Nouveau contribuable
            </button>
          </form>

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
                {loading ? (
                  <tr><td colSpan={6} style={{ textAlign: 'center' }}>Chargement...</td></tr>
                ) : liste.length === 0 ? (
                  <tr><td colSpan={6} style={{ textAlign: 'center' }}>Aucun contribuable</td></tr>
                ) : (
                  liste.map((c) => (
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
                        <button className="btn-link" onClick={() => handleEditer(c.idContribuable)}>
                          Modifier
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

      {mode === 'form' && (
        <>
          <h2 className="form-title">
            {enEdition ? 'Modifier un contribuable' : 'Nouveau contribuable'}
          </h2>
          <ContribuableForm
            initial={enEdition}
            onSubmit={handleSubmit}
            onCancel={() => { setMode('liste'); setEnEdition(null); }}
          />
        </>
      )}
    </div>
  );
}
