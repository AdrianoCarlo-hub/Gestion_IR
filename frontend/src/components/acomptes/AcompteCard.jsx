import { Button, Card, Space, Tag, Typography } from 'antd';
import {
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  PauseCircleOutlined,
  PlayCircleOutlined,
} from '@ant-design/icons';
import { formatAr, formatDate, STATUT_ACOMPTE } from '../../utils/format';

const { Text } = Typography;

const LABELS = {
  A_PAYER: 'A payer',
  PAYE: 'Paye',
  EN_RETARD: 'En retard',
  SUSPENDU: 'Suspendu',
};

function ligneDetail(label, valeur, options = {}) {
  const { fort = false, couleur } = options;
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        gap: 12,
        fontSize: 13,
      }}
    >
      <Text type="secondary">{label}</Text>
      <Text strong={fort} style={couleur ? { color: couleur } : undefined}>
        {valeur}
      </Text>
    </div>
  );
}

/**
 * Carte d un acompte provisionnel (echeance 15 mai / 15 novembre) avec
 * badge de statut et action de suspension / reactivation / reglement.
 */
export default function AcompteCard({
  acompte,
  echeancesDetail,
  onSuspendre,
  onReactiver,
  onPayer,
}) {
  if (!acompte) return null;

  const statut = acompte.statut || 'A_PAYER';
  const info = STATUT_ACOMPTE[statut] || { couleur: 'default', libelle: statut };
  const libelle = LABELS[statut] || info.libelle;
  const anneeAcompte = acompte.annee;
  const numero = acompte.numero;

  return (
    <Card
      size="small"
      title={
        <Space size={10}>
          <CalendarOutlined style={{ color: '#0E7A55' }} />
          <span>
            <Text type="secondary" style={{ display: 'block', fontSize: 12 }}>
              Echeance {numero === 1 ? '1' : '2'}
            </Text>
            <Text strong>
              Acompte n° {numero || '-'} {anneeAcompte ? '- ' + anneeAcompte : ''}
            </Text>
          </span>
        </Space>
      }
      extra={<Tag color={info.couleur}>{libelle}</Tag>}
      styles={{ body: { display: 'flex', flexDirection: 'column', gap: 8 } }}
    >
      {ligneDetail(
        anneeAcompte ? 'Base IR ' + (anneeAcompte - 1) : 'Base IR N-1',
        formatAr(acompte.baseIrN1)
      )}
      {ligneDetail('Taux', acompte.tauxPct != null ? acompte.tauxPct + ' %' : '-')}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          gap: 12,
          background: '#f3f6f8',
          borderRadius: 8,
          padding: '8px 10px',
        }}
      >
        <Text type="secondary">Montant de l&apos;acompte</Text>
        <Text strong style={{ fontSize: 15 }}>
          {formatAr(acompte.montantAr)}
        </Text>
      </div>
      {ligneDetail(
        <span>
          <ClockCircleOutlined style={{ marginRight: 6 }} />
          Date limite
        </span>,
        formatDate(acompte.dateEcheance)
      )}
      {numero === 1 && echeancesDetail && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            gap: 12,
            borderTop: '1px solid #e6ecea',
            paddingTop: 8,
            fontSize: 13,
          }}
        >
          <Text type="secondary">
            Solde IR {anneeAcompte ? anneeAcompte - 1 : 'N-1'} + acompte 1 au 15 mai
          </Text>
          <Text strong>{formatAr(echeancesDetail.total)}</Text>
        </div>
      )}

      <Space wrap style={{ marginTop: 4 }}>
        {statut !== 'PAYE' && statut !== 'SUSPENDU' && (
          <Button
            icon={<PauseCircleOutlined />}
            onClick={() => onSuspendre && onSuspendre(acompte)}
          >
            Demander suspension
          </Button>
        )}
        {statut === 'SUSPENDU' && (
          <Button
            type="primary"
            ghost
            icon={<PlayCircleOutlined />}
            onClick={() => onReactiver && onReactiver(acompte)}
          >
            Reactiver
          </Button>
        )}
        {statut !== 'PAYE' && (
          <Button
            type="primary"
            icon={<CheckCircleOutlined />}
            onClick={() => onPayer && onPayer(acompte)}
          >
            Regler
          </Button>
        )}
      </Space>
    </Card>
  );
}
