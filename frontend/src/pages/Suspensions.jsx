import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { lister as listerContribuables } from '../services/contribuableService';
import * as service from '../services/suspensionService';
import ConfirmDialog from '../components/ConfirmDialog';
import { useToast } from '../context/ToastContext';
import { LoadingBlock, SkeletonTable } from '../components/Spinner';
import { LuCirclePause, LuCirclePlay, LuUser, LuCalendar, LuFileText, LuTriangleAlert, LuTrash2, LuPlus, LuX } from "react-icons/lu";

const today = new Date().toISOString().slice(0, 10);

export default function Suspensions() {
  const { agent } = useAuth();
  const toast = useToast();
  const [confirm, setConfirm] = useState(null);
  const [contribuables, setContribuables] = useState([]);
  const [selected, setSelected] = useState('');
  const [historique, setHistorique] = useState([]);
  const [error, setError] = useState('');
  const [formArret, setFormArret] = useState({ dateArret: today, motif: 'MANQUE_ACTIVITE', refDeclaration: '' });
  const [formReprise, setFormReprise] = useState({ dateReprise: today });

  useEffect(() => {
    listerContribuables().then(setContribuables).catch(() => {});
  }, []);

  const charger = async (id) => {
    if (!id) return;
    try {
      setHistorique(await service.parContribuable(id));
    } catch (e) {
      setError(e.response?.data?.message || 'Erreur');
    }
  };

  useEffect(() => {
    if (selected) charger(selected);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected]);

  const handleArret = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await service.declarerArret({
        idContribuable: Number(selected),
        dateArret: formArret.dateArret,
        motif: formArret.motif,
        refDeclaration: formArret.refDeclaration || null,
        idAgent: agent ? agent.idAgent : 3,
      });
      toast.success('Arret enregistre');
      charger(selected);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur');
    }
  };

  const handleReprise = async (idSuspension) => {
    setError('');
    try {
      await service.declarerReprise(idSuspension, {
        dateReprise: formReprise.dateReprise,
        idAgent: agent ? agent.idAgent : 3,
      });
      toast.success('Reprise enregistree');
      charger(selected);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur');
    }
  };

  const handleAnnuler = (id) => {
    setConfirm({
      titre: 'Annuler la suspension',
      message: 'Annuler cette suspension ?',
      texteConfirmer: 'Annuler',
      danger: true,
      onConfirmer: async () => {
        try {
          await service.annuler(id);
          toast.success('Suspension annulee');
          charger(selected);
        } catch (err) {
          toast.error(err.response?.data?.message || 'Erreur');
        }
      },
    });
  };

  const enCours = historique.find((h) => h.statut === 'EN_COURS');

  // Filtrer les contribuables avec suspensions
  const contribuablesAvecSuspensions = contribuables.filter(c => 
    historique.some(h => h.contribuable?.idContribuable === c.idContribuable)
  );

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1>Arret / reprise d activite</h1>
          <p className="page-sub">Suspension de l impot pendant l arret</p>
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

      <div className="form-panel" style={{ marginBottom: 16 }}>
        <label className="form-label">Contribuable</label>
        <select 
          className="form-select" 
          value={selected} 
          onChange={(e) => setSelected(e.target.value)}
        >
          <option value="">-- Choisir un contribuable --</option>
          {contribuables.map((c) => (
            <option key={c.idContribuable} value={c.idContribuable}>
              {c.nif} - {c.raisonSociale} ({c.statut})
            </option>
          ))}
        </select>
      </div>

      {selected && !enCours && (
        <form className="form-panel" onSubmit={handleArret} style={{ marginBottom: 16 }}>
          <h3 className="section-title">
            <LuCirclePause className="section-icon" />
            Declarer un arret
          </h3>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label required">Date d arret *</label>
              <input 
                type="date" 
                className="form-input" 
                value={formArret.dateArret}
                onChange={(e) => setFormArret({ ...formArret, dateArret: e.target.value })} 
                required 
              />
            </div>
            <div className="form-group">
              <label className="form-label required">Motif *</label>
              <select 
                className="form-select" 
                value={formArret.motif}
                onChange={(e) => setFormArret({ ...formArret, motif: e.target.value })}
              >
                <option value="MANQUE_ACTIVITE">Manque d activite</option>
                <option value="TRAVAUX">Travaux</option>
                <option value="SAISON">Saison</option>
                <option value="DIFFICULTE_FINANCIERE">Difficulte financiere</option>
                <option value="AUTRE">Autre</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">N declaration ecrite</label>
              <input 
                className="form-input" 
                value={formArret.refDeclaration}
                onChange={(e) => setFormArret({ ...formArret, refDeclaration: e.target.value })}
              />
            </div>
          </div>
          <div className="form-actions">
            <button type="submit" className="btn btn-primary">
              <LuCirclePause className="icon" />
              Enregistrer l arret
            </button>
          </div>
        </form>
      )}

      {enCours && (
        <div className="form-panel" style={{ marginBottom: 16 }}>
          <h3 className="section-title">
            <LuCirclePlay className="section-icon" />
            Declarer la reprise
          </h3>
          <div className="alert alert-info" style={{ marginBottom: 16 }}>
            <span className="alert-icon">
              <LuCirclePause className="icon" />
            </span>
            <span>Un arret est en cours pour ce contribuable (Date: {enCours.dateArret}, Motif: {enCours.motif})</span>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label required">Date de reprise *</label>
              <input 
                type="date" 
                className="form-input" 
                value={formReprise.dateReprise}
                onChange={(e) => setFormReprise({ dateReprise: e.target.value })}
              />
            </div>
          </div>
          <div className="form-actions">
            <button className="btn btn-validate" onClick={() => handleReprise(enCours.idSuspension)}>
              <LuCirclePlay className="icon" />
              Enregistrer la reprise
            </button>
          </div>
        </div>
      )}

      {selected && historique.length > 0 && (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date arret</th>
                <th>Date reprise</th>
                <th>Motif</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {historique.map((h) => (
                <tr key={h.idSuspension}>
                  <td>{h.dateArret}</td>
                  <td>{h.dateReprise || '-'}</td>
                  <td>
                    <span className="badge badge-info" style={{ fontSize: 11 }}>
                      {h.motif}
                    </span>
                  </td>
                  <td>
                    <span className={'badge badge-' + (h.statut === 'EN_COURS' ? 'suspendu' : 'actif')}>
                      {h.statut}
                    </span>
                  </td>
                  <td>
                    {h.statut === 'EN_COURS' && (
                      <button 
                        className="btn-icon delete"
                        onClick={() => handleAnnuler(h.idSuspension)}
                        title="Annuler"
                      >
                        <LuTrash2 className="icon" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

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
