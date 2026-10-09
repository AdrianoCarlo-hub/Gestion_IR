import { useEffect, useState } from 'react';
import * as service from '../services/declarationService';
import ConfirmDialog from '../components/ConfirmDialog';
import { LoadingBlock } from '../components/Spinner';
import { useToast } from '../context/ToastContext';
import { LuCalculator, LuCircleCheck, LuTrash2, LuPlus, LuPencil, LuEye, LuFileText, LuTriangleAlert, LuX, LuSave, LuArrowLeft, LuPercent, LuCalendar, LuUser, LuDollarSign, LuLoader } from "react-icons/lu";

const fmt = (n) =>
  n == null ? '0' : Number(n).toLocaleString('fr-FR').replace(/\u202f|\u00a0/g, ' ');

const CATEGORIES = [
  { value: 'SALAIRE', label: 'Salaire' },
  { value: 'LOYER', label: 'Loyer' },
  { value: 'ELECTRICITE', label: 'Electricite' },
  { value: 'TRANSPORT', label: 'Transport' },
  { value: 'AUTRE', label: 'Autre' },
];

// Composant pour les badges de catégorie
function CategoryBadge({ category }) {
  const getCategoryColor = (cat) => {
    switch (cat) {
      case 'SALAIRE': return 'badge-success';
      case 'LOYER': return 'badge-info';
      case 'ELECTRICITE': return 'badge-warning';
      case 'TRANSPORT': return 'badge-success';
      default: return 'badge-muted';
    }
  };

  return (
    <span className={`badge ${getCategoryColor(category)}`} style={{ fontSize: 11 }}>
      {category}
    </span>
  );
}

export default function DeclarationForm({ idDeclaration, onRetour }) {
  const toast = useToast();
  const [confirm, setConfirm] = useState(null);
  const [declaration, setDeclaration] = useState(null);
  const [charges, setCharges] = useState([]);
  const [caHt, setCaHt] = useState(0);
  const [reintegrations, setReintegrations] = useState(0);
  const [deductions, setDeductions] = useState(0);
  const [acomptes, setAcomptes] = useState(0);
  const [newCat, setNewCat] = useState('SALAIRE');
  const [newLib, setNewLib] = useState('');
  const [newMontant, setNewMontant] = useState('');
  const [newJustif, setNewJustif] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const charger = async () => {
    try {
      const d = await service.trouver(idDeclaration);
      setDeclaration(d);
      setCaHt(d.caHt || 0);
      setReintegrations(d.totalReintegrations || 0);
      setDeductions(d.totalDeductions || 0);
      setAcomptes(d.acomptesVerses || 0);
      const c = await service.listerCharges(idDeclaration);
      setCharges(c);
    } catch (e) {
      setError(e.response?.data?.message || 'Erreur de chargement');
    }
  };

  useEffect(() => {
    charger();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idDeclaration]);

  const verrouille = declaration && declaration.statut !== 'BROUILLON';

  const handleSauverCa = async () => {
    setError('');
    try {
      await service.modifierCaHt(idDeclaration, Number(caHt));
      toast.success('Chiffre d affaires enregistre');
      charger();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Erreur');
    }
  };

  const handleAjouterCharge = async (e) => {
    e.preventDefault();
    setError('');
    if (!newLib.trim() || !newMontant || Number(newMontant) <= 0) {
      setError('Libelle et montant > 0 obligatoires');
      return;
    }
    try {
      await service.ajouterCharge(idDeclaration, {
        categorie: newCat,
        libelle: newLib,
        montantAr: Number(newMontant),
        justificatifRef: newJustif || null,
      });
      setNewLib('');
      setNewMontant('');
      setNewJustif('');
      toast.success('Charge ajoutee');
      charger();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Erreur');
    }
  };

  const handleSupprimerCharge = (idLigne) => {
    setConfirm({
      titre: 'Supprimer la charge',
      message: 'Voulez-vous vraiment supprimer cette charge ?',
      texteConfirmer: 'Supprimer',
      danger: true,
      onConfirmer: async () => {
        try {
          await service.supprimerCharge(idLigne);
          toast.success('Charge supprimee');
          charger();
        } catch (e) {
          toast.error(e.response?.data?.message || 'Erreur');
        }
      },
    });
  };

  const handleCalculer = async () => {
    setError('');
    setLoading(true);
    try {
      await service.modifierCaHt(idDeclaration, Number(caHt));
      const d = await service.calculer(idDeclaration, {
        totalReintegrations: Number(reintegrations),
        totalDeductions: Number(deductions),
        acomptesVerses: Number(acomptes),
      });
      setDeclaration(d);
      toast.success('Calcul effectue avec succes');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Erreur de calcul');
    } finally {
      setLoading(false);
    }
  };

  const handleValider = () => {
    setConfirm({
      titre: 'Valider la declaration',
      message: 'Valider cette declaration ? Les acomptes de l annee suivante seront generes.',
      texteConfirmer: 'Valider',
      onConfirmer: async () => {
        try {
          const d = await service.valider(idDeclaration);
          setDeclaration(d);
          toast.success('Declaration validee. Acomptes generes.');
        } catch (e) {
          toast.error(e.response?.data?.message || 'Erreur');
        }
      },
    });
  };

  if (!declaration) {
    return <LoadingBlock message="Chargement de la declaration..." />;
  }

  const totalChargesAffiche = charges.reduce((s, c) => s + (c.montantAr || 0), 0);

  return (
    <>
      <div className="decl-header">
        <div>
          <h2 className="form-title">
            <LuFileText className="icon" style={{ width: 20, height: 20, verticalAlign: 'middle', marginRight: 8 }} />
            {declaration.contribuable?.raisonSociale} — Exercice {declaration.annee}
          </h2>
          <p className="page-sub">
            NIF : {declaration.contribuable?.nif} — Statut :{' '}
            <span className={'badge badge-' + (declaration.statut || '').toLowerCase()}>
              {declaration.statut}
            </span>
          </p>
        </div>
        <button className="btn btn-secondary" onClick={onRetour}>
          <LuArrowLeft className="icon" />
          Retour
        </button>
      </div>

      {error && (
        <div className="alert alert-error" style={{ marginBottom: 16 }}>
          <span className="alert-icon">
            <LuTriangleAlert className="icon" />
          </span>
          <span>{error}</span>
        </div>
      )}

      {verrouille && (
        <div className="alert alert-warning" style={{ marginBottom: 16 }}>
          <span className="alert-icon">
            <LuTriangleAlert className="icon" />
          </span>
          <span>Cette declaration est {declaration.statut} — elle n est plus modifiable.</span>
        </div>
      )}

      <div className="decl-grid">
        {/* Colonne de saisie */}
        <div>
          <div className="form-panel" style={{ marginBottom: 16 }}>
            <h3 className="section-title">
              <LuDollarSign className="section-icon" />
              Chiffre d affaires
            </h3>
            <div className="form-row">
              <div className="form-group" style={{ flex: 2 }}>
                <label className="form-label">CA HT (Ar) *</label>
                <input
                  type="number"
                  className="form-input"
                  value={caHt}
                  onChange={(e) => setCaHt(e.target.value)}
                  disabled={verrouille}
                  min={0}
                  placeholder="Montant en Ariary"
                />
              </div>
              {!verrouille && (
                <div className="form-group" style={{ flex: 0, justifyContent: 'flex-end' }}>
                  <button className="btn btn-primary" onClick={handleSauverCa}>
                    <LuSave className="icon" />
                    Enregistrer
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="form-panel" style={{ marginBottom: 16 }}>
            <h3 className="section-title">
              <LuDollarSign className="section-icon" />
              Charges ({charges.length})
            </h3>
            <table className="data-table" style={{ marginBottom: 12 }}>
              <thead>
                <tr>
                  <th>Categorie</th>
                  <th>Libelle</th>
                  <th>Montant</th>
                  {!verrouille && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {charges.length === 0 ? (
                  <tr>
                    <td colSpan={verrouille ? 3 : 4} style={{ textAlign: 'center' }}>
                      Aucune charge
                    </td>
                  </tr>
                ) : (
                  charges.map((c) => (
                    <tr key={c.idLigne}>
                      <td>
                        <CategoryBadge category={c.categorie} />
                      </td>
                      <td>{c.libelle}</td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>
                        {fmt(c.montantAr)} Ar
                      </td>
                      {!verrouille && (
                        <td>
                          <button 
                            className="btn-icon"
                            onClick={() => handleSupprimerCharge(c.idLigne)}
                            title="Supprimer"
                          >
                            <LuTrash2 className="icon" style={{ color: 'var(--danger)' }} />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={2} style={{ textAlign: 'right', fontWeight: 600 }}>Total charges</td>
                  <td colSpan={verrouille ? 1 : 2} style={{ fontWeight: 700, textAlign: 'right' }}>
                    {fmt(totalChargesAffiche)} Ar
                  </td>
                </tr>
              </tfoot>
            </table>

            {!verrouille && (
              <form onSubmit={handleAjouterCharge} className="inline-form">
                <select 
                  className="form-input" 
                  value={newCat} 
                  onChange={(e) => setNewCat(e.target.value)}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
                <input
                  className="form-input"
                  placeholder="Libelle"
                  value={newLib}
                  onChange={(e) => setNewLib(e.target.value)}
                />
                <input
                  type="number"
                  className="form-input"
                  placeholder="Montant (Ar)"
                  value={newMontant}
                  onChange={(e) => setNewMontant(e.target.value)}
                  min={0}
                />
                <input
                  className="form-input"
                  placeholder="N facture"
                  value={newJustif}
                  onChange={(e) => setNewJustif(e.target.value)}
                />
                <button type="submit" className="btn btn-primary">
                  <LuPlus className="icon" />
                  Ajouter
                </button>
              </form>
            )}
          </div>

          <div className="form-panel">
            <h3 className="section-title">
              <LuCalculator className="section-icon" />
              Ajustements et acomptes
            </h3>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Reintegrations (Ar)</label>
                <input
                  type="number"
                  className="form-input"
                  value={reintegrations}
                  onChange={(e) => setReintegrations(e.target.value)}
                  disabled={verrouille}
                  min={0}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Deductions (Ar)</label>
                <input
                  type="number"
                  className="form-input"
                  value={deductions}
                  onChange={(e) => setDeductions(e.target.value)}
                  disabled={verrouille}
                  min={0}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Acomptes verses (Ar)</label>
                <input
                  type="number"
                  className="form-input"
                  value={acomptes}
                  onChange={(e) => setAcomptes(e.target.value)}
                  disabled={verrouille}
                  min={0}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Panneau de résultats sticky */}
        <div>
          <div className="result-panel">
            <h3 className="result-title">
              <LuCalculator className="icon" style={{ width: 16, height: 16, verticalAlign: 'middle', marginRight: 4 }} />
              Resultat du calcul
            </h3>

            <div className="result-line">
              <span>Resultat comptable</span>
              <strong>{fmt(declaration.resultatComptable)} Ar</strong>
            </div>
            <div className="result-line">
              <span>Total reintegrations</span>
              <strong>{fmt(declaration.totalReintegrations)} Ar</strong>
            </div>
            <div className="result-line">
              <span>Total deductions</span>
              <strong>{fmt(declaration.totalDeductions)} Ar</strong>
            </div>
            <div className="result-line">
              <span>Deficit impute</span>
              <strong>{fmt(declaration.deficitImpute)} Ar</strong>
            </div>
            <div className="result-line">
              <span>Base imposable</span>
              <strong>{fmt(declaration.baseImposable)} Ar</strong>
            </div>
            <div className="result-line">
              <span>IR brut (20 %)</span>
              <strong>{fmt(declaration.irBrut)} Ar</strong>
            </div>
            <div className="result-line">
              <span>Minimum de perception</span>
              <strong>{fmt(declaration.minimumPerception)} Ar</strong>
            </div>
            <div className="result-line highlight">
              <span>IR du</span>
              <strong>{fmt(declaration.irDu)} Ar</strong>
            </div>
            <div className="result-line">
              <span>Acomptes verses</span>
              <strong>{fmt(declaration.acomptesVerses)} Ar</strong>
            </div>
            {declaration.soldeAPayer > 0 ? (
              <div className="result-line big">
                <span>Solde a payer</span>
                <strong>{fmt(declaration.soldeAPayer)} Ar</strong>
              </div>
            ) : declaration.creditImpot > 0 ? (
              <div className="result-line big credit">
                <span>Credit d impot</span>
                <strong>{fmt(declaration.creditImpot)} Ar</strong>
              </div>
            ) : null}
          </div>

          {!verrouille && (
            <div className="form-panel" style={{ marginTop: 16 }}>
              <button
                className="btn btn-primary full-width"
                onClick={handleCalculer}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <LuLoader className="icon" style={{ width: 18, height: 18, animation: 'spin 0.8s linear infinite' }} />
                    Calcul en cours...
                  </>
                ) : (
                  <>
                    <LuCalculator className="icon" />
                    Calculer l impot
                  </>
                )}
              </button>
              <button
                className="btn btn-validate full-width"
                onClick={handleValider}
                style={{ marginTop: 10 }}
              >
                <LuCircleCheck className="icon" />
                Valider la declaration
              </button>
            </div>
          )}
        </div>
      </div>

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
    </>
  );
}
