import { useEffect, useState, useCallback } from 'react';
import { lister as listerContribuables } from '../services/contribuableService';
import * as service from '../services/acompteService';
import ContribuableRecherche from '../components/ContribuableRecherche';
import ConfirmDialog from '../components/ConfirmDialog';
import AcompteCard from '../components/acomptes/AcompteCard';
import AcompteDouaneModal from '../components/acomptes/AcompteDouaneModal';
import SimulateurLiquidation from '../components/acomptes/SimulateurLiquidation';
import ChronologiePaiements from '../components/acomptes/ChronologiePaiements';
import { SkeletonTable, SkeletonStatsGrid } from '../components/Spinner';
import { useToast } from '../context/ToastContext';
import {
  LuCalendar, LuCircleAlert, LuCircleCheck, LuClock3, LuCreditCard,
  LuFileText, LuPackage, LuPlus, LuShip, LuTrendingUp, LuWallet,
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
    if (!id) {
      setSituation(null);
      setEcheances(null);
      setChronologie([]);
      return;
    }
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
    // eslint-disable-next-line react-hooks/set-state-in-effect
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
  const contribuableSelectionne = contribuables.find(
    (contribuable) => String(contribuable.idContribuable) === String(selected)
  );
  const anneeCreation = contribuableSelectionne?.dateImmatriculation
    ? new Date(contribuableSelectionne.dateImmatriculation).getFullYear()
    : null;
  const totalExigibles = s.totalExigibles || 0;
  const cumulVerse = s.cumulVerse || 0;
  const solde = s.creditImpot > 0 ? -s.creditImpot : (s.solde || 0);
  const progression = totalExigibles > 0
    ? Math.min(100, Math.round((cumulVerse / totalExigibles) * 100))
    : 0;
  const totalDouane = s.douane.reduce((total, acompte) => total + (acompte.montantAr || 0), 0);
  const provisionnelMai = echeances?.eligible ? echeances.echeance15Mai : null;
  const provisionnelNovembre = echeances?.eligible ? echeances.echeance15Novembre : null;

  return (
    <div className="page acomptes-page">
      <header className="acomptes-header">
        <div className="acomptes-header-title">
          <span className="acomptes-eyebrow"><LuTrendingUp aria-hidden="true" /> Gestion fiscale</span>
          <h1>Acomptes IR</h1>
          <p className="page-sub">Exercice {annee} — Suivi des acomptes provisionnels et douaniers</p>
        </div>
        <div className="acomptes-header-selector">
          <div className="acomptes-selector-contribuable">
            <label className="form-label" htmlFor="acompte-contribuable">Contribuable</label>
            <ContribuableRecherche
              contribuables={contribuables}
              value={selected}
              onChange={(id) => setSelected(id)}
            />
          </div>
          <div className="acomptes-selector-annee">
            <label className="form-label" htmlFor="acompte-annee">Exercice</label>
            <input id="acompte-annee" type="number" className="form-input" value={annee}
              min="2000" max="2100" onChange={(e) => setAnnee(Number(e.target.value))} />
          </div>
        </div>
      </header>

      {!selected ? (
        <div className="acomptes-empty-state">
          <span className="acomptes-empty-icon"><LuWallet aria-hidden="true" /></span>
          <h2>Selectionnez un contribuable</h2>
          <p>Choisissez un contribuable pour consulter ses echeances et paiements.</p>
        </div>
      ) : loading ? (
        <div className="acomptes-loading" aria-live="polite">
          <SkeletonStatsGrid count={4} />
          <SkeletonTable rows={4} cols={5} />
        </div>
      ) : (
        <div className="acomptes-content">
          <section className="acomptes-kpi-section" aria-label="Synthese des acomptes">
            <div className="acompte-kpi-grid">
              <article className="acompte-kpi accent-blue">
                <span className="kpi-icon"><LuFileText aria-hidden="true" /></span>
                <span className="kpi-label">IR N-1</span>
                <strong className="kpi-value">{fmt(s.irN1)} <small>Ar</small></strong>
                <span className="kpi-caption">Base de reference des provisions</span>
              </article>
              <article className="acompte-kpi accent-green">
                <span className="kpi-icon"><LuCircleCheck aria-hidden="true" /></span>
                <span className="kpi-label">Total exigibles</span>
                <strong className="kpi-value">{fmt(totalExigibles)} <small>Ar</small></strong>
                <span className="kpi-caption">Echeances enregistrees pour {annee}</span>
              </article>
              <article className="acompte-kpi accent-emeraude">
                <span className="kpi-icon"><LuCreditCard aria-hidden="true" /></span>
                <span className="kpi-label">Cumul verse</span>
                <strong className="kpi-value">{fmt(cumulVerse)} <small>Ar</small></strong>
                <span className="kpi-caption">{progression} % des montants exigibles</span>
                <span className="kpi-progress-bar" role="progressbar" aria-label="Progression des paiements"
                  aria-valuemin="0" aria-valuemax="100" aria-valuenow={progression}>
                  <span className="kpi-progress-fill" style={{ width: progression + '%' }} />
                </span>
              </article>
              <article className={'acompte-kpi ' + (solde > 0 ? 'accent-red' : 'accent-green')}>
                <span className="kpi-icon">
                  {solde > 0 ? <LuCircleAlert aria-hidden="true" /> : <LuCircleCheck aria-hidden="true" />}
                </span>
                <span className="kpi-label">{solde > 0 ? 'Solde a payer' : 'Credit d impot'}</span>
                <strong className="kpi-value">{fmt(Math.abs(solde))} <small>Ar</small></strong>
                <span className="kpi-caption">{solde > 0 ? 'Reste sur les acomptes exigibles' : 'Aucun solde restant sur les acomptes'}</span>
              </article>
            </div>
          </section>

          <section className="acomptes-section">
            <div className="section-header">
              <div>
                <span className="acomptes-section-kicker">IR provisionnel</span>
                <h2><LuCalendar aria-hidden="true" /> Acomptes provisionnels</h2>
              </div>
              <span className="section-badge">{s.provisionnels.length} echeance(s)</span>
            </div>
            {s.provisionnels.length === 0 ? (
              provisionnelMai && provisionnelNovembre ? (
                <div className="acomptes-provisionnels-grid">
                  <div className="acompte-card acompte-card--schedule">
                    <header className="acompte-card-header">
                      <div className="acompte-card-heading">
                        <span className="acompte-card-icon"><LuCalendar aria-hidden="true" /></span>
                        <div><span className="acompte-card-overline">Premiere echeance</span>
                          <h3 className="acompte-card-title">15 mai {annee}</h3></div>
                      </div>
                      <span className="badge badge-a_payer">A payer</span>
                    </header>
                    <div className="acompte-card-body">
                      <div className="acompte-detail-ligne"><span>Solde IR {annee - 1}</span><strong>{fmt(provisionnelMai.soldeN1)} Ar</strong></div>
                      <div className="acompte-detail-ligne"><span>Acompte 1 (50 % de l'IR N-1)</span><strong>{fmt(provisionnelMai.acompte1N)} Ar</strong></div>
                      <div className="acompte-total-ligne"><span>Total au 15 mai</span><strong>{fmt(provisionnelMai.total)} Ar</strong></div>
                    </div>
                  </div>
                  <div className="acompte-card acompte-card--schedule">
                    <header className="acompte-card-header">
                      <div className="acompte-card-heading">
                        <span className="acompte-card-icon"><LuCalendar aria-hidden="true" /></span>
                        <div><span className="acompte-card-overline">Seconde echeance</span>
                          <h3 className="acompte-card-title">15 novembre {annee}</h3></div>
                      </div>
                      <span className="badge badge-a_payer">A payer</span>
                    </header>
                    <div className="acompte-card-body">
                      <div className="acompte-detail-ligne"><span>Acompte 2 (50 % de l'IR N-1)</span><strong>{fmt(provisionnelNovembre.acompte2N)} Ar</strong></div>
                      <div className="acompte-total-ligne"><span>Total au 15 novembre</span><strong>{fmt(provisionnelNovembre.total)} Ar</strong></div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="acomptes-inline-empty">
                  <LuClock3 aria-hidden="true" />
                  <div><strong>Aucun acompte provisionnel enregistre</strong>
                    <span>{echeances?.message || 'Les acomptes sont generes apres validation d une declaration IR N-1.'}</span></div>
                </div>
              )
            ) : (
              <div className="acomptes-provisionnels-grid">
                {s.provisionnels.map((acompte) => (
                  <AcompteCard
                    key={acompte.idAcompte}
                    acompte={acompte}
                    echeancesDetail={acompte.numero === 1 ? provisionnelMai : null}
                    onSuspendre={suspendre}
                    onReactiver={reactiver}
                    onPayer={payer}
                  />
                ))}
              </div>
            )}
          </section>

          {s.creation.length > 0 && (
            <section className="acomptes-section acompte-creation-section">
              <div className="section-header">
                <div><span className="acomptes-section-kicker">Debut d'activite</span>
                  <h2><LuFileText aria-hidden="true" /> Acompte de creation</h2></div>
                <span className="section-badge">{s.creation.length} acompte(s)</span>
              </div>
              <div className="acomptes-provisionnels-grid">
                {s.creation.map((acompte) => (
                  <article className="acompte-card acompte-card--creation" key={acompte.idAcompte}>
                    <header className="acompte-card-header">
                      <div className="acompte-card-heading">
                        <span className="acompte-card-icon"><LuFileText aria-hidden="true" /></span>
                        <div><span className="acompte-card-overline">Annee {acompte.annee}</span>
                          <h3 className="acompte-card-title">Acompte de debut d'activite</h3></div>
                      </div>
                      <span className={'badge ' + (acompte.statut === 'PAYE' ? 'badge-actif' : 'badge-a_payer')}>{acompte.statut}</span>
                    </header>
                    <div className="acompte-card-body">
                      <div className="acompte-detail-ligne"><span>Date</span><strong>{acompte.dateEcheance || '-'}</strong></div>
                      <div className="acompte-total-ligne"><span>Montant</span><strong>{fmt(acompte.montantAr)} Ar</strong></div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}

          <section className="acomptes-section douane-section">
            <div className="section-header douane-header">
              <div><span className="acomptes-section-kicker">AIRS · Retenue de 2 %</span>
                <h2><LuPackage aria-hidden="true" /> Acomptes douaniers</h2></div>
              <div className="section-stats">
                <span>Total encaisse <strong>{fmt(totalDouane)} Ar</strong></span>
                <span>{s.douane.length} quittance(s)</span>
              </div>
            </div>
            <button className="btn btn-primary btn-add-douane" onClick={() => setDouaneOuvert(true)}>
              <LuPlus aria-hidden="true" /> Enregistrer une quittance douaniere
            </button>
            {s.douane.length > 0 ? (
              <div className="table-container acomptes-table-container">
                <table className="data-table acomptes-table">
                  <thead><tr><th>Date</th><th>Reference douane</th><th>Valeur CAF</th><th>Taux</th><th>Montant</th><th>Statut</th></tr></thead>
                  <tbody>{s.douane.map((acompte) => (
                    <tr key={acompte.idAcompte}>
                      <td>{acompte.dateEcheance}</td><td>{acompte.referenceDouane || '-'}</td>
                      <td>{fmt(acompte.baseIrN1)} Ar</td><td>{acompte.tauxPct} %</td>
                      <td><strong>{fmt(acompte.montantAr)} Ar</strong></td>
                      <td><span className="badge badge-actif">{acompte.statut}</span></td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            ) : (
              <div className="acomptes-inline-empty acomptes-inline-empty--compact">
                <LuShip aria-hidden="true" /><span>Aucune quittance de douane enregistree pour {annee}.</span>
              </div>
            )}
          </section>

          <section className="acomptes-section">
            <div className="section-header">
              <div><span className="acomptes-section-kicker">Estimation</span>
                <h2><LuTrendingUp aria-hidden="true" /> Simulateur d'atterrissage fiscal</h2></div>
            </div>
            <SimulateurLiquidation cumulAcomptes={cumulVerse} />
          </section>

          <section className="acomptes-section">
            <div className="section-header">
              <div><span className="acomptes-section-kicker">Historique fiscal</span>
                <h2><LuClock3 aria-hidden="true" /> Chronologie des paiements</h2></div>
              <span className="section-badge">{chronologie.length} exercice(s)</span>
            </div>
            <ChronologiePaiements
              anneeCreation={anneeCreation}
              annee={annee}
              irN1={s.irN1}
              acomptesVerses={s.cumulVerse}
              chronologie={chronologie}
            />
          </section>
        </div>
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
