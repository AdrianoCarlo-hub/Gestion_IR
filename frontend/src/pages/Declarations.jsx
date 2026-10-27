import { useEffect, useState } from 'react';
import { Button, InputNumber, Select, Space, Table, Tag, Typography } from 'antd';
import { PlusOutlined, FileExcelOutlined, ReloadOutlined, ExportOutlined } from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import SearchBar from '../components/SearchBar';
import { lister as listerContribuables } from '../services/contribuableService';
import * as service from '../services/declarationService';
import * as exportService from '../services/exportService';
import DeclarationForm from './DeclarationForm';
import ContribuableRecherche from '../components/ContribuableRecherche';
import { formatAr, STATUT_DECLARATION } from '../utils/format';

const { Text } = Typography;
const anneeCourante = new Date().getFullYear();
const SEUIL_REEL_OBLIGATOIRE = 400000000;

const normaliserRecherche = (valeur) =>
  String(valeur ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

export default function Declarations() {
  const { agent } = useAuth();
  const toast = useToast();
  const [liste, setListe] = useState([]);
  const [contribuables, setContribuables] = useState([]);
  const [recherche, setRecherche] = useState('');
  const [filtreStatut, setFiltreStatut] = useState('TOUS');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState('liste');
  const [idEnEdition, setIdEnEdition] = useState(null);
  const [nouveauContribuable, setNouveauContribuable] = useState('');
  const [nouvelleAnnee, setNouvelleAnnee] = useState(anneeCourante);
  const [exporting, setExporting] = useState(false);

  const charger = async () => {
    setLoading(true);
    try {
      const data = await service.lister();
      setListe(data);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    charger();
    listerContribuables().then(setContribuables).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleNouvelle = () => {
    if (contribuables.length === 0) {
      toast.warning('Aucun contribuable disponible. Creez-en un d abord.');
      return;
    }
    setNouveauContribuable(String(contribuables[0].idContribuable));
    setNouvelleAnnee(anneeCourante);
    setMode('nouveau');
  };

  const contribuableSelectionne = contribuables.find(
    (c) => String(c.idContribuable) === String(nouveauContribuable)
  );

  const erreurAnnee = (() => {
    if (!contribuableSelectionne) return null;
    const anneeImm = contribuableSelectionne.dateImmatriculation
      ? new Date(contribuableSelectionne.dateImmatriculation).getFullYear()
      : null;
    if (anneeImm && Number(nouvelleAnnee) < anneeImm) {
      return 'L annee doit etre >= a l annee d immatriculation (' + anneeImm + ')';
    }
    if (Number(nouvelleAnnee) > anneeCourante) {
      return 'L annee ne peut pas etre dans le futur (max ' + anneeCourante + ')';
    }
    return null;
  })();

  const handleCreerDeclaration = async () => {
    if (!nouveauContribuable) {
      toast.error('Contribuable obligatoire');
      return;
    }
    if (erreurAnnee) {
      toast.error(erreurAnnee);
      return;
    }
    try {
      const payload = {
        idContribuable: Number(nouveauContribuable),
        annee: Number(nouvelleAnnee),
        dateDebut: nouvelleAnnee + '-01-01',
        dateFin: nouvelleAnnee + '-12-31',
        idAgent: agent?.idAgent || 3,
      };
      const d = await service.creer(payload);
      setIdEnEdition(d.idDeclaration);
      setMode('editer');
      toast.success('Declaration creee (brouillon)');
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Erreur');
    }
  };

  const handleOuvrir = (id) => {
    setIdEnEdition(id);
    setMode('editer');
  };

  const handleRetour = () => {
    setMode('liste');
    setIdEnEdition(null);
    charger();
  };

  const handleExporter = async () => {
    setExporting(true);
    try {
      await exportService.exportDeclarations();
      toast.success('Export Excel lance');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Erreur d export');
    } finally {
      setExporting(false);
    }
  };

  const termeRecherche = normaliserRecherche(recherche.trim());
  const listeFiltree = liste.filter((d) => {
    if (filtreStatut !== 'TOUS' && d.statut !== filtreStatut) return false;
    if (!termeRecherche) return true;
    const champs = [
      d.contribuable?.nif ?? '-',
      d.contribuable?.raisonSociale ?? '-',
      d.annee,
      formatAr(d.irDu),
      formatAr(d.soldeAPayer),
      d.statut,
    ];
    return champs.some((champ) => normaliserRecherche(champ).includes(termeRecherche));
  });

  const colonnes = [
    {
      title: 'Contribuable',
      key: 'contribuable',
      render: (_, d) => (
        <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.25 }}>
          <Text strong>{d.contribuable?.raisonSociale || '-'}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            NIF : {d.contribuable?.nif || '-'}
          </Text>
        </span>
      ),
    },
    { title: 'Annee', dataIndex: 'annee', width: 90, align: 'center' },
    { title: 'CA HT', dataIndex: 'caHt', width: 150, align: 'right', render: formatAr },
    { title: 'IR du', dataIndex: 'irDu', width: 150, align: 'right', render: formatAr },
    {
      title: 'Solde a payer',
      dataIndex: 'soldeAPayer',
      width: 160,
      align: 'right',
      render: (v) => <Text type={v > 0 ? 'danger' : 'secondary'}>{formatAr(v)}</Text>,
    },
    {
      title: 'Statut',
      dataIndex: 'statut',
      width: 130,
      align: 'center',
      render: (s) => {
        const def = STATUT_DECLARATION[s] || { couleur: 'default', libelle: s };
        return <Tag color={def.couleur}>{def.libelle}</Tag>;
      },
    },
    {
      title: 'Actions',
      width: 110,
      align: 'center',
      render: (_, d) => (
        <Button type="link" size="small" onClick={() => handleOuvrir(d.idDeclaration)}>
          <ExportOutlined /> Ouvrir
        </Button>
      ),
    },
  ];

  if (mode === 'editer' && idEnEdition) {
    return (
      <div className="page">
        <DeclarationForm idDeclaration={idEnEdition} onRetour={handleRetour} />
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Declarations IR</h1>
          <p className="page-subtitle">
            Declaration annuelle avec calcul automatique de l impot
          </p>
        </div>
        <Space>
          <Button icon={<FileExcelOutlined />} loading={exporting} onClick={handleExporter}>
            Exporter Excel
          </Button>
          <Button icon={<ReloadOutlined />} onClick={charger} loading={loading}>
            Actualiser
          </Button>
        </Space>
      </div>

      {mode === 'nouveau' && (
        <div style={{ marginBottom: 16 }}>
          <div className="toolbar">
            <ContribuableRecherche
              contribuables={contribuables}
              value={nouveauContribuable}
              onChange={(id) => setNouveauContribuable(id)}
            />
            <InputNumber
              min={2000}
              max={anneeCourante}
              value={nouvelleAnnee}
              onChange={(v) => setNouvelleAnnee(v ?? anneeCourante)}
              addonAfter="Annee"
              style={{ width: 160 }}
              status={erreurAnnee ? 'error' : undefined}
            />
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleCreerDeclaration}
              disabled={!nouveauContribuable || !!erreurAnnee}
            >
              Creer la declaration
            </Button>
            <Button onClick={() => setMode('liste')}>Annuler</Button>
          </div>
          {erreurAnnee && (
            <Text type="danger" style={{ display: 'block', marginBottom: 8 }}>
              {erreurAnnee}
            </Text>
          )}
          {contribuableSelectionne && (
            <Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>
              Regime : REEL OBLIGATOIRE — le CA HT devra etre superieur ou egal a{' '}
              {formatAr(SEUIL_REEL_OBLIGATOIRE)} — Immatriculation :{' '}
              {contribuableSelectionne.dateImmatriculation || '-'}
            </Text>
          )}
        </div>
      )}

      <div className="toolbar" style={{ marginBottom: 16 }}>
        <SearchBar
          value={recherche}
          onChange={setRecherche}
          placeholder="Rechercher par NIF, contribuable, annee, montant, statut..."
        />
        <Select
          value={filtreStatut}
          onChange={setFiltreStatut}
          style={{ width: 190 }}
          options={[
            { value: 'TOUS', label: 'Tous les statuts' },
            ...Object.entries(STATUT_DECLARATION).map(([k, v]) => ({
              value: k,
              label: v.libelle,
            })),
          ]}
        />
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleNouvelle}
          disabled={mode === 'nouveau'}
        >
          Nouvelle declaration
        </Button>
      </div>

      <div style={{ background: '#fff', padding: 16, borderRadius: 8 }}>
        <Table
          rowKey="idDeclaration"
          columns={colonnes}
          dataSource={listeFiltree}
          loading={loading}
          pagination={{
            pageSize: 15,
            showSizeChanger: false,
            showTotal: (t) => `${t} resultat(s)`,
          }}
          size="middle"
        />
      </div>
    </div>
  );
}
