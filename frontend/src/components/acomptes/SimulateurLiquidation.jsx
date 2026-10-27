import { useMemo, useState } from 'react';
import { Col, Form, InputNumber, Row, Typography } from 'antd';
import { formatAr } from '../../utils/format';

const { Text, Title } = Typography;

/**
 * Simulateur de liquidation de l IR.
 * Estimation : base = CA - charges ; IR = base x taux (20 % par defaut), puis
 * comparaison avec le cumul des acomptes deja verses.
 */
export default function SimulateurLiquidation({ cumulAcomptes = 0, tauxDefaut = 20 }) {
  const [ca, setCa] = useState(null);
  const [charges, setCharges] = useState(null);
  const [taux, setTaux] = useState(tauxDefaut);

  const resultat = useMemo(() => {
    const caNum = Number(ca) || 0;
    const chNum = Number(charges) || 0;
    const base = caNum - chNum;
    const baseArrondie = base > 0 ? Math.floor(base / 1000) * 1000 : 0;
    const ir = Math.round(baseArrondie * (Number(taux) / 100));
    const reste = ir - cumulAcomptes;
    return { baseArrondie, ir, reste };
  }, [ca, charges, taux, cumulAcomptes]);

  const resultats = [
    { label: 'Base imposable estimee', valeur: formatAr(resultat.baseArrondie) },
    { label: 'IR estime', valeur: formatAr(resultat.ir) },
    { label: 'Cumul acomptes verses', valeur: formatAr(cumulAcomptes) },
    {
      label: resultat.reste >= 0 ? 'Reste a payer' : 'Credit d impot',
      valeur: formatAr(Math.abs(resultat.reste)),
      couleur: resultat.reste > 0 ? '#DC2626' : '#0E7A55',
    },
  ];

  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} md={12}>
        <Form layout="vertical">
          <Row gutter={[12, 0]}>
            <Col xs={24} sm={8}>
              <Form.Item label="CA previsionnel (Ar)">
                <InputNumber
                  style={{ width: '100%' }}
                  value={ca}
                  min={0}
                  placeholder="0"
                  onChange={setCa}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item label="Charges deduites (Ar)">
                <InputNumber
                  style={{ width: '100%' }}
                  value={charges}
                  min={0}
                  placeholder="0"
                  onChange={setCharges}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item label="Taux (%)">
                <InputNumber
                  style={{ width: '100%' }}
                  value={taux}
                  min={0}
                  max={100}
                  onChange={setTaux}
                />
              </Form.Item>
            </Col>
          </Row>
        </Form>
        <Text type="secondary" style={{ fontSize: 12 }}>
          Estimation : base = CA - charges ; IR = base x taux, comparee au cumul des acomptes
          verses.
        </Text>
      </Col>

      <Col xs={24} md={12}>
        <div style={{ background: '#f3f6f8', borderRadius: 10, padding: '14px 16px' }}>
          <Title level={5} style={{ marginTop: 0, marginBottom: 10 }}>
            Resultat estime
          </Title>
          {resultats.map((r, index) => (
            <div
              key={r.label}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: 12,
                padding: '6px 0',
                borderBottom:
                  index === resultats.length - 1 ? 'none' : '1px solid #e6ecea',
                fontSize: 13,
              }}
            >
              <Text type="secondary">{r.label}</Text>
              <Text strong style={r.couleur ? { color: r.couleur } : undefined}>
                {r.valeur}
              </Text>
            </div>
          ))}
        </div>
      </Col>
    </Row>
  );
}
