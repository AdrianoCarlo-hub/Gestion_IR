import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Tag, Button, Select, Space, Alert, Typography } from 'antd';
import {
  PlusOutlined,
  EyeOutlined,
  EditOutlined,
  SwapOutlined,
  FileExcelOutlined,
} from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import ContribuableForm from '../components/ContribuableForm';
import StatutModal from '../components/StatutModal';
import SearchBar from '../components/SearchBar';
import { SkeletonTable } from '../components/Spinner';
import { useToast } from '../context/ToastContext';
import * as service from '../services/contribuableService';
import * as exportService from '../services/exportService';
import * as statutService from '../services/statutService';

const { Text } = Typography;

const STATUTS_CONTRIBUABLE = [
  { value: 'ACTIF', label: 'Actif', couleur: '#10b981' },
  { value: 'SUSPENDU', label: 'Suspendu', couleur: '#f59e0b' },
  { value: 'CESSE', label: 'Cesse', couleur: '#64748b' },
  { value: 'RADIE', label: 'Radie', couleur: '#dc2626' },
];

const COULEUR_STATUT = {
  ACTIF: 'green',
  SUSPENDU: 'orange',
  CESSE: 'red',
  RADIE: 'red',
};

const OPTIONS_STATUT = STATUTS_CONTRIBUABLE.map((s) => ({ value: s.value, label: s.label }));

export default function Contribuables() {
  const { agent } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [liste, setListe] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [motCle, setMotCle] = useState('');
  const [statut, setStatut] = useState('');
  const [mode, setMode] = useState('liste');
  const [enEdition, setEnEdition] = useState(null);
  const [statutModal, setStatutModal] = useState(null);
  const [exportLoading, setExportLoading] = useState(false);

  const charger = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await service.lister({ motCle, statut });
      setListe(data);
    } catch (e) {
      setError(e.response?.data?.message || 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  const chargerAvec = async (mc, st) => {
    setLoading(true);
    setError('');
    try {
      const data = await service.lister({ motCle: mc, statut: st });
      setListe(data);
    } catch (e) {
      setError(e.response?.data?.message || 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    charger();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleNouveau = () => {
    setEnEdition(null);
    setMode('form');
  };

  const handleEditer = async (id) => {
    try {
      const c = await service.trouver(id);
      setEnEdition({ ...c, idSecteur: c.secteur?.idSecteur || '' });
      setMode('form');
    } catch (e) {
      setError(e.response?.data?.message || 'Erreur');
    }
  };

  const handleExportExcel = async () => {
    setExportLoading(true);
    try {
      await exportService.exportContribuables();
      toast.success('Export effectue avec succes');
    } catch (e) {
      toast.error(e.response?.data?.message || "Erreur lors de l export");
    } finally {
      setExportLoading(false);
    }
  };


  const handleSubmit = async (payload) => {
    try {
      setError('');
      if (enEdition) {
        await service.modifier(enEdition.idContribuable, payload);
        toast.success('Contribuable modifie avec succes');
        setMode('liste');
        charger();
        return;
      }
      await service.creer({
        ...payload,
        centre: { idCentre: 1 },
        agent: { idAgent: agent?.idAgent || 3 },
      });
      toast.success('Contribuable cree avec succes');
      setMode('liste');
      charger();
    } catch (e) {
      const msg = e.response?.data?.message || 'Erreur';
      setError(msg);
      throw e;
    }
  };

  const handleChangerStatut = async (nouveauStatut) => {
    try {
      await statutService.changerStatutContribuable(statutModal.id, nouveauStatut);
      toast.success('Statut change : ' + nouveauStatut);
      charger();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Erreur');
    }
  };

  const colonnes = [
    {
      title: 'NIF',
      dataIndex: 'nif',
      key: 'nif',
      render: (v) => <Text strong>{v}</Text>,
    },
    { title: 'Raison sociale', dataIndex: 'raisonSociale', key: 'raisonSociale' },
    { title: 'Dirigeant', dataIndex: 'nomDirigeant', key: 'nomDirigeant' },
    {
      title: 'Secteur',
      key: 'secteur',
      render: (_, c) => (c.secteur?.libelle || '-'),
    },
    {
      title: 'Regime',
      key: 'regime',
      render: () => <Tag color="blue">Reel obligatoire</Tag>,
    },
    {
      title: 'Statut',
      dataIndex: 'statut',
      key: 'statut',
      render: (v) => <Tag color={COULEUR_STATUT[v] || 'default'}>{v}</Tag>,
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 260,
      render: (_, c) => (
        <Space size={0} wrap>
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => navigate('/contribuables/' + c.idContribuable)}
          >
            Fiche
          </Button>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEditer(c.idContribuable)}
          >
            Modifier
          </Button>
          <Button
            type="link"
            size="small"
            icon={<SwapOutlined />}
            onClick={() =>
              setStatutModal({
                id: c.idContribuable,
                statutActuel: c.statut,
                nom: c.raisonSociale,
              })
            }
          >
            Statut
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Contribuables</h1>
          <p className="page-subtitle">Gestion des contribuables soumis a l IR</p>
        </div>
          <Button
            icon={<FileExcelOutlined />}
            onClick={handleExportExcel}
            loading={exportLoading}
          >
            Exporter Excel
          </Button>
      </div>

      {error && <Alert type="error" showIcon message={error} style={{ marginBottom: 16 }} />}

      {mode === 'liste' && (
        <>
          <SearchBar
            value={motCle}
            onChange={(v) => {
              setMotCle(v);
              chargerAvec(v, statut);
            }}
            placeholder="Recherche (NIF, nom, STAT, telephone)"
          >
            <Select
              style={{ minWidth: 170 }}
              value={statut || undefined}
              placeholder="Tous statuts"
              allowClear
              onChange={(v) => {
                const st = v || '';
                setStatut(st);
                chargerAvec(motCle, st);
              }}
              options={OPTIONS_STATUT}
            />
            <Button type="primary" icon={<PlusOutlined />} onClick={handleNouveau}>
              Nouveau contribuable
            </Button>
          </SearchBar>

          {loading ? (
            <SkeletonTable rows={5} cols={7} />
          ) : (
            <Table
              rowKey="idContribuable"
              columns={colonnes}
              dataSource={liste}
              scroll={{ x: 900 }}
              pagination={{
                pageSize: 10,
                showSizeChanger: false,
                showTotal: (total) => total + ' resultat(s)',
              }}
              locale={{ emptyText: 'Aucun contribuable' }}
            />
          )}
        </>
      )}

      {mode === 'form' && (
        <ContribuableForm
          initial={enEdition}
          onSubmit={handleSubmit}
          onCancel={() => {
            setMode('liste');
            setEnEdition(null);
          }}
        />
      )}

      <StatutModal
        ouvert={!!statutModal}
        titre={statutModal ? 'Changer le statut - ' + statutModal.nom : ''}
        statutActuel={statutModal ? statutModal.statutActuel : ''}
        options={STATUTS_CONTRIBUABLE}
        onChoisir={handleChangerStatut}
        onFermer={() => setStatutModal(null)}
      />
    </div>
  );
}
