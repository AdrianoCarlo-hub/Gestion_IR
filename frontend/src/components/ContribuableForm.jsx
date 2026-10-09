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

// Retire tout caractere non-numerique
const onlyDigits = (str, maxLen) => {
  const digits = (str || '').replace(/\D/g, '');
  return maxLen ? digits.slice(0, maxLen) : digits;
};

// Prefixes telephone Madagascar autorises
const PREFIXES_TEL = ['031', '032', '033', '034', '038'];

/**
 * Valide un champ individuel et retourne le message d'erreur ou null.
 * Permet la validation en temps reel pendant la frappe.
 */
const validerChamp = (name, value, form) => {
  switch (name) {
    case 'nif': {
      if (!value) return null; // vide = pas d'erreur tant qu'on n'a rien tape
      if (!/^\d{10}$/.test(value)) {
        return 'NIF : 10 chiffres requis (' + value.length + '/10)';
      }
      return null;
    }

    case 'stat': {
      if (!value) return null;
      if (!/^\d{17}$/.test(value)) {
        return 'STAT : 17 chiffres (' + value.length + '/17)';
      }
      return null;
    }

    case 'cinDirigeant': {
      if (!value) return null;
      if (!/^\d{12}$/.test(value)) {
        return 'CIN : 12 chiffres (' + value.length + '/12)';
      }
      const sixieme = value.charAt(5);
      if (sixieme !== '0' && sixieme !== '1') {
        return 'CIN : le 6eme chiffre doit etre 0 ou 1 (actuel : ' + sixieme + ')';
      }
      return null;
    }

    case 'telephone': {
      if (!value) return null;
      if (!/^\d{10}$/.test(value)) {
        return 'Telephone : 10 chiffres (' + value.length + '/10)';
      }
      const prefixe = value.slice(0, 3);
      if (!PREFIXES_TEL.includes(prefixe)) {
        return 'Doit commencer par 031, 032, 033, 034 ou 038';
      }
      return null;
    }

    case 'email': {
      if (!value) return null;
      if (!/^[\w.+-]+@[\w-]+\.[\w.-]+$/.test(value)) {
        return 'E-mail invalide';
      }
      return null;
    }

    case 'raisonSociale': {
      if (!value) return null;
      if (value.trim().length < 2) {
        return 'Raison sociale : 2 caracteres minimum';
      }
      return null;
    }

    case 'dateImmatriculation': {
      if (!value) return null;
      const d = new Date(value);
      if (d > new Date()) return 'Date dans le futur interdite';
      if (d.getFullYear() < 1900) return 'Date invalide (>= 1900)';
      return null;
    }

    case 'moisCloture': {
      const mc = Number(value);
      if (value === '' || value === null || value === undefined) return null;
      if (mc < 1 || mc > 12) return 'Mois : 1 a 12';
      return null;
    }

    default:
      return null;
  }
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
    setErrors({});
  }, [initial]);

  // Met a jour le champ + valide en temps reel
  const setField = (name, value) => {
    const next = { ...form, [name]: value };
    setForm(next);

    // Validation temps reel du champ modifie
    const msg = validerChamp(name, value, next);
    setErrors((prev) => ({ ...prev, [name]: msg }));

    // Cas particulier : le prefixe telephone doit etre valide des le 3e chiffre
    if (name === 'telephone' && value.length >= 3) {
      const prefixe = value.slice(0, 3);
      if (!PREFIXES_TEL.includes(prefixe)) {
        setErrors((prev) => ({ ...prev, telephone: 'Doit commencer par 031, 032, 033, 034 ou 038' }));
      }
    }

    // Cas CIN : valider le 6e chiffre des qu'il est tape
    if (name === 'cinDirigeant' && value.length >= 6) {
      const sixieme = value.charAt(5);
      if (sixieme !== '0' && sixieme !== '1') {
        setErrors((prev) => ({
          ...prev,
          cinDirigeant: 'CIN : le 6eme chiffre doit etre 0 ou 1 (actuel : ' + sixieme + ')',
        }));
      }
    }
  };

  // Bloque les touches non-numeriques
  const handleNumericKeyDown = (e) => {
    const touchesAutorisees = [
      'Backspace', 'Delete', 'Tab', 'Escape', 'Enter',
      'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'
    ];
    if (touchesAutorisees.includes(e.key)) return;
    if (e.ctrlKey || e.metaKey) return;
    if (!/^\d$/.test(e.key)) {
      e.preventDefault();
    }
  };

  // Validation complete (au submit)
  const validerTout = () => {
    const e = {};

    if (!/^\d{10}$/.test(form.nif || '')) {
      e.nif = 'NIF : 10 chiffres requis';
    }
    if (form.stat && !/^\d{17}$/.test(form.stat)) {
      e.stat = 'STAT : 17 chiffres si renseigne';
    }
    if (!/^\d{12}$/.test(form.cinDirigeant || '')) {
      e.cinDirigeant = 'CIN : 12 chiffres requis';
    } else {
      const s = form.cinDirigeant.charAt(5);
      if (s !== '0' && s !== '1') {
        e.cinDirigeant = 'CIN : le 6eme chiffre doit etre 0 ou 1';
      }
    }
    if (form.telephone) {
      if (!/^\d{10}$/.test(form.telephone)) {
        e.telephone = 'Telephone : 10 chiffres requis';
      } else if (!PREFIXES_TEL.includes(form.telephone.slice(0, 3))) {
        e.telephone = 'Doit commencer par 031, 032, 033, 034 ou 038';
      }
    }
    if (form.email && !/^[\w.+-]+@[\w-]+\.[\w.-]+$/.test(form.email)) {
      e.email = 'E-mail invalide';
    }
    if (!form.raisonSociale || form.raisonSociale.trim().length < 2) {
      e.raisonSociale = 'Raison sociale obligatoire (min 2 caracteres)';
    }
    if (!form.nomDirigeant || form.nomDirigeant.trim().length === 0) {
      e.nomDirigeant = 'Nom du dirigeant obligatoire';
    }
    if (!form.adresse || form.adresse.trim().length === 0) {
      e.adresse = 'Adresse obligatoire';
    }
    if (!form.idSecteur) {
      e.idSecteur = 'Secteur obligatoire';
    }
    if (!form.dateImmatriculation) {
      e.dateImmatriculation = 'Date obligatoire';
    } else {
      const d = new Date(form.dateImmatriculation);
      if (d > new Date()) e.dateImmatriculation = 'Date dans le futur interdite';
      if (d.getFullYear() < 1900) e.dateImmatriculation = 'Date invalide (>= 1900)';
    }
    const mc = Number(form.moisCloture);
    if (!mc || mc < 1 || mc > 12) {
      e.moisCloture = 'Mois de cloture : 1 a 12';
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!validerTout()) return;
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
    <form className="form-panel" onSubmit={handleSubmit} noValidate>
      {/* Identite fiscale */}
      <h3 className="section-title">Identite fiscale</h3>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">NIF * (10 chiffres)</label>
          <input
            type="text"
            inputMode="numeric"
            maxLength={10}
            className={'form-input ' + (errors.nif ? 'input-error' : '')}
            value={form.nif}
            onKeyDown={handleNumericKeyDown}
            onChange={(e) => setField('nif', onlyDigits(e.target.value, 10))}
          />
          {errors.nif && <span className="error-msg">{errors.nif}</span>}
        </div>
        <div className="form-group">
          <label className="form-label">STAT (17 chiffres, optionnel)</label>
          <input
            type="text"
            inputMode="numeric"
            maxLength={17}
            className={'form-input ' + (errors.stat ? 'input-error' : '')}
            value={form.stat}
            onKeyDown={handleNumericKeyDown}
            onChange={(e) => setField('stat', onlyDigits(e.target.value, 17))}
          />
          {errors.stat && <span className="error-msg">{errors.stat}</span>}
        </div>
      </div>

      {/* Identification */}
      <h3 className="section-title">Identification</h3>
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

      {/* Dirigeant */}
      <h3 className="section-title">Dirigeant</h3>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Nom du dirigeant *</label>
          <input
            className={'form-input ' + (errors.nomDirigeant ? 'input-error' : '')}
            value={form.nomDirigeant}
            onChange={(e) => setField('nomDirigeant', e.target.value)}
          />
          {errors.nomDirigeant && <span className="error-msg">{errors.nomDirigeant}</span>}
        </div>
        <div className="form-group">
          <label className="form-label">CIN du dirigeant * (12 chiffres, 6e = 0 ou 1)</label>
          <input
            type="text"
            inputMode="numeric"
            maxLength={12}
            className={'form-input ' + (errors.cinDirigeant ? 'input-error' : '')}
            value={form.cinDirigeant}
            onKeyDown={handleNumericKeyDown}
            onChange={(e) => setField('cinDirigeant', onlyDigits(e.target.value, 12))}
            placeholder="101230456789"
          />
          {errors.cinDirigeant && <span className="error-msg">{errors.cinDirigeant}</span>}
        </div>
      </div>

      {/* Coordonnees */}
      <h3 className="section-title">Coordonnees</h3>
      <div className="form-row">
        <div className="form-group" style={{ flex: 2 }}>
          <label className="form-label">Adresse *</label>
          <input
            className={'form-input ' + (errors.adresse ? 'input-error' : '')}
            value={form.adresse}
            onChange={(e) => setField('adresse', e.target.value)}
          />
          {errors.adresse && <span className="error-msg">{errors.adresse}</span>}
        </div>
        <div className="form-group">
          <label className="form-label">Telephone (031/032/033/034/038)</label>
          <input
            type="text"
            inputMode="numeric"
            maxLength={10}
            className={'form-input ' + (errors.telephone ? 'input-error' : '')}
            value={form.telephone}
            onKeyDown={handleNumericKeyDown}
            onChange={(e) => setField('telephone', onlyDigits(e.target.value, 10))}
            placeholder="0341234567"
          />
          {errors.telephone && <span className="error-msg">{errors.telephone}</span>}
        </div>
      </div>

      <div className="form-row">
        <div className="form-group" style={{ flex: 2 }}>
          <label className="form-label">E-mail</label>
          <input
            type="email"
            className={'form-input ' + (errors.email ? 'input-error' : '')}
            value={form.email}
            onChange={(e) => setField('email', e.target.value)}
          />
          {errors.email && <span className="error-msg">{errors.email}</span>}
        </div>
      </div>

      {/* Informations fiscales */}
      <h3 className="section-title">Informations fiscales</h3>
      <div className="form-row">
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
      </div>

      <div className="form-row">
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
          <label className="form-label">Mois de cloture (1-12)</label>
          <input
            type="number"
            min={1}
            max={12}
            className={'form-input ' + (errors.moisCloture ? 'input-error' : '')}
            value={form.moisCloture}
            onChange={(e) => setField('moisCloture', e.target.value)}
          />
          {errors.moisCloture && <span className="error-msg">{errors.moisCloture}</span>}
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
