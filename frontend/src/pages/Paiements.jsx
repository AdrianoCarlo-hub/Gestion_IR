import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import SearchBar from '../components/SearchBar';
import ContribuableRecherche from '../components/ContribuableRecherche';
import { lister as listerContribuables } from '../services/contribuableService';
import { lister as listerDeclarations } from '../services/declarationService';
import * as service from '../services/paiementService';
import * as exportService from '../services/exportService';
import ConfirmDialog from '../components/ConfirmDialog';
import { useToast } from '../context/ToastContext';
import { SkeletonTable } from '../components/Spinner';
import { LuPlus, LuDownload, LuUser, LuFileText, LuCreditCard, LuCalendar, LuDollarSign, LuTriangleAlert, LuX, LuTrash2, LuPrinter } from "react-icons/lu";

const fmt = (n) => (n == null ? '0' : Number(n).toLocaleString('fr-FR').replace(/\u202f|\u00a0/g, ' '));
const today = new Date().toISOString().slice(0, 10);

export default function Paiements() {
  const { agent } = useAuth();
  const toast = useToast();
  const [confirm, setConfirm] = useState(null);
  const [liste, setListe] = useState([]);
  const [listeFiltree, setListeFiltree] = useState([]);
  const [contribuables, setContribuables] = useState([]);
  const [declarations, setDeclarations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [recherche, setRecherche] = useState('');

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
      setListeFiltree(data);
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

  useEffect(() => {
    if (!recherche) {
      setListeFiltree(liste);
      return;
    }
    const r = recherche.toLowerCase();
    setListeFiltree(
      liste.filter((p) =>
        (p.referenceQuittance || '').toLowerCase().includes(r) ||
        (p.contribuable?.raisonSociale || '').toLowerCase().includes(r) ||
        (p.contribuable?.nif || '').includes(r)
      )
    );
  }, [recherche, liste]);

  const setF = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.idContribuable) {
      setError('Contribuable obligatoire');
      return;
    }
    if (!form.montantAr || Number(form.montantAr) <= 0) {
      setError('Montant obligatoire et > 0');
      return;
    }
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
      listerDeclarations().then(setDeclarations).catch(() => {});
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
  const declarationsSuivies = declarations.filter(
    (d) => ['BROUILLON', 'PAYEE'].includes(d.statut)
  );

  const totalMontant = liste.reduce((sum, p) => sum + (p.montantAr || 0), 0);
  const paiementsValides = liste.filter(p => !p.annule).length;
  const paiementsAnnules = liste.filter(p => p.annule).length;

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1>Paiements</h1>
          <p className="page-sub">Enregistrement des paiements et quittances</p>
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

      <SearchBar
        value={recherche}
        onChange={setRecherche}
        placeholder="Recherche (quittance, contribuable, NIF)"
      >
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Fermer le formulaire' : '+ Nouveau paiement'}
        </button>
        <button className="btn-secondary" onClick={() => exportService.exportPaiements()}>
          Exporter Excel
        </button>
      </SearchBar>

      <div className="cards-grid" style={{ marginBottom: 24 }}>
        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-card-icon">
              <LuCreditCard className="icon" style={{ width: 20, height: 20 }} />
            </div>
          </div>
          <span className="stat-label">Total paiements</span>
          <span className="stat-value">{liste.length}</span>
        </div>

        <div className="stat-card financial encaisse">
          <div className="stat-card-header">
            <div className="stat-card-icon">
              <LuDollarSign className="icon" style={{ width: 20, height: 20 }} />
            </div>
          </div>
          <span className="stat-label">Montant total</span>
          <span className="stat-value">{fmt(totalMontant)} Ar</span>
        </div>

        <div className="stat-card financial ir-du">
          <div className="stat-card-header">
            <div className="stat-card-icon blue">
              <LuUser className="icon" style={{ width: 20, height: 20 }} />
            </div>
          </div>
          <span className="stat-label">Valides</span>
          <span className="stat-value">{paiementsValides}</span>
        </div>

        <div className="stat-card financial reste">
          <div className="stat-card-header">
            <div className="stat-card-icon orange">
              <LuX className="icon" style={{ width: 20, height: 20 }} />
            </div>
          </div>
          <span className="stat-label">Annules</span>
          <span className="stat-value">{paiementsAnnules}</span>
        </div>
      </div>

      <section className="form-panel" style={{ marginBottom: 16 }}>
        <h3 className="section-title">
          <LuFileText className="section-icon" />
          Déclarations à valider et payées
        </h3>
        {declarationsSuivies.length === 0 ? (
          <p style={{ color: '#94a3b8', fontSize: 13 }}>Aucune déclaration à valider ou payée</p>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>NIF</th>
                  <th>Contribuable</th>
                  <th>Année</th>
                  <th>IR dû</th>
                  <th>Solde à payer</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                {declarationsSuivies.map((d) => (
                  <tr key={d.idDeclaration}>
                    <td>{d.contribuable?.nif || '-'}</td>
                    <td>{d.contribuable?.raisonSociale || '-'}</td>
                    <td>{d.annee}</td>
                    <td>{fmt(d.irDu)} Ar</td>
                    <td>{fmt(d.soldeAPayer)} Ar</td>
                    <td>
                      <span className={'badge badge-' + (d.statut || '').toLowerCase()}>
                        {d.statut === 'BROUILLON' ? 'À VALIDER' : 'PAYÉE'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="table-footer">{declarationsSuivies.length} déclaration(s)</p>
      </section>

      {showForm && (
        <form className="form-panel" onSubmit={handleSubmit} style={{ marginBottom: 16 }}>
          <h3 className="section-title">
            <LuCreditCard className="section-icon" />
            Nouveau paiement
          </h3>
          <div className="form-row">
            <div className="form-group" style={{ flex: 2 }}>
              <label className="form-label required">Contribuable *</label>
              <ContribuableRecherche
                contribuables={contribuables}
                value={form.idContribuable}
                onChange={(id) => {
                  setF('idContribuable', id);
                  setF('idDeclaration', '');
                }}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Declaration (optionnel)</label>
              <select 
                className="form-select" 
                value={form.idDeclaration}
                onChange={(e) => setF('idDeclaration', e.target.value)}
              >
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
              <label className="form-label required">Type *</label>
              <select 
                className="form-select" 
                value={form.typePaiement}
                onChange={(e) => setF('typePaiement', e.target.value)}
              >
                <option value="SOLDE_IR">Solde IR</option>
                <option value="ACOMPTE">Acompte</option>
                <option value="PENALITE">Penalite</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label required">Montant (Ar) *</label>
              <input 
                type="number" 
                className="form-input" 
                value={form.montantAr}
                onChange={(e) => setF('montantAr', e.target.value)} 
                min={1} 
                required 
              />
            </div>
            <div className="form-group">
              <label className="form-label required">Date *</label>
              <input 
                type="date" 
                className="form-input" 
                value={form.datePaiement}
                onChange={(e) => setF('datePaiement', e.target.value)} 
                required 
              />
            </div>
            <div className="form-group">
              <label className="form-label required">Mode *</label>
              <select 
                className="form-select" 
                value={form.mode}
                onChange={(e) => setF('mode', e.target.value)}
              >
                <option value="VIREMENT">Virement</option>
                <option value="CHEQUE">Cheque</option>
                <option value="ESPECES">Especes</option>
                <option value="MOBILE_MONEY">Mobile Money</option>
              </select>
            </div>
          </div>
          <div className="form-actions">
            <button type="submit" className="btn btn-primary">
              <LuCreditCard className="icon" />
              Enregistrer
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>
              <LuX className="icon" />
              Annuler
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <SkeletonTable rows={5} cols={8} />
      ) : listeFiltree.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <LuCreditCard className="icon" />
          </div>
          <h3>Aucun paiement</h3>
          <p>Ajoutez un paiement pour commencer</p>
        </div>
      ) : (
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
              {listeFiltree.map((p) => (
                <tr key={p.idPaiement}>
                  <td><strong>{p.referenceQuittance}</strong></td>
                  <td>{p.contribuable ? p.contribuable.raisonSociale : '-'}</td>
                  <td>
                    <span className="badge badge-info" style={{ fontSize: 11 }}>
                      {p.typePaiement}
                    </span>
                  </td>
                  <td><strong>{fmt(p.montantAr)} Ar</strong></td>
                  <td>{p.datePaiement}</td>
                  <td>{p.mode}</td>
                  <td>
                    <span className={'badge badge-' + (p.annule ? 'radie' : 'actif')}>
                      {p.annule ? 'ANNULE' : 'VALIDE'}
                    </span>
                  </td>
                  <td>
                    <div className="table-actions">
                      <button 
                        className="btn-link"
                        onClick={() => exportService.exportQuittancePdf(p.idPaiement)}
                        title="Quittance"
                      >
                        <LuPrinter className="icon" style={{ width: 14, height: 14, verticalAlign: 'middle', marginRight: 4 }} />
                        Quittance
                      </button>
                      {!p.annule && (
                        <button 
                          className="btn-icon delete"
                          onClick={() => handleAnnuler(p.idPaiement)}
                          title="Annuler"
                        >
                          <LuTrash2 className="icon" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="table-footer">{listeFiltree.length} resultat(s)</p>

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
