import { useEffect, useState } from 'react';
import { listerSecteurs } from '../services/secteurService';

const vide = {
  nif: '',
  stat: '',
  raisonSociale: '',
  formeJuridique: 'SARL',
  nomDirigeant: '',
  cinDirigeant: '',
  adresse: '',
  telephone: '',
  email: '',
  idSecteur: '',
  regime: 'REEL_OPTION',
  dateImmatriculation: '',
  moisCloture: 12,
};

export default function ContribuableForm({ initial, onSubmit, onCancel }) {
  const [form, setForm] = useState(initial || vide);
  const [secteurs, setSecteurs] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    listerSecteurs().then(setSecteurs);
  }, []);

  useEffect(() => {
    setForm(initial || vide);
  }, [initial]);

  const setField = (name, value) => {
    setForm((f) => ({ ...f, [name]: value }));
    setErrors((e) => ({ ...e, [name]: null }));
  };

  const valider = () => {
    const e = {};
    if (!/^\d{10}$/.test(form.nif || '')) e.nif = 'NIF : 10 chiffres requis';
    if (!form.raisonSociale || form.raisonSociale.trim().length < 2)
      e.raisonSociale = 'Raison sociale obligatoire';
    if (!/^\d{12}$/.test(form.cinDirigeant || ''))
      e.cinDirigeant = 'CIN : 12 chiffres requis';
    if (form.stat && !/^\d{17}$/.test(form.stat))
      e.stat = 'STAT : 17 chiffres si renseigne';
    if (form.telephone && !/^\d{10}$/.test(form.telephone))
      e.telephone = 'Telephone : 10 chiffres';
    if (form.email && !/^[\w.+-]+@[\w-]+\.[\w.-]+$/.test(form.email))
      e.email = 'E-mail invalide';
    if (!form.idSecteur) e.idSecteur = 'Secteur obligatoire';
    if (!form.dateImmatriculation) e.dateImmatriculation = 'Date obligatoire';
    if (form.dateImmatriculation) {
      const d = new Date(form.dateImmatriculation);
      if (d > new Date()) e.dateImmatriculation = 'Date dans le futur interdite';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!valider()) return;
    setLoading(true);
    try {
      await onSubmit({
        ...form,
        idSecteur: Number(form.idSecteur),
        moisCloture: Number(form.moisCloture),
        secteur: { idSecteur: Number(form.idSecteur) },
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="form-panel" onSubmit={handleSubmit}>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">NIF *</label>
          <input
            className={'form-input ' + (errors.nif ? 'input-error' : '')}
            value={form.nif}
            maxLength={10}
            onChange={(e) => setField('nif', e.target.value.replace(/\D/g, ''))}
          />
          {errors.nif && <span className="error-msg">{errors.nif}</span>}
        </div>
        <div className="form-group">
          <label className="form-label">STAT</label>
          <input
            className={'form-input ' + (errors.stat ? 'input-error' : '')}
            value={form.stat}
            maxLength={17}
            onChange={(e) => setField('stat', e.target.value.replace(/\D/g, ''))}
          />
          {errors.stat && <span className="error-msg">{errors.stat}</span>}
        </div>
      </div>

      <div className="form-row">
        <div className="form-group" style={{ flex: 2 }}>
          <label className="form-label">Raison sociale *</label>
          <input
            className={'form-input ' + (errors.raisonSociale ? 'input-error' : '')}
            value={form.raisonSociale}
            onChange={(e) => setField('raisonSociale', e.target.value)}
          />
          {errors.raisonSociale && <span className="error-msg">{errors.raisonSociale}</span>}
        </div>
        <div className="form-group">
          <label className="form-label">Forme juridique *</label>
          <select
            className="form-input"
            value={form.formeJuridique}
            onChange={(e) => setField('formeJuridique', e.target.value)}
          >
            <option value="EI">EI</option>
            <option value="SARL">SARL</option>
            <option value="SA">SA</option>
            <option value="SOCIETE_PERSONNES">Societe de personnes</option>
            <option value="ASSOCIATION">Association</option>
            <option value="COOPERATIVE">Cooperative</option>
          </select>
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Nom du dirigeant *</label>
          <input
            className="form-input"
            value={form.nomDirigeant}
            onChange={(e) => setField('nomDirigeant', e.target.value)}
          />
        </div>
        <div className="form-group">
          <label className="form-label">CIN du dirigeant *</label>
          <input
            className={'form-input ' + (errors.cinDirigeant ? 'input-error' : '')}
            value={form.cinDirigeant}
            maxLength={12}
            onChange={(e) => setField('cinDirigeant', e.target.value.replace(/\D/g, ''))}
          />
          {errors.cinDirigeant && <span className="error-msg">{errors.cinDirigeant}</span>}
        </div>
      </div>

      <div className="form-row">
        <div className="form-group" style={{ flex: 2 }}>
          <label className="form-label">Adresse *</label>
          <input
            className="form-input"
            value={form.adresse}
            onChange={(e) => setField('adresse', e.target.value)}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Telephone</label>
          <input
            className={'form-input ' + (errors.telephone ? 'input-error' : '')}
            value={form.telephone}
            maxLength={10}
            onChange={(e) => setField('telephone', e.target.value.replace(/\D/g, ''))}
          />
          {errors.telephone && <span className="error-msg">{errors.telephone}</span>}
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">E-mail</label>
          <input
            className={'form-input ' + (errors.email ? 'input-error' : '')}
            value={form.email}
            onChange={(e) => setField('email', e.target.value)}
          />
          {errors.email && <span className="error-msg">{errors.email}</span>}
        </div>
        <div className="form-group">
          <label className="form-label">Secteur d'activite *</label>
          <select
            className={'form-input ' + (errors.idSecteur ? 'input-error' : '')}
            value={form.idSecteur}
            onChange={(e) => setField('idSecteur', e.target.value)}
          >
            <option value="">-- Choisir --</option>
            {secteurs.map((s) => (
              <option key={s.idSecteur} value={s.idSecteur}>{s.libelle}</option>
            ))}
          </select>
          {errors.idSecteur && <span className="error-msg">{errors.idSecteur}</span>}
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Regime *</label>
          <select
            className="form-input"
            value={form.regime}
            onChange={(e) => setField('regime', e.target.value)}
          >
            <option value="REEL_OBLIGATOIRE">Reel obligatoire</option>
            <option value="REEL_OPTION">Reel sur option</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Date immatriculation *</label>
          <input
            type="date"
            className={'form-input ' + (errors.dateImmatriculation ? 'input-error' : '')}
            value={form.dateImmatriculation}
            onChange={(e) => setField('dateImmatriculation', e.target.value)}
          />
          {errors.dateImmatriculation && (
            <span className="error-msg">{errors.dateImmatriculation}</span>
          )}
        </div>
        <div className="form-group">
          <label className="form-label">Mois cloture</label>
          <input
            type="number"
            min={1}
            max={12}
            className="form-input"
            value={form.moisCloture}
            onChange={(e) => setField('moisCloture', e.target.value)}
          />
        </div>
      </div>

      <div className="form-actions">
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Enregistrement...' : 'Enregistrer'}
        </button>
        <button type="button" className="btn-secondary" onClick={onCancel}>
          Annuler
        </button>
      </div>
    </form>
  );
}
