import { useEffect, useMemo, useState } from 'react';
import { Card, Row, Col, Statistic, Table, Tag, Select, Alert, Typography } from 'antd';
import {
  SnippetsOutlined,
  ClockCircleOutlined,
  UserOutlined,
  DatabaseOutlined,
} from '@ant-design/icons';
import * as service from '../services/auditService';
import SearchBar from '../components/SearchBar';
import { SkeletonTable } from '../components/Spinner';
import EmptyState from '../components/EmptyState';

const { Text } = Typography;

const couleurAction = (action = '') => {
  const u = action.toUpperCase();
  if (u.includes('SUPPR') || u.includes('DELETE')) return 'red';
  if (u.includes('MODIF') || u.includes('UPDATE') || u.includes('CHANG')) return 'blue';
  if (u.includes('CRE') || u.includes('AJOUT')) return 'green';
  return 'default';
};

export default function Audit() {
  const [liste, setListe] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [recherche, setRecherche] = useState('');
  const [actionFiltre, setActionFiltre] = useState('');

  useEffect(() => {
    service.lister()
      .then(setListe)
      .catch((e) => setError(e.response?.data?.message || 'Erreur'))
      .finally(() => setLoading(false));
  }, []);

  const actions = useMemo(
    () => [...new Set(liste.map((j) => j.action).filter(Boolean))].sort(),
    [liste]
  );

  const listeFiltree = useMemo(() => {
    const r = recherche.trim().toLowerCase();
    return liste.filter((j) => {
      const okAction = !actionFiltre || j.action === actionFiltre;
      const okRecherche =
        !r ||
        (j.action || '').toLowerCase().includes(r) ||
        (j.tableCible || '').toLowerCase().includes(r) ||
        (j.agent ? (j.agent.nom + ' ' + j.agent.prenom).toLowerCase() : '').includes(r);
      return okAction && okRecherche;
    });
  }, [liste, recherche, actionFiltre]);

  const stats = {
    totalActions: liste.length,
    todayActions: liste.filter((j) =>
      j.dateHeure?.startsWith(new Date().toISOString().slice(0, 10))
    ).length,
    agents: [...new Set(liste.map((j) => j.agent?.idAgent).filter(Boolean))].length,
    tables: [...new Set(liste.map((j) => j.tableCible).filter(Boolean))].length,
  };

  const colonnes = [
    {
      title: 'Date / Heure',
      dataIndex: 'dateHeure',
      key: 'dateHeure',
      width: 160,
      render: (v) => <Text style={{ whiteSpace: 'nowrap' }}>{v?.replace('T', ' ').substring(0, 19)}</Text>,
    },
    {
      title: 'Agent',
      key: 'agent',
      render: (_, j) =>
        j.agent ? (
          <span>
            <UserOutlined style={{ color: '#0E7A55', marginRight: 6 }} />
            {j.agent.prenom} {j.agent.nom}
          </span>
        ) : (
          'Systeme'
        ),
    },
    {
      title: 'Action',
      dataIndex: 'action',
      key: 'action',
      render: (v) => <Tag color={couleurAction(v)}>{v}</Tag>,
    },
    {
      title: 'Table cible',
      dataIndex: 'tableCible',
      key: 'tableCible',
      render: (v) => (v ? <Tag color="geekblue">{v}</Tag> : '-'),
    },
    {
      title: 'Identifiant',
      key: 'identifiant',
      render: (_, j) => (
        <>
          <div>{j.idCible || '-'}</div>
          {j.adresseIp && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              {j.adresseIp}
            </Text>
          )}
        </>
      ),
    },
    {
      title: 'Detail',
      dataIndex: 'details',
      key: 'details',
      ellipsis: true,
      render: (v) =>
        v ? (
          <Text ellipsis={{ tooltip: v }} style={{ maxWidth: 260 }}>
            {v}
          </Text>
        ) : (
          '-'
        ),
    },
  ];

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Journal d audit</h1>
          <p className="page-subtitle">Tracabilite de toutes les actions</p>
        </div>
      </div>

      {error && (
        <Alert type="error" showIcon message={error} style={{ marginBottom: 16 }} />
      )}

      <SearchBar
        value={recherche}
        onChange={setRecherche}
        placeholder="Recherche (action, table, agent)"
      >
        <Select
          allowClear
          placeholder="Toutes actions"
          style={{ width: 180 }}
          value={actionFiltre || undefined}
          onChange={(v) => setActionFiltre(v || '')}
          options={actions.map((a) => ({ value: a, label: a }))}
        />
      </SearchBar>

      <Row gutter={[16, 16]} style={{ margin: '16px 0 24px' }}>
        <Col xs={12} md={6}>
          <Card>
            <Statistic
              title="Total actions"
              value={stats.totalActions}
              prefix={<SnippetsOutlined style={{ color: '#0E7A55' }} />}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card>
            <Statistic
              title="Actions aujourd'hui"
              value={stats.todayActions}
              prefix={<ClockCircleOutlined style={{ color: '#0369A1' }} />}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card>
            <Statistic
              title="Agents actifs"
              value={stats.agents}
              prefix={<UserOutlined style={{ color: '#F59E0B' }} />}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card>
            <Statistic
              title="Tables modifiees"
              value={stats.tables}
              prefix={<DatabaseOutlined style={{ color: '#7C3AED' }} />}
            />
          </Card>
        </Col>
      </Row>

      {loading ? (
        <SkeletonTable rows={10} cols={6} />
      ) : (
        <Table
          rowKey="idLog"
          size="small"
          columns={colonnes}
          dataSource={listeFiltree}
          scroll={{ x: 900 }}
          pagination={{
            pageSize: 15,
            showSizeChanger: true,
            showTotal: (total) => `${total} entree(s)`,
          }}
          locale={{
            emptyText: (
              <EmptyState
                titre="Aucune action enregistree"
                texte="Le journal d audit sera rempli automatiquement lors des operations"
              />
            ),
          }}
        />
      )}
    </div>
  );
}
