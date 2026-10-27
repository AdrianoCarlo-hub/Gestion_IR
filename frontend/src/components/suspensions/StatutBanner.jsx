import { Alert } from 'antd';
import {
  CheckCircleOutlined,
  PauseCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';

const STATUTS = {
  ACTIF: { type: 'success', label: 'Actif', icone: <CheckCircleOutlined /> },
  VEILLEUSE: { type: 'warning', label: 'En veilleuse', icone: <PauseCircleOutlined /> },
  SUSPENDU: { type: 'warning', label: 'Suspendu', icone: <PauseCircleOutlined /> },
  CESSE: { type: 'error', label: 'Cesse', icone: <CloseCircleOutlined /> },
  RADIE: { type: 'error', label: 'Radie', icone: <CloseCircleOutlined /> },
};

/**
 * Bandeau du statut d'activite courant d'un contribuable.
 */
export default function StatutBanner({ statut = 'ACTIF', moisActifs = 12 }) {
  const info = STATUTS[statut] || STATUTS.ACTIF;

  return (
    <Alert
      banner
      type={info.type}
      icon={info.icone}
      message={
        <span>
          Statut d activite : <strong>{info.label}</strong>
        </span>
      }
      description={
        <span style={{ fontSize: 13 }}>
          <ClockCircleOutlined style={{ marginRight: 6 }} />
          {moisActifs} mois actifs
        </span>
      }
    />
  );
}
