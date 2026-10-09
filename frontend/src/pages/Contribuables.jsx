import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ContribuableForm from '../components/ContribuableForm';
import StatutModal from '../components/StatutModal';
import { useToast } from '../context/ToastContext';
import * as service from '../services/contribuableService';
import * as statutService from '../services/statutService';
import {
  LuUser,
  LuPencil,
  LuCircleAlert,
  LuPlus,
  LuSearch,
  LuFileText,
} from 'react-icons/lu';

const STATUTS_CONTRIBUABLE = [
  { value: 'ACTIF',    label: 'Actif',    couleur: '#10b981' },
  { value: 'SUSPENDU', label: 'Suspendu', couleur: '#f59e0b' },
  { value: 'CESSE',    label: 'Cesse',    couleur: '#64748b' },
  { value: 'RADIE',    label: 'Radie',    couleur: '#dc2626' },
];

export default function Contribuables() {
  const { agent } = useAuth();
  const toast = useToast();
  const [liste, setListe] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [motCle, setMotCle] = useState('');
  const [statut, setStatut] = useState('');
  const [mode, setMode] = useState('liste');
  const [enEdition, setEnEdition] = useState(null);
  const [statutModal, setStatutModal] = useState(null);

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
  };

  const handleEditer = async (id) => {
    try {
      const c = await service.trouver(id);
      setEnEdition({ ...c, idSecteur: c.secteur?.idSecteur || '' });
      setMode('form');
    } catch (e) {
      setError(e.response?.data?.message || 'Erreur');
    }
  };

  const handleSubmit = async (payload) => {
    try {
      setError('');
      if (enEdition) {
        await service.modifier(enEdition.idContribuable, payload);
        toast.success('Contribuable modifie avec succes');
      } else {
        await service.creer({
          ...payload,
          centre: { idCentre: 1 },
          agent: { idAgent: agent?.idAgent || 3 },
        });
        toast.success('Contribuable cree avec succes');
      }
      setMode('liste');
      charger();
    } catch (e) {
      setError(e.response?.data?.message || 'Erreur');
    }
  };

  const handleChangerStatut = async (nouveauStatut) => {
    try {
      await statutService.changerStatutContribuable(statutModal.id, nouveauStatut);
      toast.success('Statut change : ' + nouveauStatut);
      charger();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Erreur');
    }
  };

  return (
    <div className="page">
      <header className="page-header">
        <h1>Contribuables</h1>
        <p className="page-sub">Gestion des contribuables soumis a l IR</p>
      </header>

      {error && <div className="alert-error" style={{ marginBottom: 16 }}>{error}</div>}

      {mode === 'liste' && (
        <>
          <form className="search-bar" onSubmit={handleRecherche}>
            <div className="search-input-wrapper">
              <LuSearch className="search-icon" size={16} />
              <input
                className="search-input form-input"
                placeholder="Recherche (NIF, nom, STAT, telephone)"
                value={motCle}
                onChange={(e) => setMotCle(e.target.value)}
              />
            </div>
            <select
              className="form-input"
              value={statut}
              onChange={(e) => setStatut(e.target.value)}
              style={{ maxWidth: 180 }}
            >
              <option value="">Tous statuts</option>
              <option value="ACTIF">Actif</option>
              <option value="SUSPENDU">Suspendu</option>
              <option value="CESSE">Cesse</option>
              <option value="RADIE">Radie</option>
            </select>
            <button type="submit" className="btn-primary">
              <LuSearch size={14} /> Rechercher
            </button>
            <button type="button" className="btn-secondary" onClick={handleNouveau}>
              <LuPlus size={14} /> Nouveau contribuable
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
                        <span className={'badge badge-' + (c.statut || '').toLowerCase()}>
                          {c.statut}
                        </span>
                      </td>
                      <td>
                        <Link
                          className="btn-link"
                          to={'/contribuables/' + c.idContribuable}
                          title="Voir la fiche"
                          style={{ marginRight: 12, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                        >
                          <LuUser size={14} /> Fiche
                        </Link>
                        <button
                          className="btn-link"
                          onClick={() => handleEditer(c.idContribuable)}
                          title="Modifier"
                          style={{ marginRight: 12, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                        >
                          <LuPencil size={14} /> Modifier
                        </button>
                        <button
                          className="btn-link"
                          onClick={() =>
                            setStatutModal({
                              id: c.idContribuable,
                              statutActuel: c.statut,
                              nom: c.raisonSociale,
                            })
                          }
                          title="Changer le statut"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                        >
                          <LuCircleAlert size={14} /> Statut
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

      <StatutModal
        ouvert={!!statutModal}
        titre={statutModal ? 'Changer le statut - ' + statutModal.nom : ''}
        statutActuel={statutModal ? statutModal.statutActuel : ''}
        options={STATUTS_CONTRIBUABLE}
        onChoisir={handleChangerStatut}
        onFermer={() => setStatutModal(null)}
      />
    </div>
  );
}
