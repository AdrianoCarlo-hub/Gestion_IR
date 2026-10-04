import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { lister as listerContribuables } from '../services/contribuableService';
import { lister as listerDeclarations } from '../services/declarationService';
import * as service from '../services/paiementService';

const fmt = (n) => (n == null ? '0' : Number(n).toLocaleString('fr-FR').replace(/\u202f|\u00a0/g, ' '));
const today = new Date().toISOString().slice(0, 10);

export default function Paiements() {
  const { agent } = useAuth();
  const [liste, setListe] = useState([]);
  const [contribuables, setContribuables] = useState([]);
  const [declarations, setDeclarations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({
    idContribuable: '',
    idDeclaration: '',
    typePaiement: 'SOLDE_IR',
    montantAr: '',
    datePaiement: today,
    mode: 'VIREMENT',
  });

  const charger = async () => {
    setLoading(true);
    try {
      const data = await service.lister();
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
    listerDeclarations().then(setDeclarations).catch(() => {});
  }, []);

  const setF = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const payload = {
        idContribuable: Number(form.idContribuable),
        idDeclaration: form.idDeclaration ? Number(form.idDeclaration) : null,
        typePaiement: form.typePaiement,
        montantAr: Number(form.montantAr),
        datePaiement: form.datePaiement,
        mode: form.mode,
        idAgent: agent?.idAgent || 3,
      };
      await service.enregistrer(payload);
      setSuccess('Paiement enregistre');
      setShowForm(false);
      setForm({ ...form, montantAr: '', idDeclaration: '' });
      charger();
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur');
    }
  };

  const handleAnnuler = async (id) => {
    const motif = prompt('Motif de l annulation ?');
    if (!motif) return;
    try {
      await service.annuler(id, motif);
      charger();
    } catch (e) {
      setError(e.response?.data?.message || 'Erreur');
    }
  };

  const declarationsDuContribuable = declarations.filter(
    (d) => String(d.contribuable?.idContribuable) === String(form.idContribuable)
  );

  return (
    <div className="page">
      <header className="page-header">
        <h1>Paiements</h1>
        <p className="page-sub">Enregistrement des paiements et quittances</p>
      </header>

      {error && <div className="alert-error" style={{ marginBottom: 16 }}>{error}</div>}
      {success && <div className="alert-success" style={{ marginBottom: 16 }}>{success}</div>}

      {!showForm && (
        <button className="btn-primary" onClick={() => setShowForm(true)} style={{ marginBottom: 16 }}>
          + Nouveau paiement
        </button>
      )}

      {showForm && (
        <form className="form-panel" onSubmit={handleSubmit} style={{ marginBottom: 16 }}>
          <h3 className="section-title">Nouveau paiement</h3>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Contribuable *</label>
              <select className="form-input" value={form.idContribuable}
                      onChange={(e) => setF('idContribuable', e.target.value)} required>
                <option value="">-- Choisir --</option>
                {contribuables.map((c) => (
                  <option key={c.idContribuable} value={c.idContribuable}>
                    {c.nif} - {c.raisonSociale}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Declaration (optionnel)</label>
              <select className="form-input" value={form.idDeclaration}
                      onChange={(e) => setF('idDeclaration', e.target.value)}>
                <option value="">-- Aucune --</option>
                {declarationsDuContribuable.map((d) => (
                  <option key={d.idDeclaration} value={d.idDeclaration}>
                    {d.annee} - IR {fmt(d.irDu)} Ar
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Type *</label>
              <select className="form-input" value={form.typePaiement}
                      onChange={(e) => setF('typePaiement', e.target.value)}>
                <option value="SOLDE_IR">Solde IR</option>
                <option value="ACOMPTE">Acompte</option>
                <option value="PENALITE">Penalite</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Montant (Ar) *</label>
              <input type="number" className="form-input" value={form.montantAr}
                     onChange={(e) => setF('montantAr', e.target.value)} min={1} required />
            </div>
            <div className="form-group">
              <label className="form-label">Date *</label>
              <input type="date" className="form-input" value={form.datePaiement}
                     onChange={(e) => setF('datePaiement', e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Mode *</label>
              <select className="form-input" value={form.mode}
                      onChange={(e) => setF('mode', e.target.value)}>
                <option value="VIREMENT">Virement</option>
                <option value="CHEQUE">Cheque</option>
                <option value="ESPECES">Especes</option>
                <option value="MOBILE_MONEY">Mobile Money</option>
              </select>
            </div>
          </div>
          <div className="form-actions">
            <button type="submit" className="btn-primary">Enregistrer</button>
            <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Annuler</button>
          </div>
        </form>
      )}

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Quittance</th>
              <th>Contribuable</th>
              <th>Type</th>
              <th>Montant</th>
              <th>Date</th>
              <th>Mode</th>
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} style={{ textAlign: 'center' }}>Chargement...</td></tr>
            ) : liste.length === 0 ? (
              <tr><td colSpan={8} style={{ textAlign: 'center' }}>Aucun paiement</td></tr>
            ) : (
              liste.map((p) => (
                <tr key={p.idPaiement}>
                  <td>{p.referenceQuittance}</td>
                  <td>{p.contribuable?.raisonSociale || '-'}</td>
                  <td>{p.typePaiement}</td>
                  <td>{fmt(p.montantAr)} Ar</td>
                  <td>{p.datePaiement}</td>
                  <td>{p.mode}</td>
                  <td>
                    <span className={'badge badge-' + (p.annule ? 'radie' : 'actif')}>
                      {p.annule ? 'ANNULE' : 'VALIDE'}
                    </span>
                  </td>
                  <td>
                    {!p.annule && (
                      <button className="btn-link danger" onClick={() => handleAnnuler(p.idPaiement)}>
                        Annuler
                      </button>
                    )}
                  </td>
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
