import { useState } from 'react';
import { Card, Form, Row, Col, Input, Select, Radio, Button } from 'antd';
import {
  PauseCircleOutlined,
  PlayCircleOutlined,
  StopOutlined,
  SendOutlined,
} from '@ant-design/icons';

const today = new Date().toISOString().slice(0, 10);

const MOTIFS = [
  { value: 'MANQUE_ACTIVITE', label: "Manque d activite" },
  { value: 'TRAVAUX', label: 'Travaux' },
  { value: 'SAISON', label: 'Saison' },
  { value: 'DIFFICULTE_FINANCIERE', label: 'Difficulte financiere' },
  { value: 'REORGANISATION', label: 'Reorganisation' },
  { value: 'AUTRE', label: 'Autre' },
];

const TYPES = [
  {
    value: 'VEILLEUSE',
    label: (
      <span>
        <PauseCircleOutlined style={{ marginRight: 6 }} />
        Mise en veilleuse
      </span>
    ),
  },
  {
    value: 'CESSATION',
    label: (
      <span>
        <StopOutlined style={{ marginRight: 6 }} />
        Cessation definitive
      </span>
    ),
  },
  {
    value: 'REPRISE',
    label: (
      <span>
        <PlayCircleOutlined style={{ marginRight: 6 }} />
        Reprise d activite
      </span>
    ),
  },
];

/**
 * Formulaire de declaration d'arret / reprise d'activite.
 * 3 modes : VEILLEUSE (arret temporaire), CESSATION (definitive), REPRISE.
 */
export default function DeclarationForm({ onSoumettre, enCours, enCoursId }) {
  const [type, setType] = useState('VEILLEUSE');
  const [date, setDate] = useState(today);
  const [motif, setMotif] = useState('MANQUE_ACTIVITE');
  const [refDeclaration, setRefDeclaration] = useState('');
  const [justificatif, setJustificatif] = useState('');

  const soumettre = () => {
    if (type === 'REPRISE') {
      if (!enCoursId) return;
      onSoumettre('REPRISE', { dateReprise: date });
      return;
    }
    if (type === 'VEILLEUSE') {
      onSoumettre('VEILLEUSE', {
        dateArret: date,
        motif,
        refDeclaration: refDeclaration || null,
      });
    } else {
      onSoumettre('CESSATION', {
        dateArret: date,
        motif,
        justificatif: justificatif || null,
      });
    }
  };

  return (
    <Card title="Declaration d evenement" style={{ marginBottom: 16 }}>
      <Form layout="vertical" onFinish={soumettre}>
        <Form.Item label="Type d evenement">
          <Radio.Group
            optionType="button"
            buttonStyle="solid"
            value={type}
            onChange={(e) => setType(e.target.value)}
            options={TYPES.map((t) => ({
              ...t,
              disabled: t.value === 'REPRISE' ? !enCours : !!enCours,
            }))}
          />
        </Form.Item>

        <Row gutter={16}>
          <Col xs={24} md={8}>
            <Form.Item
              label={type === 'REPRISE' ? 'Date de reprise' : 'Date d arret'}
              required
            >
              <Input
                type="date"
                value={date}
                max={today}
                onChange={(e) => setDate(e.target.value)}
              />
            </Form.Item>
          </Col>

          {type === 'VEILLEUSE' && (
            <>
              <Col xs={24} md={8}>
                <Form.Item label="Motif" required>
                  <Select value={motif} onChange={setMotif} options={MOTIFS} />
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item label="N° declaration ecrite">
                  <Input
                    value={refDeclaration}
                    onChange={(e) => setRefDeclaration(e.target.value)}
                  />
                </Form.Item>
              </Col>
            </>
          )}

          {type === 'CESSATION' && (
            <>
              <Col xs={24} md={8}>
                <Form.Item label="Motif">
                  <Select value={motif} onChange={setMotif} options={MOTIFS} />
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item label="Justificatif (bilan de cloture)">
                  <Input
                    value={justificatif}
                    onChange={(e) => setJustificatif(e.target.value)}
                  />
                </Form.Item>
              </Col>
            </>
          )}
        </Row>

        <Button
          type="primary"
          htmlType="submit"
          icon={<SendOutlined />}
          disabled={type === 'REPRISE' && !enCoursId}
        >
          Soumettre la declaration
        </Button>
      </Form>
    </Card>
  );
}
