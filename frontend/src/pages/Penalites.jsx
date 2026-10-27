import { useEffect, useMemo, useState } from 'react';
import {
  Button,
  Card,
  Col,
  Form,
  Row,
  Select,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  EyeOutlined,
  GiftOutlined,
  PrinterOutlined,
  WarningOutlined,
  FileExcelOutlined,
} from '@ant-design/icons';
import { lister as listerContribuables } from '../services/contribuableService';
import { lister as listerDeclarations } from '../services/declarationService';
import * as service from '../services/penaliteService';
import * as exportService from '../services/exportService';
import ContribuableRecherche from '../components/ContribuableRecherche';
import PenaliteCard from '../components/penalites/PenaliteCard';
import DecompteDetail from '../components/penalites/DecompteDetail';
import RemiseGracieuseModal from '../components/penalites/RemiseGracieuseModal';
import EmptyState from '../components/EmptyState';
import { SkeletonStatsGrid, SkeletonTable } from '../components/Spinner';
import { useToast } from '../context/ToastContext';
import { formatAr, formatDate, STATUT_PENALITE, TYPE_PENALITE } from '../utils/format';

const { Text } = Typography;

const anneeCourante = new Date().getFullYear();

const OPTIONS_STATUT = [
  { value: '', label: 'Tous les statuts' },
  ...Object.entries(STATUT_PENALITE).map(([value, s]) => ({ value, label: s.libelle })),
];

const OPTIONS_TYPE = [
  { value: '', label: 'Tous les types' },
  ...Object.entries(TYPE_PENALITE).map(([value, label]) => ({ value, label })),
];

export default function Penalites() {
  const toast = useToast();
  const [contribuables, setContribuables] = useState([]);
  const [declarations, setDeclarations] = useState([]);
  const [selected, setSelected] = useState('');
  const [annee, setAnnee] = useState(anneeCourante);
  const [situation, setSituation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filtreStatut, setFiltreStatut] = useState('');
  const [filtreType, setFiltreType] = useState('');
  const [remise, setRemise] = useState(null);
  const [expandes, setExpandes] = useState([]);
  const [exportLoading, setExportLoading] = useState(false);

  useEffect(() => {
    listerContribuables().then(setContribuables).catch(() => {});
    listerDeclarations().then(setDeclarations).catch(() => {});
  }, []);

  const recharger = () => {
    if (!selected) return;
    service
      .situation(selected, annee)
      .then((data) => setSituation(data))
      .catch((e) => toast.error(e.response?.data?.message || 'Erreur de chargement'));
  };

  useEffect(() => {
    if (!selected) return;
    service
      .situation(selected, annee)
      .then((data) => setSituation(data))
      .catch((e) => {
        toast.error(e.response?.data?.message || 'Erreur de chargement');
        setSituation(null);
      })
      .finally(() => setLoading(false));
  }, [selected, annee, toast]);

  const onContribuable = (id) => {
    setSelected(id);
    setExpandes([]);
    if (id) {
      setLoading(true);
    } else {
      setLoading(false);
      setSituation(null);
    }
  };

  const onAnnee = (v) => {
    setAnnee(v);
    if (selected) setLoading(true);
  };

  const handleExportExcel = async () => {
    setExportLoading(true);
    try {
      await exportService.exportPenalites();
      toast.success('Export effectue avec succes');
    } catch (e) {
      toast.error(e.response?.data?.message || "Erreur lors de l export");
    } finally {
      setExportLoading(false);
    }
  };

  const regler = async (p) => {
    try {
      await service.changerStatut(p.idPenalite, 'PAYEE');
      toast.success('Penalite reglee');
      recharger();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Erreur');
    }
  };

  const validerRemise = async ({ motif, justificatif }) => {
    try {
      await service.remiseGracieuse(remise.idPenalite, motif, justificatif);
      toast.success('Demande de remise envoyee');
      setRemise(null);
      recharger();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Erreur');
    }
  };

  const basculerDetail = (p) => {
    setExpandes((prev) =>
      prev.includes(p.idPenalite)
        ? prev.filter((k) => k !== p.idPenalite)
        : [...prev, p.idPenalite]
    );
  };

  const optionsAnnee = useMemo(() => {
    const annees = new Set(declarations.map((d) => d.annee).filter(Boolean));
    for (let y = anneeCourante; y >= 2015; y -= 1) annees.add(y);
    return [...annees]
      .sort((a, b) => b - a)
      .map((y) => ({ value: y, label: String(y) }));
  }, [declarations]);

  const listeBase = useMemo(() => situation?.penalites || [], [situation]);
  const penalitesFiltrees = useMemo(
    () =>
      listeBase.filter(
        (p) =>
          (!filtreStatut || p.statut === filtreStatut) &&
          (!filtreType || p.type === filtreType)
      ),
    [listeBase, filtreStatut, filtreType]
  );

  const contribuableSelectionne = contribuables.find(
    (c) => String(c.idContribuable) === String(selected)
  );

  const totalDu = situation?.totalDu || 0;
  const totalPaye = situation?.totalPayees || 0;
  const enAttente = Math.max(totalDu - totalPaye, 0);

  const colonnes = [
    {
      title: 'Contribuable',
      key: 'contribuable',
      render: () =>
        contribuableSelectionne
          ? `${contribuableSelectionne.nif} - ${contribuableSelectionne.raisonSociale}`
          : '-',
    },
    {
      title: 'Declaration / annee',
      key: 'declaration',
      width: 150,
      render: () => (situation?.annee != null ? String(situation.annee) : '-'),
    },
    {
      title: 'Type',
      key: 'type',
      width: 170,
      render: (_, p) => TYPE_PENALITE[p.type] || p.type,
    },
    {
      title: 'Base de calcul',
      key: 'base',
      align: 'right',
      width: 140,
      render: (_, p) => formatAr(p.baseCalculAr),
    },
    {
      title: 'Nb mois',
      key: 'mois',
      width: 90,
      render: (_, p) => (p.nbMois ? `${p.nbMois} mois` : '-'),
    },
    {
      title: 'Taux',
      key: 'taux',
      width: 90,
      render: (_, p) => (p.tauxPct != null ? `${p.tauxPct} %` : '-'),
    },
    {
      title: 'Montant',
      key: 'montant',
      align: 'right',
      width: 140,
      render: (_, p) => <Text strong>{formatAr(p.montantAr)}</Text>,
    },
    {
      title: 'Statut',
      key: 'statut',
      width: 170,
      render: (_, p) => {
        const s = STATUT_PENALITE[p.statut];
        return <Tag color={s ? s.couleur : 'default'}>{s ? s.libelle : p.statut}</Tag>;
      },
    },
    {
      title: 'Date',
      key: 'date',
      width: 110,
      render: (_, p) => formatDate(p.dateLimite || p.dateCreation),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 170,
      render: (_, p) => (
        <Space size={4}>
          <Tooltip title="Voir le decompte">
            <Button
              size="small"
              type={expandes.includes(p.idPenalite) ? 'primary' : 'default'}
              icon={<EyeOutlined />}
              onClick={() => basculerDetail(p)}
            />
          </Tooltip>
          {p.statut === 'DUE' && (
            <>
              <Tooltip title="Demander une remise gracieuse">
                <Button
                  size="small"
                  icon={<GiftOutlined />}
                  onClick={() => setRemise(p)}
                />
              </Tooltip>
              <Tooltip title="Marquer payee">
                <Button
                  size="small"
                  icon={<CheckCircleOutlined />}
                  onClick={() => regler(p)}
                />
              </Tooltip>
            </>
          )}
          <Tooltip title="Imprimer l'avis">
            <Button
              size="small"
              icon={<PrinterOutlined />}
              onClick={() => window.print()}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1 className="page-title">Penalites</h1>
          <p className="page-subtitle">
            Amendes de depot, majorations de retard et infractions specifiques
          </p>
        </div>
        <div>
          <Button
            icon={<FileExcelOutlined />}
            onClick={handleExportExcel}
            loading={exportLoading}
          >
            Exporter Excel
          </Button>
        </div>
      </header>

      <Card size="small">
        <Form layout="vertical">
          <Row gutter={[12, 8]}>
            <Col xs={24} md={9}>
              <Form.Item label="Contribuable" style={{ marginBottom: 0 }}>
                <ContribuableRecherche
                  contribuables={contribuables}
                  value={selected}
                  onChange={onContribuable}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={5}>
              <Form.Item label="Statut" style={{ marginBottom: 0 }}>
                <Select
                  value={filtreStatut}
                  onChange={setFiltreStatut}
                  options={OPTIONS_STATUT}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={6}>
              <Form.Item label="Type de penalite" style={{ marginBottom: 0 }}>
                <Select
                  value={filtreType}
                  onChange={setFiltreType}
                  options={OPTIONS_TYPE}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={4}>
              <Form.Item label="Annee" style={{ marginBottom: 0 }}>
                <Select
                  value={annee}
                  onChange={onAnnee}
                  options={optionsAnnee}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Card>

      {!selected ? (
        <EmptyState
          icone={<WarningOutlined style={{ fontSize: 32, color: '#EA580C' }} />}
          titre="Selectionnez un contribuable"
          texte="Choisissez un contribuable pour afficher ses penalites"
        />
      ) : loading ? (
        <>
          <SkeletonStatsGrid count={3} />
          <SkeletonTable rows={4} cols={8} />
        </>
      ) : (
        <>
          <Row gutter={[16, 16]}>
            <Col xs={12} md={8}>
              <PenaliteCard
                icone={WarningOutlined}
                label="Total du"
                valeur={totalDu}
                suffixe=" Ar"
                tone="ir-du"
              />
            </Col>
            <Col xs={12} md={8}>
              <PenaliteCard
                icone={CheckCircleOutlined}
                label="Total paye"
                valeur={totalPaye}
                suffixe=" Ar"
                tone="encaisse"
              />
            </Col>
            <Col xs={24} md={8}>
              <PenaliteCard
                icone={ClockCircleOutlined}
                label="En attente"
                valeur={enAttente}
                suffixe=" Ar"
                tone="orange"
              />
            </Col>
          </Row>

          <Card
            size="small"
            title="Historique des penalites"
            extra={<span className="muted">{penalitesFiltrees.length} resultat(s)</span>}
          >
            {penalitesFiltrees.length === 0 ? (
              <EmptyState
                titre="Aucune penalite"
                texte="Aucune penalite ne correspond aux filtres selectionnes."
              />
            ) : (
              <Table
                rowKey="idPenalite"
                size="medium"
                columns={colonnes}
                dataSource={penalitesFiltrees}
                pagination={{ pageSize: 10, showSizeChanger: true }}
                locale={{ emptyText: 'Aucune penalite' }}
                expandable={{
                  expandedRowKeys: expandes,
                  onExpandedRowsChange: setExpandes,
                  showExpandColumn: false,
                  expandedRowRender: (p) => <DecompteDetail detail={p} />,
                }}
              />
            )}
          </Card>
        </>
      )}

      <RemiseGracieuseModal
        ouvert={!!remise}
        penalite={remise}
        onFermer={() => setRemise(null)}
        onValider={validerRemise}
      />
    </div>
  );
}
