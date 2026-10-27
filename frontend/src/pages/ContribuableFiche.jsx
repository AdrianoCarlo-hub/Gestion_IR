import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Tag,
  Button,
  Avatar,
  Space,
  Descriptions,
  Alert,
  Typography,
} from 'antd';
import {
  ArrowLeftOutlined,
  UserOutlined,
  FileTextOutlined,
  CreditCardOutlined,
  WarningOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { trouver } from '../services/contribuableService';
import * as situationService from '../services/situationService';
import { LoadingBlock } from '../components/Spinner';
import { formatAr, formatDate, STATUT_DECLARATION } from '../utils/format';

const { Text, Title } = Typography;

const COULEUR_STATUT = {
  ACTIF: 'green',
  SUSPENDU: 'orange',
  CESSE: 'red',
  RADIE: 'red',
};

export default function ContribuableFiche() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [contribuable, setContribuable] = useState(null);
  const [situation, setSituation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([trouver(id), situationService.getSituationFiscale(id)])
      .then(([c, s]) => {
        setContribuable(c);
        setSituation(s);
      })
      .catch((e) => setError(e.response?.data?.message || 'Erreur'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <LoadingBlock message="Chargement de la fiche..." />;
  if (error) {
    return (
      <div className="page">
        <Alert type="error" showIcon message={error} />
      </div>
    );
  }
  if (!contribuable) return null;

  const statutFiscal = (() => {
    if (!situation) return 'inconnu';
    if (situation.enRetard) return 'retard';
    if (situation.resteAPayer > 0) return 'a_payer';
    return 'a_jour';
  })();

  const configFiscal = {
    a_jour: { couleur: 'green', label: 'A jour', icone: <CheckCircleOutlined /> },
    a_payer: { couleur: 'orange', label: 'A payer', icone: <FileTextOutlined /> },
    retard: { couleur: 'red', label: 'En retard', icone: <WarningOutlined /> },
    inconnu: { couleur: 'default', label: 'Inconnu', icone: <FileTextOutlined /> },
  };
  const fiscal = configFiscal[statutFiscal];

  const infosItems = [
    { key: 'nif', label: 'NIF', children: <Text strong>{contribuable.nif}</Text> },
    ...(contribuable.stat
      ? [{ key: 'stat', label: 'STAT', children: contribuable.stat }]
      : []),
    { key: 'dirigeant', label: 'Dirigeant', children: contribuable.nomDirigeant },
    { key: 'cin', label: 'CIN', children: contribuable.cinDirigeant },
    { key: 'adresse', label: 'Adresse', children: contribuable.adresse },
    ...(contribuable.telephone
      ? [{ key: 'telephone', label: 'Telephone', children: contribuable.telephone }]
      : []),
    ...(contribuable.email
      ? [{ key: 'email', label: 'E-mail', children: contribuable.email }]
      : []),
    {
      key: 'secteur',
      label: 'Secteur',
      children: contribuable.secteur ? contribuable.secteur.libelle : '-',
    },
    {
      key: 'regime',
      label: 'Regime',
      children: <Tag color="blue">Reel obligatoire</Tag>,
    },
    {
      key: 'immatriculation',
      label: 'Date immatriculation',
      children: formatDate(contribuable.dateImmatriculation),
    },
    {
      key: 'statut',
      label: 'Statut',
      children: (
        <Tag color={COULEUR_STATUT[contribuable.statut] || 'default'}>
          {contribuable.statut}
        </Tag>
      ),
    },
  ];

  const colonnesDeclarations = [
    {
      title: 'Annee',
      dataIndex: 'annee',
      key: 'annee',
      render: (v) => <Text strong>{v}</Text>,
    },
    {
      title: 'IR du',
      dataIndex: 'irDu',
      key: 'irDu',
      align: 'right',
      render: (v) => formatAr(v),
    },
    {
      title: 'Solde',
      dataIndex: 'soldeAPayer',
      key: 'soldeAPayer',
      align: 'right',
      render: (v) => (
        <Text strong type={v > 0 ? 'danger' : 'success'}>
          {formatAr(v)}
        </Text>
      ),
    },
    {
      title: 'Statut',
      dataIndex: 'statut',
      key: 'statut',
      render: (v) => {
        const cfg = STATUT_DECLARATION[v];
        return <Tag color={cfg ? cfg.couleur : 'default'}>{cfg ? cfg.libelle : v}</Tag>;
      },
    },
  ];

  const colonnesPaiements = [
    {
      title: 'Quittance',
      dataIndex: 'referenceQuittance',
      key: 'referenceQuittance',
      render: (v) => <Text strong>{v}</Text>,
    },
    {
      title: 'Date',
      dataIndex: 'datePaiement',
      key: 'datePaiement',
      render: (v) => formatDate(v),
    },
    {
      title: 'Montant',
      dataIndex: 'montantAr',
      key: 'montantAr',
      align: 'right',
      render: (v) => formatAr(v),
    },
    {
      title: 'Statut',
      key: 'statut',
      render: (_, p) => (
        <Tag color={p.annule ? 'red' : 'green'}>{p.annule ? 'ANNULE' : 'VALIDE'}</Tag>
      ),
    },
  ];

  const declarations = situation?.declarations || [];
  const paiements = situation?.paiements || [];

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <Button
            type="link"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/contribuables')}
            style={{ paddingLeft: 0 }}
          >
            Retour a la liste
          </Button>
        </div>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]} align="middle" justify="space-between">
          <Col>
            <Space size={16} align="center">
              <Avatar size={56} icon={<UserOutlined />} style={{ backgroundColor: '#0E7A55' }} />
              <div>
                <Title level={4} style={{ margin: 0 }}>
                  {contribuable.raisonSociale}
                </Title>
                <Space size={8} wrap style={{ marginTop: 4 }}>
                  <Tag color="green">NIF {contribuable.nif}</Tag>
                  <Text type="secondary">{contribuable.formeJuridique}</Text>
                  {contribuable.secteur && (
                    <Text type="secondary">— {contribuable.secteur.libelle}</Text>
                  )}
                </Space>
              </div>
            </Space>
          </Col>
          <Col>
            <Space direction="vertical" align="end" size={8}>
              <Tag color={COULEUR_STATUT[contribuable.statut] || 'default'}>
                {contribuable.statut}
              </Tag>
              <Tag color={fiscal.couleur} icon={fiscal.icone}>
                {fiscal.label}
              </Tag>
            </Space>
          </Col>
        </Row>
      </Card>

      {situation && (
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={12} md={6}>
            <Card>
              <Statistic
                title="Total IR du"
                value={formatAr(situation.totalDu)}
                valueStyle={{ fontSize: 18, color: '#0369A1' }}
              />
            </Card>
          </Col>
          <Col xs={12} md={6}>
            <Card>
              <Statistic
                title="Total paye"
                value={formatAr(situation.totalPaye)}
                valueStyle={{ fontSize: 18, color: '#16A34A' }}
              />
            </Card>
          </Col>
          <Col xs={12} md={6}>
            <Card>
              <Statistic
                title="Reste a payer"
                value={formatAr(situation.resteAPayer)}
                valueStyle={{ fontSize: 18, color: '#EA580C' }}
              />
            </Card>
          </Col>
          <Col xs={12} md={6}>
            <Card>
              <Statistic
                title="Declarations impayees"
                value={situation.nbDeclarationsImpayees}
                valueStyle={{ fontSize: 18, color: '#DC2626' }}
              />
            </Card>
          </Col>
        </Row>
      )}

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={10}>
          <Card
            title={
              <span>
                <UserOutlined style={{ marginRight: 8, color: '#0E7A55' }} />
                Informations generales
              </span>
            }
          >
            <Descriptions column={1} size="small" items={infosItems} />
          </Card>
        </Col>
        <Col xs={24} lg={14}>
          <Card
            title={
              <span>
                <FileTextOutlined style={{ marginRight: 8, color: '#0369A1' }} />
                Declarations ({declarations.length})
              </span>
            }
          >
            <Table
              rowKey="idDeclaration"
              size="small"
              columns={colonnesDeclarations}
              dataSource={declarations}
              pagination={false}
              locale={{ emptyText: 'Aucune declaration' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24}>
          <Card
            title={
              <span>
                <CreditCardOutlined style={{ marginRight: 8, color: '#16A34A' }} />
                Paiements ({paiements.length})
              </span>
            }
          >
            <Table
              rowKey="idPaiement"
              size="small"
              columns={colonnesPaiements}
              dataSource={paiements}
              pagination={false}
              locale={{ emptyText: 'Aucun paiement' }}
              onRow={(p) => ({ style: { opacity: p.annule ? 0.5 : 1 } })}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
