import { useEffect, useMemo, useState } from 'react';
import {
  Button,
  Card,
  Col,
  Descriptions,
  Modal,
  Row,
  Select,
  Statistic,
  Table,
  Tag,
  Typography,
} from 'antd';
import {
  CalendarOutlined,
  DollarOutlined,
  FallOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { lister as listerContribuables } from '../services/contribuableService';
import * as service from '../services/deficitService';
import SearchBar from '../components/SearchBar';
import ContribuableRecherche from '../components/ContribuableRecherche';
import EmptyState from '../components/EmptyState';
import { LoadingBlock } from '../components/Spinner';
import { useToast } from '../context/ToastContext';
import { formatAr } from '../utils/format';

const { Text } = Typography;

const STATUTS_DEFCIT = {
  ACTIF: { couleur: 'green', libelle: 'Actif' },
  EPUISE: { couleur: 'red', libelle: 'Epuise' },
  EXPIRE: { couleur: 'default', libelle: 'Expire' },
};

const FILTRES_STATUT = [
  { value: 'TOUS', label: 'Tous les statuts' },
  { value: 'ACTIF', label: 'Actif' },
  { value: 'EPUISE', label: 'Epuise' },
  { value: 'EXPIRE', label: 'Expire' },
];

export default function Deficits() {
  const toast = useToast();
  const [liste, setListe] = useState([]);
  const [contribuables, setContribuables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recherche, setRecherche] = useState('');
  const [filtreContribuable, setFiltreContribuable] = useState('');
  const [filtreStatut, setFiltreStatut] = useState('TOUS');
  const [detail, setDetail] = useState(null);

  useEffect(() => {
    service
      .lister()
      .then(setListe)
      .catch((e) => toast.error(e.response?.data?.message || 'Erreur de chargement'))
      .finally(() => setLoading(false));
    listerContribuables().then(setContribuables).catch(() => {});
  }, [toast]);

  const listeFiltree = useMemo(() => {
    const r = recherche.trim().toLowerCase();
    return liste.filter((d) => {
      const idDeficitContribuable = d.idContribuable ?? d.contribuable?.idContribuable;
      const okStatut = filtreStatut === 'TOUS' || (d.statut || '') === filtreStatut;
      const okContribuable =
        !filtreContribuable || String(idDeficitContribuable) === String(filtreContribuable);
      const okRecherche =
        !r ||
        (d.contribuable?.raisonSociale || '').toLowerCase().includes(r) ||
        (d.contribuable?.nif || '').toLowerCase().includes(r) ||
        String(d.anneeOrigine).includes(r);
      return okStatut && okContribuable && okRecherche;
    });
  }, [liste, recherche, filtreContribuable, filtreStatut]);

  const totalDisponible = liste.reduce((sum, d) => sum + (Number(d.solde) || 0), 0);
  const montantInitial = liste.reduce((sum, d) => sum + (Number(d.montantInitial) || 0), 0);
  const deficitsActifs = liste.filter((d) => d.statut === 'ACTIF').length;

  const tagStatut = (statut) => {
    const info = STATUTS_DEFCIT[statut] || { couleur: 'default', libelle: statut || '-' };
    return <Tag color={info.couleur}>{info.libelle}</Tag>;
  };

  const colonnes = [
    {
      title: 'Contribuable',
      key: 'contribuable',
      render: (_, d) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Text strong>{d.contribuable?.raisonSociale || '-'}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {d.contribuable?.nif || '-'}
          </Text>
        </div>
      ),
    },
    { title: "Annee d'origine", dataIndex: 'anneeOrigine', key: 'anneeOrigine', width: 130 },
    {
      title: 'Montant initial',
      dataIndex: 'montantInitial',
      key: 'montantInitial',
      align: 'right',
      width: 150,
      render: (v) => <span className="mono">{formatAr(v)}</span>,
    },
    {
      title: 'Montant utilise',
      dataIndex: 'montantUtilise',
      key: 'montantUtilise',
      align: 'right',
      width: 150,
      render: (v) => <span className="mono">{formatAr(v)}</span>,
    },
    {
      title: 'Solde disponible',
      dataIndex: 'solde',
      key: 'solde',
      align: 'right',
      width: 160,
      render: (v) => (
        <Text strong className="mono" style={{ color: Number(v) > 0 ? '#0E7A55' : undefined }}>
          {formatAr(v)}
        </Text>
      ),
    },
    {
      title: "Annee d'expiration",
      dataIndex: 'anneeExpiration',
      key: 'anneeExpiration',
      width: 140,
      align: 'center',
    },
    {
      title: 'Statut',
      dataIndex: 'statut',
      key: 'statut',
      width: 110,
      render: (statut) => tagStatut(statut),
    },
    {
      title: '',
      key: 'detail',
      width: 90,
      render: (_, d) => (
        <Button type="link" size="small" onClick={() => setDetail(d)}>
          Detail
        </Button>
      ),
    },
  ];

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Deficits</h1>
          <p className="page-subtitle">
            Stock de deficits reportables (5 ans) - mis a jour automatiquement
          </p>
        </div>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={12} md={6}>
          <Card>
            <Statistic
              title="Deficits actifs"
              value={deficitsActifs}
              prefix={<FallOutlined style={{ color: '#0E7A55' }} />}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card>
            <Statistic
              title="Total disponible"
              value={totalDisponible}
              precision={0}
              suffix="Ar"
              prefix={<DollarOutlined style={{ color: '#16A34A' }} />}
              valueStyle={{ color: '#16A34A' }}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card>
            <Statistic
              title="Montant initial"
              value={montantInitial}
              precision={0}
              suffix="Ar"
              prefix={<WarningOutlined style={{ color: '#EA580C' }} />}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card>
            <Statistic
              title="Total deficits"
              value={liste.length}
              prefix={<CalendarOutlined style={{ color: '#0369A1' }} />}
            />
          </Card>
        </Col>
      </Row>

      <div className="toolbar">
        <SearchBar
          value={recherche}
          onChange={setRecherche}
          placeholder="Recherche (contribuable, NIF, annee)"
        >
          <Select
            value={filtreStatut}
            onChange={setFiltreStatut}
            style={{ width: 170 }}
            options={FILTRES_STATUT}
            aria-label="Filtrer par statut"
          />
        </SearchBar>
        <div style={{ flex: 1, minWidth: 260, maxWidth: 520 }}>
          <ContribuableRecherche
            contribuables={contribuables}
            value={filtreContribuable}
            onChange={(id) => setFiltreContribuable(id || '')}
            placeholder="Filtrer par contribuable..."
          />
        </div>
      </div>

      {loading ? (
        <LoadingBlock message="Chargement des deficits..." />
      ) : (
        <Table
          rowKey="idDeficit"
          size="small"
          columns={colonnes}
          dataSource={listeFiltree}
          scroll={{ x: 980 }}
          pagination={{
            pageSize: 12,
            showSizeChanger: true,
            showTotal: (total) => `${total} resultat(s)`,
          }}
          locale={{
            emptyText: (
              <EmptyState
                titre="Aucun deficit"
                texte="Les deficits sont crees automatiquement lors des declarations deficitaires"
              />
            ),
          }}
        />
      )}

      <Text type="secondary" style={{ fontSize: 12 }}>
        {listeFiltree.length} resultat(s)
      </Text>

      <Modal
        open={!!detail}
        title="Detail du deficit"
        footer={null}
        onCancel={() => setDetail(null)}
        destroyOnHidden
        centered
        width={520}
      >
        {detail && (
          <Descriptions
            column={1}
            size="small"
            items={[
              { key: 'nif', label: 'NIF', children: detail.contribuable?.nif || '-' },
              {
                key: 'rs',
                label: 'Raison sociale',
                children: detail.contribuable?.raisonSociale || '-',
              },
              { key: 'origine', label: "Annee d'origine", children: detail.anneeOrigine },
              { key: 'initial', label: 'Montant initial', children: formatAr(detail.montantInitial) },
              { key: 'utilise', label: 'Montant utilise', children: formatAr(detail.montantUtilise) },
              {
                key: 'solde',
                label: 'Solde disponible',
                children: <Text strong>{formatAr(detail.solde)}</Text>,
              },
              {
                key: 'expiration',
                label: "Annee d'expiration",
                children: detail.anneeExpiration,
              },
              { key: 'statut', label: 'Statut', children: tagStatut(detail.statut) },
            ]}
          />
        )}
      </Modal>
    </div>
  );
}
