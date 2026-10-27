import { useEffect, useState } from 'react';
import {
  Alert,
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Tag,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Space,
  Typography,
} from 'antd';
import {
  TeamOutlined,
  CheckCircleOutlined,
  StopOutlined,
  SettingOutlined,
  UserAddOutlined,
  KeyOutlined,
} from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import * as adminService from '../services/adminService';
import { LoadingBlock } from '../components/Spinner';

const { Text } = Typography;

const ROLES = ['AGENT', 'RESPONSABLE', 'ADMIN'];

const couleurStatut = (statut) => {
  if (statut === 'ACTIF') return 'green';
  if (statut === 'BLOQUE') return 'red';
  return 'default';
};

export default function Admin() {
  const { agent } = useAuth();
  const toast = useToast();

  const [agents, setAgents] = useState([]);
  const [centres, setCentres] = useState([]);
  const [parametres, setParametres] = useState([]);
  const [edits, setEdits] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [ouvertCreation, setOuvertCreation] = useState(false);
  const [resetCible, setResetCible] = useState(null);
  const [formCreer] = Form.useForm();
  const [formReset] = Form.useForm();

  const charger = async () => {
    try {
      const [a, c, p] = await Promise.all([
        adminService.listerAgents(),
        adminService.listerCentres(),
        adminService.listerParametres(),
      ]);
      setAgents(a);
      setCentres(c);
      setParametres(p);
    } catch (e) {
      setError(e.response?.data?.message || 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (agent?.role === 'ADMIN') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      charger();
    }
     
  }, [agent]);

  if (agent?.role !== 'ADMIN') {
    return (
      <div className="page">
        <Alert type="error" showIcon message="Acces reserve aux administrateurs." />
      </div>
    );
  }

  if (loading) return <LoadingBlock message="Chargement de l administration..." />;

  const agentsActifs = agents.filter((a) => a.statut === 'ACTIF').length;
  const agentsBloques = agents.filter((a) => a.statut === 'BLOQUE').length;

  const handleCreer = async (values) => {
    try {
      await adminService.creerAgent({
        ...values,
        idCentre: values.idCentre != null && values.idCentre !== ''
          ? Number(values.idCentre)
          : centres[0]?.idCentre,
      });
      toast.success('Agent cree');
      formCreer.resetFields();
      setOuvertCreation(false);
      charger();
    } catch (e2) {
      toast.error(e2.response?.data?.message || 'Erreur');
    }
  };

  const handleStatut = async (a) => {
    const cible = a.statut === 'ACTIF' ? 'BLOQUE' : 'ACTIF';
    try {
      await adminService.changerStatutAgent(a.idAgent, cible);
      toast.success('Statut mis a jour');
      charger();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Erreur');
    }
  };

  const handleReset = async (values) => {
    if (!resetCible) return;
    try {
      await adminService.reinitialiserMotDePasse(resetCible.idAgent, values.motDePasse);
      toast.success('Mot de passe reinitialise');
      formReset.resetFields();
      setResetCible(null);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Erreur');
    }
  };

  const handleSauverParam = async (p) => {
    const valeur = edits[p.idParam];
    if (valeur == null || valeur === '') return;
    try {
      await adminService.modifierParametre(p.idParam, Number(valeur));
      toast.success('Parametre mis a jour');
      setEdits((prev) => ({ ...prev, [p.idParam]: undefined }));
      charger();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Erreur');
    }
  };

  const colonnesAgents = [
    {
      title: 'Matricule',
      dataIndex: 'matricule',
      key: 'matricule',
      render: (v) => <Text strong>{v}</Text>,
    },
    {
      title: 'Nom',
      key: 'nom',
      render: (_, a) => `${a.prenom} ${a.nom}`,
    },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      render: (v) => <Tag color="geekblue">{v}</Tag>,
    },
    {
      title: 'Statut',
      dataIndex: 'statut',
      key: 'statut',
      render: (v) => <Tag color={couleurStatut(v)}>{v}</Tag>,
    },
    {
      title: 'Centre',
      key: 'centre',
      render: (_, a) => a.centre?.nom || '-',
    },
    {
      title: 'Derniere connexion',
      key: 'derniereConnexion',
      render: (_, a) =>
        a.derniereConnexion
          ? a.derniereConnexion.replace('T', ' ').substring(0, 16)
          : '-',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, a) => (
        <Space size={4}>
          <Button type="link" size="small" icon={<StopOutlined />} onClick={() => handleStatut(a)}>
            {a.statut === 'ACTIF' ? 'Bloquer' : 'Activer'}
          </Button>
          <Button type="link" size="small" icon={<KeyOutlined />} onClick={() => setResetCible(a)}>
            Reinit. mdp
          </Button>
        </Space>
      ),
    },
  ];

  const colonnesParametres = [
    { title: 'Code', dataIndex: 'code', key: 'code', render: (v) => <Text strong>{v}</Text> },
    { title: 'Description', dataIndex: 'description', key: 'description' },
    {
      title: 'Valeur',
      key: 'valeur',
      render: (_, p) => (
        <InputNumber
          style={{ width: 160 }}
          value={edits[p.idParam] ?? p.valeur}
          onChange={(v) => setEdits((prev) => ({ ...prev, [p.idParam]: v }))}
        />
      ),
    },
    {
      title: '',
      key: 'action',
      width: 120,
      render: (_, p) => (
        <Button
          type="link"
          size="small"
          disabled={edits[p.idParam] == null}
          onClick={() => handleSauverParam(p)}
        >
          Enregistrer
        </Button>
      ),
    },
  ];

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Administration</h1>
          <p className="page-subtitle">Comptes agents et parametres fiscaux</p>
        </div>
      </div>

      {error && <Alert type="error" showIcon message={error} style={{ marginBottom: 16 }} />}

      <Row gutter={[16, 16]}>
        <Col xs={12} md={6}>
          <Card>
            <Statistic
              title="Agents"
              value={agents.length}
              prefix={<TeamOutlined style={{ color: '#0E7A55' }} />}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card>
            <Statistic
              title="Agents actifs"
              value={agentsActifs}
              prefix={<CheckCircleOutlined style={{ color: '#16A34A' }} />}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card>
            <Statistic
              title="Agents bloques"
              value={agentsBloques}
              prefix={<StopOutlined style={{ color: '#DC2626' }} />}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card>
            <Statistic
              title="Parametres fiscaux"
              value={parametres.length}
              prefix={<SettingOutlined style={{ color: '#0369A1' }} />}
            />
          </Card>
        </Col>
      </Row>

      <Card
        title={`Agents (${agents.length})`}
        style={{ margin: '16px 0' }}
        extra={
          <Button
            type="primary"
            icon={<UserAddOutlined />}
            onClick={() => setOuvertCreation(true)}
          >
            Nouvel agent
          </Button>
        }
      >
        <Table
          rowKey="idAgent"
          size="small"
          columns={colonnesAgents}
          dataSource={agents}
          scroll={{ x: 1000 }}
          pagination={false}
        />
      </Card>

      <Card title={`Parametres fiscaux (${parametres.length})`}>
        <Table
          rowKey="idParam"
          size="small"
          columns={colonnesParametres}
          dataSource={parametres}
          pagination={false}
        />
      </Card>

      <Modal
        open={ouvertCreation}
        title="Nouvel agent"
        onCancel={() => setOuvertCreation(false)}
        footer={null}
        destroyOnHidden
        centered
        width={520}
      >
        <Form
          form={formCreer}
          layout="vertical"
          onFinish={handleCreer}
          initialValues={{ role: 'AGENT', idCentre: centres[0]?.idCentre }}
        >
          <Row gutter={12}>
            <Col xs={24} md={12}>
              <Form.Item
                name="matricule"
                label="Matricule"
                rules={[{ required: true, message: 'Matricule requis' }]}
              >
                <Input placeholder="Matricule" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="nom"
                label="Nom"
                rules={[{ required: true, message: 'Nom requis' }]}
              >
                <Input placeholder="Nom" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="prenom"
                label="Prenom"
                rules={[{ required: true, message: 'Prenom requis' }]}
              >
                <Input placeholder="Prenom" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="email"
                label="Email"
                rules={[
                  { required: true, message: 'Email requis' },
                  { type: 'email', message: 'Email invalide' },
                ]}
              >
                <Input placeholder="Email" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="role" label="Role">
                <Select options={ROLES.map((r) => ({ value: r, label: r }))} />
              </Form.Item>
            </Col>
            {centres.length > 1 && (
              <Col xs={24} md={12}>
                <Form.Item name="idCentre" label="Centre">
                  <Select
                    options={centres.map((c) => ({
                      value: c.idCentre,
                      label: c.nom,
                    }))}
                  />
                </Form.Item>
              </Col>
            )}
            <Col span={24}>
              <Form.Item
                name="motDePasse"
                label="Mot de passe"
                rules={[
                  { required: true, message: 'Mot de passe requis' },
                  { min: 8, message: '8 caracteres minimum' },
                ]}
              >
                <Input.Password placeholder="Mot de passe" />
              </Form.Item>
            </Col>
          </Row>
          <Button type="primary" htmlType="submit" block icon={<UserAddOutlined />}>
            Creer l agent
          </Button>
        </Form>
      </Modal>

      <Modal
        open={!!resetCible}
        title={
          resetCible
            ? `Reinitialiser le mot de passe - ${resetCible.prenom} ${resetCible.nom}`
            : ''
        }
        onCancel={() => setResetCible(null)}
        footer={null}
        destroyOnHidden
        centered
        width={440}
      >
        <Form form={formReset} layout="vertical" onFinish={handleReset}>
          <Form.Item
            name="motDePasse"
            label="Nouveau mot de passe"
            rules={[
              { required: true, message: 'Mot de passe requis' },
              { min: 8, message: '8 caracteres minimum' },
            ]}
          >
            <Input.Password placeholder="Nouveau mot de passe" />
          </Form.Item>
          <Button type="primary" htmlType="submit" block icon={<KeyOutlined />}>
            Reinitialiser
          </Button>
        </Form>
      </Modal>
    </div>
  );
}
