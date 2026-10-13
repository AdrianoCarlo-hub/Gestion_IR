import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { lister as listerContribuables } from '../services/contribuableService';
import * as service from '../services/suspensionService';
import ContribuableRecherche from '../components/ContribuableRecherche';
import ConfirmDialog from '../components/ConfirmDialog';
import StatutBanner from '../components/suspensions/StatutBanner';
import DeclarationForm from '../components/suspensions/DeclarationForm';
import HistoriqueTimeline from '../components/suspensions/HistoriqueTimeline';
import { LoadingBlock } from '../components/Spinner';
import { useToast } from '../context/ToastContext';
import {
  LuBadgeCheck,
  LuActivity,
  LuCirclePause,
  LuCirclePlay,
} from 'react-icons/lu';

const today = () => {
  const date = new Date();
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
};
const yesterday = () => {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
};
const lendemain = (date) => {
  if (!date) return undefined;
  const lendemainDate = new Date(date + 'T00:00:00');
  lendemainDate.setDate(lendemainDate.getDate() + 1);
  const local = new Date(lendemainDate.getTime() - lendemainDate.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
};

const MOTIFS_ARRET = [
  { value: 'MANQUE_ACTIVITE', label: "Manque d'activite" },
  { value: 'TRAVAUX', label: 'Travaux' },
  { value: 'SAISON', label: 'Activite saisonniere' },
  { value: 'DIFFICULTE_FINANCIERE', label: 'Difficulte financiere' },
  { value: 'REORGANISATION', label: 'Reorganisation' },
  { value: 'AUTRE', label: 'Autre' },
];

export default function Suspensions() {
  const { agent } = useAuth();
  const toast = useToast();
  const [confirm, setConfirm] = useState(null);
  const [statusDialog, setStatusDialog] = useState(null);
  const [contribuables, setContribuables] = useState([]);
  const [selected, setSelected] = useState('');
  const [situation, setSituation] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    listerContribuables().then(setContribuables).catch(() => {});
  }, []);

  const charger = useCallback(async (id) => {
    if (!id) { setSituation(null); return; }
    setLoading(true);
    try {
      setSituation(await service.situation(id));
    } catch (e) {
      toast.error(e.response?.data?.message || 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (selected) charger(selected);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected]);

  const idAgent = agent ? agent.idAgent : 3;
  const enCours = situation ? situation.idSuspensionEnCours : null;
  const statutActuel = situation?.statutActuel;
  const evenementEnCours = situation?.historique?.find((evenement) => evenement.statut === 'EN_COURS');

  const demanderChangementStatut = () => {
    if (statutActuel !== 'ACTIF' && statutActuel !== 'SUSPENDU') return;

    const nouveauStatut = statutActuel === 'ACTIF' ? 'SUSPENDU' : 'ACTIF';
    setStatusDialog({
      statut: nouveauStatut,
      date: today(),
      dateArret: nouveauStatut === 'ACTIF' && !evenementEnCours ? yesterday() : '',
      motif: MOTIFS_ARRET[0].value,
    });
  };

  const soumettreChangementStatut = async (e) => {
    e.preventDefault();
    if (!statusDialog) return;
    try {
      await service.changerStatut(Number(selected), statusDialog.statut, idAgent, {
        dateArret: statusDialog.statut === 'SUSPENDU'
          ? statusDialog.date
          : !evenementEnCours ? statusDialog.dateArret : undefined,
        motif: statusDialog.statut === 'SUSPENDU' || !evenementEnCours
          ? statusDialog.motif : undefined,
        dateReprise: statusDialog.statut === 'ACTIF' ? statusDialog.date : undefined,
      });
      setStatusDialog(null);
      await charger(selected);
      toast.success(statusDialog.statut === 'ACTIF' ? 'Reprise enregistree' : 'Suspension enregistree');
    } catch (e2) {
      toast.error(e2.response?.data?.message || 'Erreur de changement du statut');
    }
  };

  const soumettre = async (type, payload) => {
    try {
      if (type === 'VEILLEUSE') {
        await service.declarerVeilleuse({ idContribuable: Number(selected), idAgent, ...payload });
        toast.success('Mise en veilleuse enregistree');
      } else if (type === 'CESSATION') {
        await service.declarerCessation({ idContribuable: Number(selected), idAgent, ...payload });
        toast.success('Cessation enregistree');
      } else if (type === 'REPRISE') {
        await service.declarerReprise(enCours, { idAgent, ...payload });
        toast.success('Reprise enregistree');
      }
      charger(selected);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Erreur');
    }
  };

  const attestation = async () => {
    try {
      const res = await service.attestationRadiation(enCours);
      toast.success('Attestation de radiation : ' + (res.attestationRadiationNumero || ''));
      charger(selected);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Erreur');
    }
  };

  const annuler = (id) => {
    setConfirm({
      titre: 'Annuler l evenement',
      message: 'Annuler cet evenement d arret / reprise ?',
      texteConfirmer: 'Annuler',
      danger: true,
      onConfirmer: async () => {
        try {
          await service.annuler(id);
          toast.success('Evenement annule');
          charger(selected);
        } catch (e) {
          toast.error(e.response?.data?.message || 'Erreur');
        }
      },
    });
  };

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1>Arret / reprise d activite</h1>
          <p className="page-sub">Veilleuse, cessation definitive et reprise</p>
        </div>
      </header>

      <div className="form-panel" style={{ marginBottom: 16 }}>
        <label className="form-label">Contribuable</label>
        <ContribuableRecherche contribuables={contribuables}
          value={selected} onChange={(id) => setSelected(id)} />
      </div>

      {!selected ? (
        <div className="empty-state">
          <div className="empty-state-icon"><LuActivity className="icon" /></div>
          <h3>Selectionnez un contribuable</h3>
          <p>Choisissez un contribuable pour gerer son activite</p>
        </div>
      ) : loading ? (
        <LoadingBlock message="Chargement..." />
      ) : (
        <>
          <div className="section-head" style={{ marginBottom: 16 }}>
            <div style={{ flex: '1 1 320px' }}>
              <StatutBanner statut={statutActuel} moisActifs={situation?.moisActifs} />
            </div>
            {(statutActuel === 'ACTIF' || statutActuel === 'SUSPENDU') && (
              <button
                className={statutActuel === 'ACTIF' ? 'btn btn-secondary' : 'btn btn-primary'}
                onClick={demanderChangementStatut}
                type="button"
              >
                {statutActuel === 'ACTIF'
                  ? <><LuCirclePause className="icon" /> Suspendre</>
                  : <><LuCirclePlay className="icon" /> Reactiver</>}
              </button>
            )}
          </div>

          {(statutActuel !== 'SUSPENDU' || enCours) && (
            <DeclarationForm onSoumettre={soumettre} enCours={enCours} enCoursId={enCours} />
          )}

          <div className="section-head">
            <h3 className="section-title">Historique</h3>
            <div className="row-actions">
              {enCours && situation?.typeEvenementEnCours === 'VEILLEUSE' && (
                <button className="btn btn-secondary" onClick={() => annuler(enCours)}>
                  Annuler l arret en cours
                </button>
              )}
              {enCours && situation?.typeEvenementEnCours === 'CESSATION' && (
                <button className="btn btn-validate" onClick={attestation}>
                  <LuBadgeCheck className="icon" /> Attestation de radiation
                </button>
              )}
            </div>
          </div>

          <HistoriqueTimeline historique={situation?.historique || []} />
        </>
      )}

      <ConfirmDialog
        ouvert={!!confirm}
        titre={confirm ? confirm.titre : ''}
        message={confirm ? confirm.message : ''}
        texteConfirmer={confirm ? confirm.texteConfirmer : 'Confirmer'}
        danger={confirm ? !!confirm.danger : false}
        onConfirmer={() => { if (confirm) confirm.onConfirmer(); setConfirm(null); }}
        onAnnuler={() => setConfirm(null)}
      />

      {statusDialog && (
        <div className="modal-overlay" onClick={() => setStatusDialog(null)}>
          <form
            className="modal-box"
            onSubmit={soumettreChangementStatut}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3>{statusDialog.statut === 'SUSPENDU' ? "Suspendre l'activite" : "Reprise d'activite"}</h3>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label required">
                  {statusDialog.statut === 'SUSPENDU' ? "Date d'arret" : 'Date de reprise'}
                </label>
                <input
                  className="form-input"
                  type="date"
                  value={statusDialog.date}
                  min={statusDialog.statut === 'ACTIF'
                    ? lendemain(evenementEnCours?.dateArret || statusDialog.dateArret) : undefined}
                  max={today()}
                  required
                  onChange={(e) => setStatusDialog((current) => ({ ...current, date: e.target.value }))}
                />
              </div>
              {statusDialog.statut === 'SUSPENDU' && (
                <div className="form-group" style={{ marginTop: 14 }}>
                  <label className="form-label required">Motif de suspension</label>
                  <select
                    className="form-input"
                    value={statusDialog.motif}
                    required
                    onChange={(e) => setStatusDialog((current) => ({ ...current, motif: e.target.value }))}
                  >
                    {MOTIFS_ARRET.map((motif) => (
                      <option key={motif.value} value={motif.value}>{motif.label}</option>
                    ))}
                  </select>
                </div>
              )}
              {statusDialog.statut === 'ACTIF' && !evenementEnCours && (
                <>
                  <div className="form-group" style={{ marginTop: 14 }}>
                    <label className="form-label required">Date de suspension historique</label>
                    <input
                      className="form-input"
                      type="date"
                      value={statusDialog.dateArret}
                      max={statusDialog.date}
                      required
                      onChange={(e) => setStatusDialog((current) => ({ ...current, dateArret: e.target.value }))}
                    />
                  </div>
                  <div className="form-group" style={{ marginTop: 14 }}>
                    <label className="form-label required">Motif de suspension</label>
                    <select
                      className="form-input"
                      value={statusDialog.motif}
                      required
                      onChange={(e) => setStatusDialog((current) => ({ ...current, motif: e.target.value }))}
                    >
                      {MOTIFS_ARRET.map((motif) => (
                        <option key={motif.value} value={motif.value}>{motif.label}</option>
                      ))}
                    </select>
                  </div>
                </>
              )}
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setStatusDialog(null)}>
                Annuler
              </button>
              <button type="submit" className="btn btn-primary">
                {statusDialog.statut === 'SUSPENDU' ? 'Confirmer la suspension' : 'Confirmer la reprise'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
