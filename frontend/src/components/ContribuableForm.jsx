import { useEffect, useState } from 'react';
import {
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  InputNumber,
  Button,
  Row,
  Col,
  Alert,
} from 'antd';
import dayjs from 'dayjs';
import { listerSecteurs } from '../services/secteurService';

// Prefixes telephone Madagascar autorises
const PREFIXES_TEL = ['031', '032', '033', '034', '038'];

const REGIME_FIXE = 'REEL_OBLIGATOIRE';

const FORMES_JURIDIQUES = [
  { value: 'EI', label: 'EI' },
  { value: 'SARL', label: 'SARL' },
  { value: 'SA', label: 'SA' },
  { value: 'SOCIETE_PERSONNES', label: 'Societe de personnes' },
  { value: 'ASSOCIATION', label: 'Association' },
  { value: 'COOPERATIVE', label: 'Cooperative' },
];

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
  regime: REGIME_FIXE,
  dateImmatriculation: '',
  moisCloture: 12,
};

// Retire tout caractere non-numerique
const onlyDigits = (str, maxLen) => {
  const digits = (str || '').replace(/\D/g, '');
  return maxLen ? digits.slice(0, maxLen) : digits;
};

// Bloque les touches non-numeriques
const handleNumericKeyDown = (e) => {
  const touchesAutorisees = [
    'Backspace', 'Delete', 'Tab', 'Escape', 'Enter',
    'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End',
  ];
  if (touchesAutorisees.includes(e.key)) return;
  if (e.ctrlKey || e.metaKey) return;
  if (!/^\d$/.test(e.key)) {
    e.preventDefault();
  }
};

// Regle de validation NIF : 10 chiffres
const ruleNif = {
  validator: (_, value) => {
    if (!value) return Promise.resolve();
    if (!/^\d{10}$/.test(value)) {
      return Promise.reject(new Error('NIF : 10 chiffres requis (' + value.length + '/10)'));
    }
    return Promise.resolve();
  },
};

// Regle de validation STAT : 17 chiffres si renseigne
const ruleStat = {
  validator: (_, value) => {
    if (!value) return Promise.resolve();
    if (!/^\d{17}$/.test(value)) {
      return Promise.reject(new Error('STAT : 17 chiffres (' + value.length + '/17)'));
    }
    return Promise.resolve();
  },
};

// Regle de validation CIN : 12 chiffres, 6eme = 0 ou 1
const ruleCin = {
  validator: (_, value) => {
    if (!value) return Promise.resolve();
    const s = String(value);
    const sixieme = s.charAt(5);
    if (s.length >= 6 && sixieme !== '0' && sixieme !== '1') {
      return Promise.reject(
        new Error('CIN : le 6eme chiffre doit etre 0 ou 1 (actuel : ' + sixieme + ')')
      );
    }
    if (!/^\d{12}$/.test(s)) {
      return Promise.reject(new Error('CIN : 12 chiffres (' + s.length + '/12)'));
    }
    return Promise.resolve();
  },
};

// Regle de validation telephone : 10 chiffres + prefixe autorise
const ruleTelephone = {
  validator: (_, value) => {
    if (!value) return Promise.resolve();
    if (!/^\d{10}$/.test(value)) {
      return Promise.reject(new Error('Telephone : 10 chiffres (' + value.length + '/10)'));
    }
    if (!PREFIXES_TEL.includes(value.slice(0, 3))) {
      return Promise.reject(new Error('Doit commencer par 031, 032, 033, 034 ou 038'));
    }
    return Promise.resolve();
  },
};

// Regle de validation email
const ruleEmail = {
  validator: (_, value) => {
    if (!value) return Promise.resolve();
    if (!/^[\w.+-]+@[\w-]+\.[\w.-]+$/.test(value)) {
      return Promise.reject(new Error('E-mail invalide'));
    }
    return Promise.resolve();
  },
};

/**
 * Formulaire de contribuable (Ant Design v6).
 * Props conservees : initial, onSubmit, onCancel.
 * Le composant est monte par la page lorsqu'il doit etre affiche.
 */
export default function ContribuableForm({ initial, onSubmit, onCancel }) {
  const [form] = Form.useForm();
  const [secteurs, setSecteurs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    listerSecteurs().then(setSecteurs);
  }, []);

  useEffect(() => {
    setFormError('');
    const base = initial || vide;
    form.setFieldsValue({
      ...base,
      idSecteur:
        base.idSecteur !== '' && base.idSecteur !== null && base.idSecteur !== undefined
          ? Number(base.idSecteur)
          : undefined,
      regime: REGIME_FIXE,
      moisCloture: Number(base.moisCloture ?? 12),
      dateImmatriculation: base.dateImmatriculation
        ? dayjs(base.dateImmatriculation)
        : null,
    });
  }, [form, initial]);

  const handleFinish = async (values) => {
    setFormError('');
    setLoading(true);
    try {
      await onSubmit({
        ...values,
        dateImmatriculation: values.dateImmatriculation
          ? values.dateImmatriculation.format('YYYY-MM-DD')
          : '',
        idSecteur: Number(values.idSecteur),
        moisCloture: Number(values.moisCloture),
        regime: REGIME_FIXE,
        secteur: { idSecteur: Number(values.idSecteur) },
      });
    } catch (e) {
      const msg =
        e?.response?.data?.message ||
        e?.message ||
        "Erreur lors de l'enregistrement";
      setFormError(msg);
      if (msg.toLowerCase().includes('nif')) {
        form.setFields([
          {
            name: 'nif',
            errors: [msg],
          },
        ]);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open
      title={initial ? 'Modifier un contribuable' : 'Nouveau contribuable'}
      onCancel={onCancel}
      centered
      width={880}
      destroyOnHidden
      footer={null}
    >
      {formError && (
        <Alert
          type="error"
          showIcon
          message={formError}
          style={{ marginBottom: 16 }}
          closable
          onClose={() => setFormError('')}
        />
      )}
      <Form form={form} layout="vertical" onFinish={handleFinish} autoComplete="off">
        <h3 className="section-title">Identite fiscale</h3>
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item
              name="nif"
              label="NIF * (10 chiffres)"
              normalize={(v) => onlyDigits(v, 10)}
              rules={[{ required: true, message: 'NIF : 10 chiffres requis' }, ruleNif]}
            >
              <Input maxLength={10} inputMode="numeric" onKeyDown={handleNumericKeyDown} />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              name="stat"
              label="STAT (17 chiffres, optionnel)"
              normalize={(v) => onlyDigits(v, 17)}
              rules={[ruleStat]}
            >
              <Input maxLength={17} inputMode="numeric" onKeyDown={handleNumericKeyDown} />
            </Form.Item>
          </Col>
        </Row>

        <h3 className="section-title">Identification</h3>
        <Row gutter={16}>
          <Col xs={24} md={16}>
            <Form.Item
              name="raisonSociale"
              label="Raison sociale *"
              rules={[
                { required: true, message: 'Raison sociale obligatoire (min 2 caracteres)' },
                { min: 2, message: 'Raison sociale : 2 caracteres minimum' },
              ]}
            >
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item name="formeJuridique" label="Forme juridique *">
              <Select options={FORMES_JURIDIQUES} />
            </Form.Item>
          </Col>
        </Row>

        <h3 className="section-title">Dirigeant</h3>
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item
              name="nomDirigeant"
              label="Nom du dirigeant *"
              normalize={(v) => (v || '').replace(/[^A-Za-zÀ-ÖØ-öø-ÿ\s'-]/g, '')}
              rules={[
                { required: true, message: 'Nom du dirigeant obligatoire' },
                {
                  pattern: /^[A-Za-zÀ-ÖØ-öø-ÿ\s'-]+$/,
                  message: 'Uniquement des lettres, espaces, tirets ou apostrophes',
                },
                {
                  validator: (_, value) => {
                    if (!value || !value.trim()) {
                      return Promise.reject(new Error('Nom du dirigeant obligatoire'));
                    }
                    if (value.trim().length < 2) {
                      return Promise.reject(new Error('Nom du dirigeant : 2 caracteres minimum'));
                    }
                    return Promise.resolve();
                  },
                },
              ]}
            >
              <Input placeholder="Ex: RAKOTO Jean" />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              name="cinDirigeant"
              label="CIN du dirigeant * (12 chiffres, 6e = 0 ou 1)"
              normalize={(v) => onlyDigits(v, 12)}
              rules={[{ required: true, message: 'CIN : 12 chiffres requis' }, ruleCin]}
            >
              <Input maxLength={12} inputMode="numeric" onKeyDown={handleNumericKeyDown} placeholder="101230456789" />
            </Form.Item>
          </Col>
        </Row>

        <h3 className="section-title">Coordonnees</h3>
        <Row gutter={16}>
          <Col xs={24} md={16}>
            <Form.Item
              name="adresse"
              label="Adresse *"
              rules={[{ required: true, message: 'Adresse obligatoire' }]}
            >
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item name="telephone" label="Telephone (031/032/033/034/038)" rules={[ruleTelephone]}>
              <Input maxLength={10} inputMode="numeric" onKeyDown={handleNumericKeyDown} placeholder="0341234567" />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col xs={24} md={16}>
            <Form.Item name="email" label="E-mail" rules={[ruleEmail]}>
              <Input type="email" />
            </Form.Item>
          </Col>
        </Row>

        <h3 className="section-title">Informations fiscales</h3>
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item
              name="idSecteur"
              label="Secteur d'activite *"
              rules={[{ required: true, message: 'Secteur obligatoire' }]}
            >
              <Select
                placeholder="-- Choisir --"
                options={secteurs.map((s) => ({ value: s.idSecteur, label: s.libelle }))}
              />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="regime" label="Regime *">
              <Select
                disabled
                options={[{ value: REGIME_FIXE, label: 'Reel obligatoire' }]}
              />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item
              name="dateImmatriculation"
              label="Date immatriculation *"
              rules={[
                { required: true, message: 'Date obligatoire' },
                {
                  validator: (_, value) => {
                    if (!value) return Promise.resolve();
                    if (value.isAfter(dayjs(), 'day')) {
                      return Promise.reject(new Error('Date dans le futur interdite'));
                    }
                    if (value.year() < 1900) {
                      return Promise.reject(new Error('Date invalide (>= 1900)'));
                    }
                    return Promise.resolve();
                  },
                },
              ]}
            >
              <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              name="moisCloture"
              label="Mois de cloture (1-12)"
              rules={[
                { required: true, message: 'Mois de cloture : 1 a 12' },
                {
                  validator: (_, value) => {
                    const mc = Number(value);
                    if (value === '' || value === null || value === undefined) {
                      return Promise.resolve();
                    }
                    if (mc < 1 || mc > 12) {
                      return Promise.reject(new Error('Mois : 1 a 12'));
                    }
                    return Promise.resolve();
                  },
                },
              ]}
            >
              <InputNumber min={1} max={12} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
        </Row>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8 }}>
          <Button type="primary" htmlType="submit" loading={loading}>
            Enregistrer
          </Button>
          <Button onClick={onCancel}>Annuler</Button>
        </div>
      </Form>
    </Modal>
  );
}
