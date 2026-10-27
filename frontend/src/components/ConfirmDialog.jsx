import { Modal } from 'antd';
import { ExclamationCircleFilled, QuestionCircleFilled } from '@ant-design/icons';

/**
 * Dialogue de confirmation (API conservee) :
 * ouvert, titre, message, texteConfirmer, texteAnnuler, danger, onConfirmer, onAnnuler
 */
export default function ConfirmDialog({
  ouvert,
  titre = 'Confirmation',
  message,
  texteConfirmer = 'Confirmer',
  texteAnnuler = 'Annuler',
  danger = false,
  onConfirmer,
  onAnnuler,
}) {
  return (
    <Modal
      open={ouvert}
      title={
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          {danger ? (
            <ExclamationCircleFilled style={{ color: '#DC2626' }} />
          ) : (
            <QuestionCircleFilled style={{ color: '#0E7A55' }} />
          )}
          {titre}
        </span>
      }
      okText={texteConfirmer}
      cancelText={texteAnnuler}
      okButtonProps={{ danger }}
      onOk={onConfirmer}
      onCancel={onAnnuler}
      centered
      width={440}
      destroyOnHidden
    >
      <p style={{ fontSize: 14, color: '#3c5350', marginBottom: 4 }}>{message}</p>
    </Modal>
  );
}
