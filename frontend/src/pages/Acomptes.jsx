import { useEffect, useState, useCallback } from 'react';
import { lister as listerContribuables } from '../services/contribuableService';
import * as service from '../services/acompteService';
import ContribuableRecherche from '../components/ContribuableRecherche';
import ConfirmDialog from '../components/ConfirmDialog';
import AcompteCard from '../components/acomptes/AcompteCard';
import AcompteDouaneModal from '../components/acomptes/AcompteDouaneModal';
import SimulateurLiquidation from '../components/acomptes/SimulateurLiquidation';
import { SkeletonTable, SkeletonStatsGrid } from '../components/Spinner';
import { useToast } from '../context/ToastContext';
import {
  LuCircleDollarSign, LuCalendar, LuTrendingUp, LuWallet, LuShip,
  LuPlus,
} from 'react-icons/lu';

const fmt = (n) => (n == null ? '0' : Number(n).toLocaleString('fr-FR').replace(/\u202f|\u00a0/g, ' '));
const anneeCourante = new Date().getFullYear();

export default function Acomptes() {
  const toast = useToast();
  const [contribuables, setContribuables] = useState([]);
  const [selected, setSelected] = useState('');
  const [annee, setAnnee] = useState(anneeCourante);
  const [situation, setSituation] = useState(null);
  const [echeances, setEcheances] = useState(null);
  const [chronologie, setChronologie] = useState([]);
  const [loading, setLoading] = useState(false);
  const [douaneOuvert, setDouaneOuvert] = useState(false);
  const [confirm, setConfirm] = useState(null);

  useEffect(() => {
    listerContribuables().then(setContribuables).catch(() => {});
  }, []);

  const charger = useCallback(async (id, an) => {
    if (!id) { setSituation(null); setEcheances(null); setChronologie([]); return; }
    setLoading(true);
    try {
      setSituation(await service.getSituation(id, an));
      try {
        setEcheances(await service.getEcheances(id, an));
      } catch {
        setEcheances(null);
      }
      try {
        setChronologie(await service.getChronologie(id));
      } catch {
        setChronologie([]);
      }
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

  const suspendre = (a) => {
    setConfirm({
      titre: 'Demander la suspension',
      message: 'La suspension d un acompte provisionnel sans motif valable expose a une amende de 80 % (CDI art. 05.01.06). Confirmer ?',
      texteConfirmer: 'Suspendre',
      danger: true,
      onConfirmer: async () => {
        try {
          await service.suspendre(a.idAcompte);
          toast.success('Acompte suspendu');
          charger(selected, annee);
        } catch (e) {
          toast.error(e.response?.data?.message || 'Erreur');
        }
      },
    });
  };

  const reactiver = async (a) => {
    try {
      await service.reactiver(a.idAcompte);
      toast.success('Acompte reactive');
      charger(selected, annee);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Erreur');
    }
  };

  const payer = async (a) => {
    try {
      await service.changerStatut(a.idAcompte, 'PAYE');
      toast.success('Acompte regle');
      charger(selected, annee);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Erreur');
    }
  };

  const enregistrerDouane = async (payload) => {
    try {
      await service.enregistrerDouane({ idContribuable: Number(selected), annee, ...payload });
      toast.success('Quittance de douane enregistree');
      setDouaneOuvert(false);
      charger(selected, annee);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Erreur');
    }
  };

  const s = situation || { creation: [], provisionnels: [], douane: [] };

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1>Acomptes</h1>
          <p className="page-sub">Creation, provisionnels (2 x 50 %) et retenue douane</p>
        </div>
      </header>

      <div className="form-panel" style={{ marginBottom: 16 }}>
        <div className="form-row">
          <div className="form-group" style={{ flex: 2 }}>
            <label className="form-label">Contribuable</label>
            <ContribuableRecherche
              contribuables={contribuables}
              value={selected}
              onChange={(id) => setSelected(id)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Annee</label>
            <input type="number" className="form-input" value={annee}
              onChange={(e) => setAnnee(Number(e.target.value))} />
          </div>
        </div>
      </div>

      {!selected ? (
        <div className="empty-state">
          <div className="empty-state-icon"><LuWallet className="icon" /></div>
          <h3>Selectionnez un contribuable</h3>
          <p>Choisissez un contribuable pour afficher sa situation d acomptes</p>
        </div>
      ) : loading ? (
        <>
          <SkeletonStatsGrid count={4} />
          <SkeletonTable rows={4} cols={5} />
        </>
      ) : (
        <>
          <div className="cards-grid" style={{ marginBottom: 24 }}>
            <div className="stat-card financial encaisse">
              <div className="stat-card-header">
                <div className="stat-card-icon"><LuTrendingUp className="icon" style={{ width: 20, height: 20 }} /></div>
              </div>
              <span className="stat-label">IR N-1</span>
              <span className="stat-value">{fmt(s.irN1)} Ar</span>
            </div>
            <div className="stat-card financial ir-du">
              <div className="stat-card-header">
                <div className="stat-card-icon blue"><LuCircleDollarSign className="icon" style={{ width: 20, height: 20 }} /></div>
              </div>
              <span className="stat-label">Total exigibles</span>
              <span className="stat-value">{fmt(s.totalExigibles)} Ar</span>
            </div>
            <div className="stat-card financial encaisse">
              <div className="stat-card-header">
                <div className="stat-card-icon"><LuWallet className="icon" style={{ width: 20, height: 20 }} /></div>
              </div>
              <span className="stat-label">Cumul verse</span>
              <span className="stat-value">{fmt(s.cumulVerse)} Ar</span>
            </div>
            <div className={'stat-card financial ' + (s.solde > 0 ? 'reste' : 'encaisse')}>
              <div className="stat-card-header">
                <div className="stat-card-icon orange"><LuCalendar className="icon" style={{ width: 20, height: 20 }} /></div>
              </div>
              <span className="stat-label">{s.creditImpot > 0 ? 'Credit d impot' : 'Solde'}</span>
              <span className="stat-value">{fmt(s.creditImpot > 0 ? s.creditImpot : s.solde)} Ar</span>
            </div>
          </div>

          <h3 className="section-title"><LuCalendar className="section-icon" /> Acomptes provisionnels</h3>
          {echeances?.eligible && (
            <div className="acompte-echeances-grid">
              <div className="acompte-card">
                <div className="acompte-card-head">
                  <span className="acompte-card-title">
                    <LuCalendar className="icon" /> Echeance du 15 mai {annee}
                  </span>
                  <span className="badge badge-info">SOLDE + ACOMPTE 1</span>
                </div>
                <div className="acompte-card-body">
                  <div className="acompte-line">
                    <span>Solde IR {annee - 1}</span>
                    <strong>{fmt(echeances.echeance15Mai.soldeN1)} Ar</strong>
                  </div>
                  <div className="acompte-line">
                    <span>Acompte 1 de {annee} (50 % IR {annee - 1})</span>
                    <strong>{fmt(echeances.echeance15Mai.acompte1N)} Ar</strong>
                  </div>
                  <div className="acompte-line acompte-total">
                    <span>Total a payer le 15 mai</span>
                    <strong>{fmt(echeances.echeance15Mai.total)} Ar</strong>
                  </div>
                </div>
              </div>
              <div className="acompte-card">
                <div className="acompte-card-head">
                  <span className="acompte-card-title">
                    <LuCalendar className="icon" /> Echeance du 15 novembre {annee}
                  </span>
                  <span className="badge badge-info">ACOMPTE 2</span>
                </div>
                <div className="acompte-card-body">
                  <div className="acompte-line">
                    <span>Acompte 2 de {annee} (50 % IR {annee - 1})</span>
                    <strong>{fmt(echeances.echeance15Novembre.acompte2N)} Ar</strong>
                  </div>
                  <div className="acompte-line acompte-total">
                    <span>Total a payer le 15 novembre</span>
                    <strong>{fmt(echeances.echeance15Novembre.total)} Ar</strong>
                  </div>
                </div>
              </div>
            </div>
          )}
          {s.provisionnels.length === 0 ? (
            <div className="empty-state" style={{ padding: 24 }}>
              <p>Aucun acompte provisionnel pour cette annee</p>
            </div>
          ) : (
            <div className="acompte-grid">
              {s.provisionnels.map((a) => (
                <AcompteCard key={a.idAcompte} acompte={a}
                  onSuspendre={suspendre} onReactiver={reactiver} onPayer={payer} />
              ))}
            </div>
          )}

          <div className="douane-section">
            <h3 className="section-title">
              <LuShip className="section-icon" /> Acomptes en douane (AIRS)
              <button className="btn btn-primary" style={{ marginLeft: 'auto' }}
                onClick={() => setDouaneOuvert(true)}>
                <LuPlus className="icon" /> Enregistrer quittance
              </button>
            </h3>
            {s.douane.length === 0 ? (
              <div className="empty-state" style={{ padding: 24 }}>
                <p>Aucune quittance de douane enregistree</p>
              </div>
            ) : (
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Reference douane</th>
                      <th>Valeur CAF</th>
                      <th>Taux</th>
                      <th>Montant</th>
                      <th>Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {s.douane.map((a) => (
                      <tr key={a.idAcompte}>
                        <td>{a.dateEcheance}</td>
                        <td>{a.referenceDouane || '-'}</td>
                        <td>{fmt(a.baseIrN1)} Ar</td>
                        <td>{a.tauxPct} %</td>
                        <td><strong>{fmt(a.montantAr)} Ar</strong></td>
                        <td><span className="badge badge-actif">{a.statut}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <SimulateurLiquidation cumulAcomptes={s.cumulVerse} chronologie={chronologie} />
        </>
      )}

      <AcompteDouaneModal
        ouvert={douaneOuvert}
        onFermer={() => setDouaneOuvert(false)}
        onValider={enregistrerDouane}
      />

      <ConfirmDialog
        ouvert={!!confirm}
        titre={confirm ? confirm.titre : ''}
        message={confirm ? confirm.message : ''}
        texteConfirmer={confirm ? confirm.texteConfirmer : 'Confirmer'}
        danger={confirm ? !!confirm.danger : false}
        onConfirmer={() => { if (confirm && confirm.onConfirmer) confirm.onConfirmer(); setConfirm(null); }}
        onAnnuler={() => setConfirm(null)}
      />
    </div>
  );
}
