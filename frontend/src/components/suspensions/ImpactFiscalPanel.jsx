import { Card, Row, Col, Statistic, Empty } from 'antd';
import { FallOutlined, PauseCircleOutlined, WalletOutlined } from '@ant-design/icons';
import { formatAr } from '../../utils/format';

/**
 * Panneau de simulation de l'impact fiscal d'un arret (mise en veilleuse).
 */
export default function ImpactFiscalPanel({ impact }) {
  if (!impact) {
    return (
      <Card>
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="Choisissez une date d arret pour simuler l impact fiscal"
        />
      </Card>
    );
  }

  return (
    <Card title="Simulation de l impact fiscal">
      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <Statistic
            title={`Minimum au prorata (${impact.moisActifs} mois)`}
            value={formatAr(impact.minimumProrata)}
            prefix={<FallOutlined style={{ color: '#DC2626' }} />}
          />
        </Col>
        <Col xs={24} md={8}>
          <Statistic
            title="Acomptes a suspendre"
            value={formatAr(impact.acompteSuspendu)}
            prefix={<PauseCircleOutlined style={{ color: '#F59E0B' }} />}
          />
        </Col>
        <Col xs={24} md={8}>
          <Statistic
            title="Credit d impot reportable"
            value={formatAr(impact.creditImpot)}
            prefix={<WalletOutlined style={{ color: '#0E7A55' }} />}
            valueStyle={impact.creditImpot > 0 ? { color: '#0E7A55' } : undefined}
          />
        </Col>
      </Row>
    </Card>
  );
}
