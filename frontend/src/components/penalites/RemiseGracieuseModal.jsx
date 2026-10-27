import { useState } from 'react';
import { Alert, Form, Input, Modal } from 'antd';
import { GiftOutlined } from '@ant-design/icons';
import { formatAr } from '../../utils/format';

/**
 * Modal de demande de remise gracieuse d'une penalite.
 * Avertissement legal : la remise gracieuse est exceptionnelle et soumise a decision.
 */
export default function RemiseGracieuseModal({ ouvert, penalite, onFermer, onValider }) {
  const [motif, setMotif] = useState('');
  const [justificatif, setJustificatif] = useState('');

  const valider = () => {
    if (!motif.trim()) return;
    if (onValider) {
      onValider({ motif: motif.trim(), justificatif: justificatif.trim() });
    }
    setMotif('');
    setJustificatif('');
  };

  return (
    <Modal
      open={!!ouvert && !!penalite}
      title={
        <span
          style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
        >
          <GiftOutlined style={{ color: '#0E7A55' }} />
          Demande de remise gracieuse
        </span>
      }
      onCancel={onFermer}
      onOk={valider}
      okText="Envoyer la demande"
      cancelText="Annuler"
      okButtonProps={{ disabled: !motif.trim() }}
      centered
      width={520}
      destroyOnHidden
    >
      {penalite && (
        <>
          <Alert
            type="warning"
            showIcon
            style={{ marginBottom: 16 }}
            message="Remise exceptionnelle"
            description={
              <span>
                La remise gracieuse est exceptionnelle et soumise a la decision du
                responsable. Elle ne suspend pas l&apos;exigibilite de la penalite (
                {formatAr(penalite.montantAr)}).
              </span>
            }
          />
          <Form layout="vertical">
            <Form.Item label="Motif de la demande" required>
              <Input.TextArea
                rows={3}
                value={motif}
                onChange={(e) => setMotif(e.target.value)}
                placeholder="Ex : difficulte financiere temporaire..."
              />
            </Form.Item>
            <Form.Item label="Justificatif (reference)">
              <Input
                value={justificatif}
                onChange={(e) => setJustificatif(e.target.value)}
                placeholder="Reference du document joint"
              />
            </Form.Item>
          </Form>
        </>
      )}
    </Modal>
  );
}
