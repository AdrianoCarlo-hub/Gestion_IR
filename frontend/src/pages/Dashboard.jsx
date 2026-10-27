import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Row,
  Col,
  Statistic,
  Progress,
  Table,
  Tag,
  Button,
  Alert,
  Typography,
} from 'antd';
import {
  TeamOutlined,
  FileTextOutlined,
  CreditCardOutlined,
  CalendarOutlined,
  WarningOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import * as statService from '../services/statistiqueService';
import * as impayeService from '../services/impayeService';
import { LoadingBlock } from '../components/Spinner';
import BarChartCard from '../components/charts/BarChartCard';
import PieChartCard from '../components/charts/PieChartCard';
import { formatAr } from '../utils/format';

const { Text } = Typography;

export default function Dashboard() {
  const { agent } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [parAnnee, setParAnnee] = useState([]);
  const [parStatut, setParStatut] = useState([]);
  const [alertes, setAlertes] = useState(null);
  const [impayes, setImpayes] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      statService.resume(),
      statService.parAnnee(),
      statService.parStatut(),
      statService.alertes().catch(() => null),
      impayeService.lister(new Date().getFullYear()).catch(() => []),
    ])
      .then(([r, a, s, al, im]) => {
        setStats(r);
        setParAnnee(a);
        setParStatut(s);
        setAlertes(al);
        setImpayes(im);
      })
      .catch((e) => setError(e.response?.data?.message || 'Erreur de chargement'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingBlock message="Chargement du tableau de bord..." />;

  const annee = new Date().getFullYear();
  const heure = new Date().getHours();
  const salutation = heure < 12 ? 'Bonjour' : heure < 18 ? 'Bon apres-midi' : 'Bonsoir';

  const impayesTries = [...(impayes || [])]
    .sort((a, b) => (b.resteAPayer || 0) - (a.resteAPayer || 0))
    .slice(0, 5);

  const colonnesImpayes = [
    {
      title: 'Contribuable',
      key: 'contribuable',
      render: (_, r) => (
        <div>
          <Text strong>{r.raisonSociale}</Text>
          <br />
          <Text type="secondary">{r.nif}</Text>
        </div>
      ),
    },
    {
      title: 'IR du',
      dataIndex: 'irDu',
      key: 'irDu',
      align: 'right',
      render: (v) => formatAr(v),
    },
    {
      title: 'Reste a payer',
      dataIndex: 'resteAPayer',
      key: 'reste',
      align: 'right',
      render: (v) => (
        <Text type="danger" strong>
          {formatAr(v)}
        </Text>
      ),
    },
    {
      title: '',
      key: 'action',
      width: 90,
      render: () => (
        <Button type="link" size="small" onClick={() => navigate('/recouvrement')}>
          Relancer
        </Button>
      ),
    },
  ];

  const colonnesEcheances = [
    { title: 'Contribuable', dataIndex: 'raisonSociale', key: 'rs' },
    {
      title: 'Annee / n',
      key: 'ref',
      render: (_, a) => `${a.annee} n°${a.numero}`,
    },
    { title: 'Echeance', dataIndex: 'dateEcheance', key: 'echeance' },
    {
      title: 'Montant',
      dataIndex: 'montant',
      key: 'montant',
      align: 'right',
      render: (v) => formatAr(v),
    },
    {
      title: 'Dans',
      dataIndex: 'joursRestants',
      key: 'jours',
      render: (j) => (
        <Tag color={j <= 7 ? 'red' : 'orange'}>{j} j</Tag>
      ),
    },
  ];

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Tableau de bord</h1>
          <p className="page-subtitle">
            {salutation} {agent?.prenom} {agent?.nom} — {agent?.role}
          </p>
        </div>
      </div>

      {error && <Alert type="error" showIcon message={error} />}

      {stats && (
        <>
          <Row gutter={[16, 16]}>
            <Col xs={12} md={6}>
              <Card>
                <Statistic
                  title="Contribuables"
                  value={stats.contribuables}
                  prefix={<TeamOutlined style={{ color: '#0E7A55' }} />}
                />
              </Card>
            </Col>
            <Col xs={12} md={6}>
              <Card>
                <Statistic
                  title="Declarations IR"
                  value={stats.declarations}
                  prefix={<FileTextOutlined style={{ color: '#0369A1' }} />}
                />
              </Card>
            </Col>
            <Col xs={12} md={6}>
              <Card>
                <Statistic
                  title="Paiements"
                  value={stats.paiements}
                  prefix={<CreditCardOutlined style={{ color: '#16A34A' }} />}
                />
              </Card>
            </Col>
            <Col xs={12} md={6}>
              <Card>
                <Statistic
                  title="Acomptes"
                  value={stats.acomptes}
                  prefix={<CalendarOutlined style={{ color: '#EA580C' }} />}
                />
              </Card>
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            <Col xs={24} md={8} lg={4} xl={4}>
              <Card>
                <Statistic title={`IR total du (${annee})`} value={stats.irTotal} precision={0} suffix="Ar" valueStyle={{ fontSize: 18 }} />
              </Card>
            </Col>
            <Col xs={24} md={8} lg={5} xl={5}>
              <Card>
                <Statistic
                  title="Total encaisse"
                  value={stats.encaisse}
                  precision={0}
                  suffix="Ar"
                  valueStyle={{ color: '#16A34A', fontSize: 18 }}
                />
              </Card>
            </Col>
            <Col xs={24} md={8} lg={5} xl={5}>
              <Card>
                <Statistic
                  title="Reste a payer"
                  value={stats.soldeAPayer}
                  precision={0}
                  suffix="Ar"
                  valueStyle={{ color: '#EA580C', fontSize: 18 }}
                />
              </Card>
            </Col>
            <Col xs={12} md={6} lg={5} xl={5}>
              <Card>
                <Statistic
                  title="Contribuables en retard"
                  value={
                    alertes ? alertes.nbContribuablesEnRetard : stats.nbEnRetard || 0
                  }
                  prefix={<WarningOutlined style={{ color: '#DC2626' }} />}
                  valueStyle={{ color: '#DC2626', fontSize: 18 }}
                />
              </Card>
            </Col>
            <Col xs={12} md={6} lg={5} xl={5}>
              <Card title="Taux de recouvrement" size="small">
                <Text strong style={{ fontSize: 18 }}>
                  {stats.tauxRecouvrement} %
                </Text>
                <Progress
                  percent={Math.min(Number(stats.tauxRecouvrement) || 0, 100)}
                  showInfo={false}
                  strokeColor="#0E7A55"
                  size="small"
                />
              </Card>
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            <Col xs={24} lg={14}>
              <BarChartCard
                titre="IR du par annee"
                data={parAnnee}
                cleX="annee"
                series={[
                  { dataKey: 'irDu', name: 'IR du', couleur: '#0E7A55' },
                  { dataKey: 'soldeAPayer', name: 'Solde a payer', couleur: '#F59E0B' },
                ]}
              />
            </Col>
            <Col xs={24} lg={10}>
              <PieChartCard
                titre="Declarations par statut"
                data={parStatut}
                cleNom="statut"
                cleValeur="nombre"
              />
            </Col>
          </Row>

          {(alertes || impayes) && (
            <Row gutter={[16, 16]}>
              <Col xs={24} lg={12}>
                <Card
                  title={
                    <span>
                      <WarningOutlined style={{ color: '#DC2626', marginRight: 8 }} />
                      Top 5 des impayes (
                      {formatAr((impayes || []).reduce((t, i) => t + (i.resteAPayer || 0), 0))} a
                      recouvrer)
                    </span>
                  }
                >
                  <Table
                    size="small"
                    rowKey="idDeclaration"
                    columns={colonnesImpayes}
                    dataSource={impayesTries}
                    pagination={false}
                    locale={{ emptyText: 'Aucun impaye' }}
                  />
                </Card>
              </Col>
              <Col xs={24} lg={12}>
                {alertes && (
                <Card
                  title={
                    <span>
                      <ClockCircleOutlined style={{ color: '#F59E0B', marginRight: 8 }} />
                      Echeances dans les 30 jours ({alertes.acomptesAvenir.length})
                    </span>
                  }
                >
                  <Table
                    size="small"
                    rowKey="idAcompte"
                    columns={colonnesEcheances}
                    dataSource={alertes.acomptesAvenir}
                    pagination={false}
                    locale={{ emptyText: 'Aucune echeance imminente' }}
                  />
                </Card>
                )}
              </Col>
            </Row>
          )}
        </>
      )}
    </div>
  );
}
