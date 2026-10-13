import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import * as adminService from '../services/adminService';
import { LoadingBlock } from '../components/Spinner';

const ROLES = ['AGENT', 'RESPONSABLE', 'ADMIN'];

export default function Admin() {
  const { agent } = useAuth();
  const toast = useToast();

  const [agents, setAgents] = useState([]);
  const [centres, setCentres] = useState([]);
  const [parametres, setParametres] = useState([]);
  const [edits, setEdits] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [nouveau, setNouveau] = useState({
    matricule: '',
    nom: '',
    prenom: '',
    email: '',
    role: 'AGENT',
    idCentre: '',
    motDePasse: '',
  });

  const charger = async () => {
    try {
      const [a, c, p] = await Promise.all([
        adminService.listerAgents(),
        adminService.listerCentres(),
        adminService.listerParametres(),
      ]);
      setAgents(a);
      setCentres(c);
      setParametres(p);
      if (c.length > 0) {
        setNouveau((prev) => (prev.idCentre ? prev : { ...prev, idCentre: c[0].idCentre }));
      }
    } catch (e) {
      setError(e.response?.data?.message || 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (agent?.role === 'ADMIN') charger();
    else setLoading(false);
  }, [agent]);

  if (agent?.role !== 'ADMIN') {
    return (
      <div className="page">
        <div className="alert-error">Acces reserve aux administrateurs.</div>
      </div>
    );
  }

  if (loading) return <LoadingBlock message="Chargement de l administration..." />;

  const handleCreer = async (e) => {
    e.preventDefault();
    try {
      await adminService.creerAgent({ ...nouveau, idCentre: Number(nouveau.idCentre) });
      toast.success('Agent cree');
      setNouveau({
        matricule: '',
        nom: '',
        prenom: '',
        email: '',
        role: 'AGENT',
        idCentre: centres[0]?.idCentre || '',
        motDePasse: '',
      });
      charger();
    } catch (e2) {
      toast.error(e2.response?.data?.message || 'Erreur');
    }
  };

  const handleStatut = async (a) => {
    const cible = a.statut === 'ACTIF' ? 'BLOQUE' : 'ACTIF';
    try {
      await adminService.changerStatutAgent(a.idAgent, cible);
      toast.success('Statut mis a jour');
      charger();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Erreur');
    }
  };

  const handleReset = async (a) => {
    const mdp = window.prompt('Nouveau mot de passe (8 caracteres minimum) :');
    if (!mdp) return;
    try {
      await adminService.reinitialiserMotDePasse(a.idAgent, mdp);
      toast.success('Mot de passe reinitialise');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Erreur');
    }
  };

  const handleSauverParam = async (p) => {
    const valeur = edits[p.idParam];
    if (valeur == null || valeur === '') return;
    try {
      await adminService.modifierParametre(p.idParam, Number(valeur));
      toast.success('Parametre mis a jour');
      setEdits((prev) => ({ ...prev, [p.idParam]: undefined }));
      charger();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Erreur');
    }
  };

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1>Administration</h1>
          <p className="page-sub">Comptes agents et parametres fiscaux</p>
        </div>
      </header>

      {error && <div className="alert-error" style={{ marginBottom: 16 }}>{error}</div>}

      {/* Agents */}
      <h3 className="section-title">Agents ({agents.length})</h3>
      <div className="table-container" style={{ marginBottom: 16 }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Matricule</th>
              <th>Nom</th>
              <th>Email</th>
              <th>Role</th>
              <th>Statut</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {agents.map((a) => (
              <tr key={a.idAgent}>
                <td><strong>{a.matricule}</strong></td>
                <td>{a.prenom} {a.nom}</td>
                <td>{a.email}</td>
                <td><span className="badge badge-info">{a.role}</span></td>
                <td>
                  <span className={'badge badge-' + (a.statut || '').toLowerCase()}>
                    {a.statut}
                  </span>
                </td>
                <td>
                  <button className="btn-link" onClick={() => handleStatut(a)}>
                    {a.statut === 'ACTIF' ? 'Bloquer' : 'Activer'}
                  </button>
                  <button className="btn-link" onClick={() => handleReset(a)}>
                    Reinit. mdp
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="form-panel" style={{ marginBottom: 24 }}>
        <h3 className="section-title">Nouvel agent</h3>
        <form onSubmit={handleCreer} className="inline-form">
          <input
            className="form-input" placeholder="Matricule" required
            value={nouveau.matricule}
            onChange={(e) => setNouveau({ ...nouveau, matricule: e.target.value })}
          />
          <input
            className="form-input" placeholder="Nom" required
            value={nouveau.nom}
            onChange={(e) => setNouveau({ ...nouveau, nom: e.target.value })}
          />
          <input
            className="form-input" placeholder="Prenom" required
            value={nouveau.prenom}
            onChange={(e) => setNouveau({ ...nouveau, prenom: e.target.value })}
          />
          <input
            className="form-input" type="email" placeholder="Email" required
            value={nouveau.email}
            onChange={(e) => setNouveau({ ...nouveau, email: e.target.value })}
          />
          <select
            className="form-input"
            value={nouveau.role}
            onChange={(e) => setNouveau({ ...nouveau, role: e.target.value })}
          >
            {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
          {centres.length > 1 && (
            <select
              className="form-input"
              value={nouveau.idCentre}
              onChange={(e) => setNouveau({ ...nouveau, idCentre: e.target.value })}
            >
              {centres.map((c) => (
                <option key={c.idCentre} value={c.idCentre}>{c.nom}</option>
              ))}
            </select>
          )}
          <input
            className="form-input" type="password" placeholder="Mot de passe" required
            value={nouveau.motDePasse}
            onChange={(e) => setNouveau({ ...nouveau, motDePasse: e.target.value })}
          />
          <button type="submit" className="btn-primary">+ Creer</button>
        </form>
      </div>

      {/* Parametres */}
      <h3 className="section-title">Parametres fiscaux ({parametres.length})</h3>
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Description</th>
              <th>Valeur</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {parametres.map((p) => (
              <tr key={p.idParam}>
                <td><strong>{p.code}</strong></td>
                <td>{p.description}</td>
                <td>
                  <input
                    type="number"
                    className="form-input"
                    style={{ maxWidth: 180 }}
                    value={edits[p.idParam] ?? p.valeur}
                    onChange={(e) => setEdits({ ...edits, [p.idParam]: e.target.value })}
                  />
                </td>
                <td>
                  <button
                    className="btn-link"
                    disabled={edits[p.idParam] == null}
                    onClick={() => handleSauverParam(p)}
                  >
                    Enregistrer
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
