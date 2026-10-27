import { useMemo, useState } from 'react';
import { Form, Input, InputNumber, Modal, Typography } from 'antd';
import { ContainerOutlined } from '@ant-design/icons';
import { formatAr } from '../../utils/format';

const { Text } = Typography;

const today = new Date().toISOString().slice(0, 10);

/**
 * Modal de saisie d une quittance de douane (retenue AIRS).
 * Le montant est calcule automatiquement : valeur CAF x taux (2 % par defaut).
 */
export default function AcompteDouaneModal({ ouvert, taux = 2, onFermer, onValider, enCours }) {
  const [ref, setRef] = useState('');
  const [caf, setCaf] = useState(null);
  const [date, setDate] = useState(today);

  const montant = useMemo(() => {
    const v = Number(caf);
    if (!v || v <= 0) return 0;
    return Math.round(v * (taux / 100));
  }, [caf, taux]);

  const valide = ref.trim().length > 0 && Number(caf) > 0;

  const valider = () => {
    if (!valide) return;
    if (onValider) {
      onValider({
        referenceDouane: ref.trim(),
        valeurCaf: Number(caf),
        date,
      });
    }
    setRef('');
    setCaf(null);
    setDate(today);
  };

  return (
    <Modal
      open={ouvert}
      title={
        <span>
          <ContainerOutlined style={{ color: '#0E7A55', marginRight: 8 }} />
          Quittance de douane
        </span>
      }
      okText={enCours ? 'Enregistrement...' : 'Enregistrer la quittance'}
      cancelText="Annuler"
      confirmLoading={!!enCours}
      okButtonProps={{ disabled: !valide }}
      onOk={valider}
      onCancel={onFermer}
      destroyOnHidden
      centered
      width={520}
    >
      <Text type="secondary" style={{ display: 'block', marginBottom: 16, fontSize: 12 }}>
        Retenue AIRS - {taux} % - le montant est calcule automatiquement a partir de la valeur CAF.
      </Text>

      <Form layout="vertical">
        <Form.Item label="Date de la quittance" required>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </Form.Item>
        <Form.Item label="Reference douane" required>
          <Input
            value={ref}
            placeholder="N quittance AIRS"
            allowClear
            onChange={(e) => setRef(e.target.value)}
          />
        </Form.Item>
        <Form.Item label="Valeur CAF (Ar)" required>
          <InputNumber
            style={{ width: '100%' }}
            value={caf}
            placeholder="Ex : 50000000"
            min={1}
            step={1}
            onChange={(v) => setCaf(v)}
          />
        </Form.Item>
      </Form>

      <div
        style={{
          background: '#f3f6f8',
          borderRadius: 8,
          padding: '12px 14px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <div>
          <Text strong>Retenue AIRS ({taux} %)</Text>
          <div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Montant calcule automatiquement
            </Text>
          </div>
        </div>
        <Text strong style={{ fontSize: 16 }}>
          {formatAr(montant)}
        </Text>
      </div>
    </Modal>
  );
}
