import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { lister as listerContribuables } from '../services/contribuableService';
import { lister as listerDeclarations } from '../services/declarationService';
import * as service from '../services/paiementService';
import * as exportService from '../services/exportService';
import ConfirmDialog from '../components/ConfirmDialog';
import { useToast } from '../context/ToastContext';

const fmt = (n) => (n == null ? '0' : Number(n).toLocaleString('fr-FR').replace(/\u202f|\u00a0/g, ' '));
const today = new Date().toISOString().slice(0, 10);

export default function Paiements() {
  const { agent } = useAuth();
  const toast = useToast();
  const [confirm, setConfirm] = useState(null);
  const [liste, setListe] = useState([]);
  const [contribuables, setContribuables] = useState([]);
  const [declarations, setDeclarations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
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
    try {
      const payload = {
        idContribuable: Number(form.idContribuable),
        idDeclaration: form.idDeclaration ? Number(form.idDeclaration) : null,
        typePaiement: form.typePaiement,
        montantAr: Number(form.montantAr),
        datePaiement: form.datePaiement,
        mode: form.mode,
        idAgent: agent ? agent.idAgent : 3,
      };
      await service.enregistrer(payload);
      toast.success('Paiement enregistre');
      setShowForm(false);
      setForm({ ...form, montantAr: '', idDeclaration: '' });
      charger();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur');
    }
  };

  const handleAnnuler = (id) => {
    setConfirm({
      titre: 'Annuler le paiement',
      message: 'Voulez-vous vraiment annuler ce paiement ? Cette action est irreversible.',
      texteConfirmer: 'Annuler le paiement',
      danger: true,
      onConfirmer: async () => {
        try {
          await service.annuler(id, 'Annulation manuelle');
          toast.success('Paiement annule');
          charger();
        } catch (e) {
          toast.error(e.response?.data?.message || 'Erreur');
        }
      },
    });
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

      <div style={{ marginBottom: 16, display: 'flex', gap: 10 }}>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Fermer le formulaire' : '+ Nouveau paiement'}
        </button>
        <button className="btn-secondary" onClick={() => exportService.exportPaiements()}>
          Exporter Excel
        </button>
      </div>

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
                  <td>{p.contribuable ? p.contribuable.raisonSociale : '-'}</td>
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
                    <button className="btn-link" onClick={() => exportService.exportQuittancePdf(p.idPaiement)}>
                      Quittance
                    </button>
                    {!p.annule && (
                      <button className="btn-link danger" style={{ marginLeft: 10 }}
                              onClick={() => handleAnnuler(p.idPaiement)}>
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

      <ConfirmDialog
        ouvert={!!confirm}
        titre={confirm ? confirm.titre : 'Confirmation'}
        message={confirm ? confirm.message : ''}
        texteConfirmer={confirm ? confirm.texteConfirmer : 'Confirmer'}
        danger={confirm ? !!confirm.danger : false}
        onConfirmer={() => {
          if (confirm && confirm.onConfirmer) confirm.onConfirmer();
          setConfirm(null);
        }}
        onAnnuler={() => setConfirm(null)}
      />
    </div>
  );
}
