import { useEffect, useState, useCallback } from 'react';
import { lister as listerContribuables } from '../services/contribuableService';
import { lister as listerDeclarations } from '../services/declarationService';
import * as service from '../services/penaliteService';
import ContribuableRecherche from '../components/ContribuableRecherche';
import PenaliteCard from '../components/penalites/PenaliteCard';
import DecompteDetail from '../components/penalites/DecompteDetail';
import RemiseGracieuseModal from '../components/penalites/RemiseGracieuseModal';
import { SkeletonStatsGrid, SkeletonTable } from '../components/Spinner';
import { useToast } from '../context/ToastContext';
import {
  LuTriangleAlert, LuDollarSign, LuPercent, LuCircleCheck, LuCalculator,
  LuPrinter, LuHandHeart, LuCircleX,
} from 'react-icons/lu';

const fmt = (n) => (n == null ? '0' : Number(n).toLocaleString('fr-FR').replace(/\u202f|\u00a0/g, ' '));
const today = new Date().toISOString().slice(0, 10);
const anneeCourante = new Date().getFullYear();

const STATUT_BADGE = {
  DUE: 'radie',
  PAYEE: 'actif',
  ANNULEE: 'cesse',
  EN_DEMANDE_REMISE: 'info',
};

export default function Penalites() {
  const toast = useToast();
  const [contribuables, setContribuables] = useState([]);
  const [selected, setSelected] = useState('');
  const [annee, setAnnee] = useState(anneeCourante);
  const [situation, setSituation] = useState(null);
  const [loading, setLoading] = useState(false);

  const [declarations, setDeclarations] = useState([]);
  const [selectedDecl, setSelectedDecl] = useState('');
  const [date, setDate] = useState(today);
  const [remise, setRemise] = useState(null);

  useEffect(() => {
    listerContribuables().then(setContribuables).catch(() => {});
    listerDeclarations().then(setDeclarations).catch(() => {});
  }, []);

  const charger = useCallback(async (id, an) => {
    if (!id) { setSituation(null); return; }
    setLoading(true);
    try {
      setSituation(await service.situation(id, an));
    } catch (e) {
      toast.error(e.response?.data?.message || 'Erreur de chargement');
      setSituation(null);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (selected) charger(selected, annee);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, annee]);

  const declarationSelectionnee = () =>
    declarations.find((d) => String(d.idDeclaration) === String(selectedDecl));

  const apresCalcul = (decl) => {
    if (decl && decl.contribuable) {
      setSelected(String(decl.contribuable.idContribuable));
      setAnnee(decl.annee);
    } else {
      charger(selected, annee);
    }
  };

  const calculerDepot = async () => {
    const decl = declarationSelectionnee();
    if (!decl) return;
    try {
      await service.calculerDepot(decl.idDeclaration, date);
      toast.success('Amende de depot calculee');
      apresCalcul(decl);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Erreur');
    }
  };

  const calculerMajoration = async () => {
    const decl = declarationSelectionnee();
    if (!decl) return;
    try {
      await service.calculerMajoration(decl.idDeclaration, date);
      toast.success('Majoration calculee');
      apresCalcul(decl);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Erreur');
    }
  };

  const regler = async (p) => {
    try {
      await service.changerStatut(p.idPenalite, 'PAYEE');
      toast.success('Penalite reglee');
      charger(selected, annee);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Erreur');
    }
  };

  const annuler = async (p) => {
    const motif = window.prompt('Motif de l annulation :');
    if (motif == null) return;
    try {
      await service.annuler(p.idPenalite, motif);
      toast.success('Penalite annulee');
      charger(selected, annee);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Erreur');
    }
  };

  const validerRemise = async ({ motif, justificatif }) => {
    try {
      await service.remiseGracieuse(remise.idPenalite, motif, justificatif);
      toast.success('Demande de remise envoyee');
      setRemise(null);
      charger(selected, annee);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Erreur');
    }
  };

  const s = situation || { penalites: [], totalDu: 0, totalAmendesDepot: 0, totalMajorations: 0, totalPayees: 0 };

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1>Penalites</h1>
          <p className="page-sub">Amendes de depot, majorations de retard et infractions specifiques</p>
        </div>
      </header>

      <div className="form-panel" style={{ marginBottom: 16 }}>
        <div className="form-row">
          <div className="form-group" style={{ flex: 2 }}>
            <label className="form-label">Contribuable</label>
            <ContribuableRecherche contribuables={contribuables}
              value={selected} onChange={(id) => setSelected(id)} />
          </div>
          <div className="form-group">
            <label className="form-label">Annee</label>
            <input type="number" className="form-input" value={annee}
              onChange={(e) => setAnnee(Number(e.target.value))} />
          </div>
        </div>

        <div className="form-row" style={{ marginTop: 16, alignItems: 'flex-end' }}>
          <div className="form-group" style={{ flex: 2 }}>
            <label className="form-label">Declaration (pour calculer une penalite)</label>
            <select className="form-input" value={selectedDecl}
              onChange={(e) => setSelectedDecl(e.target.value)}>
              <option value="">-- Choisir une declaration --</option>
              {declarations.map((d) => (
                <option key={d.idDeclaration} value={d.idDeclaration}>
                  {d.contribuable?.raisonSociale} - {d.annee} ({d.statut})
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Date de reference</label>
            <input type="date" className="form-input" value={date}
              onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="form-group">
            <div className="form-actions" style={{ margin: 0 }}>
              <button className="btn btn-primary" onClick={calculerDepot} disabled={!selectedDecl}>
                <LuTriangleAlert className="icon" /> Amende depot
              </button>
              <button className="btn btn-primary" onClick={calculerMajoration} disabled={!selectedDecl}>
                <LuCalculator className="icon" /> Majoration
              </button>
            </div>
          </div>
        </div>
      </div>

      {!selected ? (
        <div className="empty-state">
          <div className="empty-state-icon"><LuTriangleAlert className="icon" /></div>
          <h3>Selectionnez un contribuable</h3>
          <p>Choisissez un contribuable pour afficher ses penalites</p>
        </div>
      ) : loading ? (
        <>
          <SkeletonStatsGrid count={4} />
          <SkeletonTable rows={4} cols={6} />
        </>
      ) : (
        <>
          <div className="cards-grid" style={{ marginBottom: 24 }}>
            <PenaliteCard icone={LuDollarSign} label="Total du" valeur={s.totalDu} suffixe=" Ar" tone="ir-du" />
            <PenaliteCard icone={LuTriangleAlert} label="Amendes depot" valeur={s.totalAmendesDepot} suffixe=" Ar" tone="orange" />
            <PenaliteCard icone={LuPercent} label="Majorations" valeur={s.totalMajorations} suffixe=" Ar" />
            <PenaliteCard icone={LuCircleCheck} label="Payees" valeur={s.totalPayees} suffixe=" Ar" tone="encaisse" />
          </div>

          <h3 className="section-title"><LuTriangleAlert className="section-icon" /> Historique</h3>
          {s.penalites.length === 0 ? (
            <div className="empty-state" style={{ padding: 24 }}>
              <p>Aucune penalite pour cette annee</p>
            </div>
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Echeance</th>
                    <th>Type</th>
                    <th>Base</th>
                    <th>Taux</th>
                    <th>Retard</th>
                    <th>Montant</th>
                    <th>Statut</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {s.penalites.map((p) => (
                    <tr key={p.idPenalite}>
                      <td>{p.dateLimite || '-'}</td>
                      <td><span className="badge badge-warning" style={{ fontSize: 11 }}>{p.type}</span></td>
                      <td>{fmt(p.baseCalculAr)} Ar</td>
                      <td>{p.tauxPct} %</td>
                      <td>{p.nbMois ? p.nbMois + ' mois' : '-'}</td>
                      <td><strong>{fmt(p.montantAr)} Ar</strong></td>
                      <td>
                        <span className={'badge badge-' + (STATUT_BADGE[p.statut] || 'info')}>{p.statut}</span>
                      </td>
                      <td>
                        <div className="row-actions">
                          {p.statut === 'DUE' && (
                            <>
                              <button className="btn-icon" title="Regler" onClick={() => regler(p)}>
                                <LuCircleCheck className="icon" />
                              </button>
                              <button className="btn-icon" title="Remise gracieuse" onClick={() => setRemise(p)}>
                                <LuHandHeart className="icon" />
                              </button>
                              <button className="btn-icon delete" title="Annuler" onClick={() => annuler(p)}>
                                <LuCircleX className="icon" />
                              </button>
                            </>
                          )}
                          <button className="btn-icon" title="Telecharger l avis"
                            onClick={() => window.print()}>
                            <LuPrinter className="icon" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <h3 className="section-title" style={{ marginTop: 24 }}>Decompte detaille</h3>
          {s.penalites.map((p) => (
            <DecompteDetail key={'d-' + p.idPenalite} detail={p} />
          ))}
        </>
      )}

      <RemiseGracieuseModal
        ouvert={!!remise}
        penalite={remise}
        onFermer={() => setRemise(null)}
        onValider={validerRemise}
      />
    </div>
  );
}
