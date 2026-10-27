import { useEffect, useMemo, useState } from 'react';
import { Button, Card, Col, Row, Select, Space, Statistic, Table, Tag, Typography } from 'antd';
import { AlertOutlined, FileExcelOutlined, ReloadOutlined } from '@ant-design/icons';
import SearchBar from '../components/SearchBar';
import ConfirmDialog from '../components/ConfirmDialog';
import EmptyState from '../components/EmptyState';
import { useToast } from '../context/ToastContext';
import * as impayeService from '../services/impayeService';
import * as declarationService from '../services/declarationService';
import * as exportService from '../services/exportService';
import { formatAr, formatDate, STATUT_DECLARATION } from '../utils/format';

const { Text } = Typography;

const anneeCourante = new Date().getFullYear();
const OPTIONS_ANNEE = [anneeCourante, anneeCourante - 1, anneeCourante - 2].map((a) => ({
  value: a,
  label: String(a),
}));

export default function Recouvrement() {
  const toast = useToast();
  const [annee, setAnnee] = useState(anneeCourante);
  const [liste, setListe] = useState([]);
  const [loading, setLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [relanceLoading, setRelanceLoading] = useState(false);
  const [motCle, setMotCle] = useState('');
  const [confirm, setConfirm] = useState(null);

  const charger = async (exercice) => {
    setLoading(true);
    try {
      const data = await impayeService.lister(exercice);
      setListe(Array.isArray(data) ? data : []);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    charger(anneeCourante);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const changerAnnee = (v) => {
    setAnnee(v);
    charger(v);
  };

  const listeFiltree = useMemo(() => {
    const r = motCle.trim().toLowerCase();
    if (!r) return liste;
    return liste.filter(
      (i) =>
        String(i.nif || '').includes(r) ||
        (i.raisonSociale || '').toLowerCase().includes(r)
    );
  }, [liste, motCle]);

  const kpis = useMemo(() => {
    const total = (cle) => liste.reduce((t, i) => t + (Number(i[cle]) || 0), 0);
    return {
      debitaires: liste.length,
      irDu: total('irDu'),
      dejaPaye: total('dejaPaye'),
      reste: total('resteAPayer'),
    };
  }, [liste]);

  const handleExportExcel = async () => {
    setExportLoading(true);
    try {
      await exportService.exportImpayees(annee);
      toast.success('Export effectue avec succes');
    } catch (e) {
      toast.error(e.response?.data?.message || "Erreur lors de l export");
    } finally {
      setExportLoading(false);
    }
  };

  const demanderRelance = (r) =>
    setConfirm({
      raisonSociale: r.raisonSociale,
      id: r.idDeclaration,
    });

  const confirmerRelance = async () => {
    if (!confirm) return;
    setRelanceLoading(true);
    try {
      const res = await declarationService.relancer(confirm.id);
      toast.success(res?.message || 'Relance lancee avec succes');
      setConfirm(null);
      charger(annee);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Erreur lors de la relance');
      setConfirm(null);
    } finally {
      setRelanceLoading(false);
    }
  };

  const colonnes = [
    {
      title: 'Contribuable',
      key: 'contribuable',
      render: (_, r) => (
        <div>
          <Text strong>{r.raisonSociale}</Text>
          <br />
          <Text type="secondary">NIF : {r.nif}</Text>
        </div>
      ),
    },
    { title: 'Exercice', dataIndex: 'annee', key: 'annee', align: 'center' },
    {
      title: 'IR du',
      dataIndex: 'irDu',
      key: 'irDu',
      align: 'right',
      render: (v) => formatAr(v),
    },
    {
      title: 'Deja paye',
      dataIndex: 'dejaPaye',
      key: 'dejaPaye',
      align: 'right',
      render: (v) => <Text style={{ color: v > 0 ? '#0E7A55' : undefined }}>{formatAr(v)}</Text>,
    },
    {
      title: 'Reste a payer',
      dataIndex: 'resteAPayer',
      key: 'resteAPayer',
      align: 'right',
      render: (v) => (
        <Text type="danger" strong>
          {formatAr(v)}
        </Text>
      ),
    },
    {
      title: 'Date limite',
      dataIndex: 'dateLimite',
      key: 'dateLimite',
      render: (v) => formatDate(v),
    },
    {
      title: 'Statut',
      dataIndex: 'statut',
      key: 'statut',
      render: (v) => {
        const info = STATUT_DECLARATION[v] || { couleur: 'default', libelle: v || '-' };
        return <Tag color={info.couleur}>{info.libelle}</Tag>;
      },
    },
    {
      title: 'Action',
      key: 'action',
      width: 120,
      render: (_, r) => (
        <Button
          type="primary"
          size="small"
          icon={<AlertOutlined />}
          loading={relanceLoading}
          onClick={() => demanderRelance(r)}
        >
          Relancer
        </Button>
      ),
    },
  ];

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Recouvrement</h1>
          <p className="page-subtitle">Contribuables debiteurs de l IR - annee en cours</p>
        </div>
        <Space wrap size={12}>
          <Select
            value={annee}
            onChange={changerAnnee}
            options={OPTIONS_ANNEE}
            style={{ width: 110 }}
            aria-label="Exercice"
          />
          <Button icon={<ReloadOutlined />} onClick={() => charger(annee)} loading={loading}>
            Actualiser
          </Button>
          <Button
            icon={<FileExcelOutlined />}
            onClick={handleExportExcel}
            loading={exportLoading}
          >
            Exporter Excel
          </Button>
        </Space>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={12} md={6}>
          <Card>
            <Statistic title="Debiteurs" value={kpis.debitaires} prefix={<AlertOutlined />} />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card>
            <Statistic title="IR du total" value={kpis.irDu} formatter={() => formatAr(kpis.irDu)} />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card>
            <Statistic
              title="Deja paye"
              value={kpis.dejaPaye}
              formatter={() => formatAr(kpis.dejaPaye)}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card>
            <Statistic
              title="Reste a recouvrer"
              value={kpis.reste}
              formatter={() => formatAr(kpis.reste)}
              valueStyle={{ color: '#DC2626' }}
            />
          </Card>
        </Col>
      </Row>

      <SearchBar
        value={motCle}
        onChange={setMotCle}
        placeholder="Recherche (NIF, raison sociale)"
      />

      <Card size="small">
        <Table
          rowKey="idDeclaration"
          columns={colonnes}
          dataSource={listeFiltree}
          loading={loading}
          pagination={{ pageSize: 20, showSizeChanger: false }}
          locale={{
            emptyText: (
              <EmptyState titre="Aucun impaye" texte="Aucun impaye pour cette annee" />
            ),
          }}
        />
      </Card>

      <ConfirmDialog
        ouvert={!!confirm}
        titre="Lancer une relance"
        message={
          confirm
            ? `Lancer une relance pour ${confirm.raisonSociale} ?`
            : ''
        }
        texteConfirmer="Relancer"
        onConfirmer={confirmerRelance}
        onAnnuler={() => setConfirm(null)}
      />
    </div>
  );
}
