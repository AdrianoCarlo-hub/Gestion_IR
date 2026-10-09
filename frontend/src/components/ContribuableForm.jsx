import { useEffect, useState } from 'react';
import { listerSecteurs } from '../services/secteurService';
import { LuUser, LuHash, LuBuilding2, LuUsers, LuMail, LuPhone, LuMapPin, LuCalendar, LuBriefcase, LuCircleAlert, LuCheck, LuX, LuType, LuIdCard, LuLoader } from "react-icons/lu";

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

const FORMES_JURIDIQUES = [
  { value: 'EI', label: 'Entreprise Individuelle' },
  { value: 'SARL', label: 'SARL' },
  { value: 'SA', label: 'SA' },
  { value: 'SOCIETE_PERSONNES', label: 'Societe de personnes' },
  { value: 'ASSOCIATION', label: 'Association' },
  { value: 'COOPERATIVE', label: 'Cooperative' },
];

const REGIMES = [
  { value: 'REEL_OBLIGATOIRE', label: 'Reel obligatoire' },
  { value: 'REEL_OPTION', label: 'Reel sur option' },
];

const MOIS = Array.from({ length: 12 }, (_, i) => ({
  value: i + 1,
  label: ['Janvier', 'Fevrier', 'Mars', 'Avril', 'Mai', 'Juin', 
          'Juillet', 'Aout', 'Septembre', 'Octobre', 'Novembre', 'Decembre'][i]
}));

export default function ContribuableForm({ initial, onSubmit, onCancel }) {
  const [form, setForm] = useState(initial || vide);
  const [secteurs, setSecteurs] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState({});

  useEffect(() => {
    listerSecteurs().then(setSecteurs);
  }, []);

  useEffect(() => {
    setForm(initial || vide);
  }, [initial]);

  const setField = (name, value) => {
    setForm((f) => ({ ...f, [name]: value }));
    setErrors((e) => ({ ...e, [name]: null }));
    setTouched((t) => ({ ...t, [name]: true }));
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

  // Fonction pour afficher l'icône de statut du champ
  const getFieldIcon = (field) => {
    switch (field) {
      case 'nif': return Hash;
      case 'stat': return IdCard;
      case 'raisonSociale': return LuBuilding2;
      case 'formeJuridique': return Type;
      case 'nomDirigeant': return LuUser;
      case 'cinDirigeant': return IdCard;
      case 'adresse': return MapPin;
      case 'telephone': return Phone;
      case 'email': return LuMail;
      case 'idSecteur': return LuBriefcase;
      case 'regime': return LuBriefcase;
      case 'dateImmatriculation': return LuCalendar;
      case 'moisCloture': return LuCalendar;
      default: return LuUser;
    }
  };

  // Afficher l'icône d'erreur ou de succès
  const getFieldStatusIcon = (field) => {
    if (errors[field]) {
      return <LuCircleAlert className="icon" style={{ width: 14, height: 14, color: 'var(--danger)' }} />;
    }
    if (touched[field] && !errors[field]) {
      return <LuCheck className="icon" style={{ width: 14, height: 14, color: 'var(--success)' }} />;
    }
    return null;
  };

  return (
    <form className="form-panel" onSubmit={handleSubmit}>
      {/* Section 1: Identite fiscale */}
      <h3 className="section-title">
        <Hash className="section-icon" />
        Identite fiscale
      </h3>
      
      <div className="form-row">
        <div className="form-group">
          <label className="form-label required">NIF *</label>
          <div className="form-input-wrapper">
            <input
              className={`form-input form-input-with-icon ${errors.nif ? 'input-error' : ''}`}
              value={form.nif}
              maxLength={10}
              onChange={(e) => setField('nif', e.target.value.replace(/\D/g, ''))}
              placeholder="10 chiffres"
            />
            {getFieldStatusIcon('nif')}
          </div>
          {errors.nif && <span className="error-msg"><LuCircleAlert className="icon" style={{ width: 12, height: 12 }} />{errors.nif}</span>}
        </div>
        <div className="form-group">
          <label className="form-label">STAT</label>
          <div className="form-input-wrapper">
            <input
              className={`form-input form-input-with-icon ${errors.stat ? 'input-error' : ''}`}
              value={form.stat}
              maxLength={17}
              onChange={(e) => setField('stat', e.target.value.replace(/\D/g, ''))}
              placeholder="17 chiffres"
            />
            {getFieldStatusIcon('stat')}
          </div>
          {errors.stat && <span className="error-msg"><LuCircleAlert className="icon" style={{ width: 12, height: 12 }} />{errors.stat}</span>}
        </div>
      </div>

      {/* Section 2: Identification */}
      <h3 className="section-title" style={{ marginTop: 24 }}>
        <LuBuilding2 className="section-icon" />
        Identification
      </h3>
      
      <div className="form-row">
        <div className="form-group" style={{ flex: 2 }}>
          <label className="form-label required">Raison sociale *</label>
          <div className="form-input-wrapper">
            <input
              className={`form-input form-input-with-icon ${errors.raisonSociale ? 'input-error' : ''}`}
              value={form.raisonSociale}
              onChange={(e) => setField('raisonSociale', e.target.value)}
              placeholder="Nom de l'entreprise"
            />
            {getFieldStatusIcon('raisonSociale')}
          </div>
          {errors.raisonSociale && <span className="error-msg"><LuCircleAlert className="icon" style={{ width: 12, height: 12 }} />{errors.raisonSociale}</span>}
        </div>
        <div className="form-group">
          <label className="form-label required">Forme juridique *</label>
          <div className="form-input-wrapper">
            <Type className="form-input-icon" />
            <select
              className={`form-input form-input-with-icon ${errors.formeJuridique ? 'input-error' : ''}`}
              value={form.formeJuridique}
              onChange={(e) => setField('formeJuridique', e.target.value)}
            >
              {FORMES_JURIDIQUES.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Section 3: Dirigeant */}
      <h3 className="section-title" style={{ marginTop: 24 }}>
        <LuUser className="section-icon" />
        Dirigeant
      </h3>
      
      <div className="form-row">
        <div className="form-group">
          <label className="form-label required">Nom du dirigeant *</label>
          <div className="form-input-wrapper">
            <LuUser className="form-input-icon" />
            <input
              className="form-input form-input-with-icon"
              value={form.nomDirigeant}
              onChange={(e) => setField('nomDirigeant', e.target.value)}
              placeholder="Nom et prenom"
            />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label required">CIN du dirigeant *</label>
          <div className="form-input-wrapper">
            <IdCard className="form-input-icon" />
            <input
              className={`form-input form-input-with-icon ${errors.cinDirigeant ? 'input-error' : ''}`}
              value={form.cinDirigeant}
              maxLength={12}
              onChange={(e) => setField('cinDirigeant', e.target.value.replace(/\D/g, ''))}
              placeholder="12 chiffres"
            />
            {getFieldStatusIcon('cinDirigeant')}
          </div>
          {errors.cinDirigeant && <span className="error-msg"><LuCircleAlert className="icon" style={{ width: 12, height: 12 }} />{errors.cinDirigeant}</span>}
        </div>
      </div>

      {/* Section 4: Coordonnées */}
      <h3 className="section-title" style={{ marginTop: 24 }}>
        <MapPin className="section-icon" />
        Coordonnées
      </h3>
      
      <div className="form-row">
        <div className="form-group" style={{ flex: 2 }}>
          <label className="form-label required">Adresse *</label>
          <div className="form-input-wrapper">
            <MapPin className="form-input-icon" />
            <input
              className="form-input form-input-with-icon"
              value={form.adresse}
              onChange={(e) => setField('adresse', e.target.value)}
              placeholder="Adresse complete"
            />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Telephone</label>
          <div className="form-input-wrapper">
            <Phone className="form-input-icon" />
            <input
              className={`form-input form-input-with-icon ${errors.telephone ? 'input-error' : ''}`}
              value={form.telephone}
              maxLength={10}
              onChange={(e) => setField('telephone', e.target.value.replace(/\D/g, ''))}
              placeholder="10 chiffres"
            />
            {getFieldStatusIcon('telephone')}
          </div>
          {errors.telephone && <span className="error-msg"><LuCircleAlert className="icon" style={{ width: 12, height: 12 }} />{errors.telephone}</span>}
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">E-mail</label>
          <div className="form-input-wrapper">
            <LuMail className="form-input-icon" />
            <input
              className={`form-input form-input-with-icon ${errors.email ? 'input-error' : ''}`}
              type="email"
              value={form.email}
              onChange={(e) => setField('email', e.target.value)}
              placeholder="email@domaine.com"
            />
            {getFieldStatusIcon('email')}
          </div>
          {errors.email && <span className="error-msg"><LuCircleAlert className="icon" style={{ width: 12, height: 12 }} />{errors.email}</span>}
        </div>
        <div className="form-group">
          <label className="form-label required">Secteur d'activite *</label>
          <div className="form-input-wrapper">
            <LuBriefcase className="form-input-icon" />
            <select
              className={`form-input form-input-with-icon ${errors.idSecteur ? 'input-error' : ''}`}
              value={form.idSecteur}
              onChange={(e) => setField('idSecteur', e.target.value)}
            >
              <option value="">-- Choisir un secteur --</option>
              {secteurs.map((s) => (
                <option key={s.idSecteur} value={s.idSecteur}>{s.libelle}</option>
              ))}
            </select>
            {getFieldStatusIcon('idSecteur')}
          </div>
          {errors.idSecteur && <span className="error-msg"><LuCircleAlert className="icon" style={{ width: 12, height: 12 }} />{errors.idSecteur}</span>}
        </div>
      </div>

      {/* Section 5: Informations fiscales */}
      <h3 className="section-title" style={{ marginTop: 24 }}>
        <LuBriefcase className="section-icon" />
        Informations fiscales
      </h3>
      
      <div className="form-row">
        <div className="form-group">
          <label className="form-label required">Regime *</label>
          <div className="form-input-wrapper">
            <LuBriefcase className="form-input-icon" />
            <select
              className="form-input form-input-with-icon"
              value={form.regime}
              onChange={(e) => setField('regime', e.target.value)}
            >
              {REGIMES.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="form-group">
          <label className="form-label required">Date immatriculation *</label>
          <div className="form-input-wrapper">
            <LuCalendar className="form-input-icon" />
            <input
              type="date"
              className={`form-input form-input-with-icon ${errors.dateImmatriculation ? 'input-error' : ''}`}
              value={form.dateImmatriculation}
              onChange={(e) => setField('dateImmatriculation', e.target.value)}
            />
            {getFieldStatusIcon('dateImmatriculation')}
          </div>
          {errors.dateImmatriculation && (
            <span className="error-msg"><LuCircleAlert className="icon" style={{ width: 12, height: 12 }} />{errors.dateImmatriculation}</span>
          )}
        </div>
        <div className="form-group">
          <label className="form-label">Mois cloture</label>
          <div className="form-input-wrapper">
            <LuCalendar className="form-input-icon" />
            <select
              className="form-input form-input-with-icon"
              value={form.moisCloture}
              onChange={(e) => setField('moisCloture', e.target.value)}
            >
              {MOIS.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Actions du formulaire */}
      <div className="form-actions">
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? (
            <>
              <LuLoader className="icon" style={{ width: 16, height: 16, animation: 'spin 0.8s linear infinite' }} />
              Enregistrement...
            </>
          ) : (
            <>
              <LuSave className="icon" />
              Enregistrer
            </>
          )}
        </button>
        <button type="button" className="btn btn-secondary" onClick={onCancel}>
          <LuX className="icon" />
          Annuler
        </button>
      </div>
    </form>
  );
}
