import { useEffect, useState, useCallback } from 'react';
import {
  Button,
  Card,
  Col,
  InputNumber,
  Progress,
  Row,
  Space,
  Statistic,
  Table,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import {
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ContainerOutlined,
  CreditCardOutlined,
  FileTextOutlined,
  PauseCircleOutlined,
  PlayCircleOutlined,
  PlusOutlined,
  RiseOutlined,
  WarningOutlined,
  FileExcelOutlined,
} from '@ant-design/icons';
import { lister as listerContribuables } from '../services/contribuableService';
import * as service from '../services/acompteService';
import * as exportService from '../services/exportService';
import ContribuableRecherche from '../components/ContribuableRecherche';
import ConfirmDialog from '../components/ConfirmDialog';
import AcompteCard from '../components/acomptes/AcompteCard';
import AcompteDouaneModal from '../components/acomptes/AcompteDouaneModal';
import SimulateurLiquidation from '../components/acomptes/SimulateurLiquidation';
import ChronologiePaiements from '../components/acomptes/ChronologiePaiements';
import { SkeletonStatsGrid, SkeletonTable } from '../components/Spinner';
import EmptyState from '../components/EmptyState';
import { useToast } from '../context/ToastContext';
import { formatAr, formatDate, STATUT_ACOMPTE } from '../utils/format';

const { Text } = Typography;

const anneeCourante = new Date().getFullYear();

const STATUTS_ANNEE = {
  PAYE: { couleur: 'green', libelle: 'Paye' },
  PARTIEL: { couleur: 'orange', libelle: 'Partiel' },
  EN_COURS: { couleur: 'blue', libelle: 'En cours' },
  SUSPENDU: { couleur: 'default', libelle: 'Suspendu' },
};

function celluleAcompte(acompte, montant, datePaiement) {
  const statut = acompte ? acompte.statut : null;
  const info = STATUT_ACOMPTE[statut] || { couleur: 'default', libelle: statut || '-' };
  const valeur = montant != null ? montant : acompte ? acompte.montantAr : null;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Text strong className="mono">
        {formatAr(valeur)}
      </Text>
      <Space size={6} wrap>
        <Tag color={info.couleur}>{info.libelle}</Tag>
        <Text type="secondary" style={{ fontSize: 12 }}>
          {datePaiement ? formatDate(datePaiement) : '-'}
        </Text>
      </Space>
    </div>
  );
}

export default function Acomptes() {
  const toast = useToast();
  const [contribuables, setContribuables] = useState([]);
  const [selected, setSelected] = useState('');
  const [annee, setAnnee] = useState(anneeCourante);
  const [lignes, setLignes] = useState([]);
  const [situation, setSituation] = useState(null);
  const [echeances, setEcheances] = useState(null);
  const [chronologie, setChronologie] = useState([]);
  const [loading, setLoading] = useState(false);
  const [douaneOuvert, setDouaneOuvert] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [exportLoading, setExportLoading] = useState(false);

  useEffect(() => {
    listerContribuables().then(setContribuables).catch(() => {});
  }, []);

  const charger = useCallback(
    async (id, exercice) => {
      if (!id) {
        setLignes([]);
        setSituation(null);
        setEcheances(null);
        setChronologie([]);
        return;
      }
      setLoading(true);
      try {
        const [parAnnee, sit, chrono] = await Promise.all([
          service.situationParAnnee(id),
          service.getSituation(id, exercice).catch(() => null),
          service.getChronologie(id).catch(() => []),
        ]);
        setLignes(Array.isArray(parAnnee) ? parAnnee : []);
        setSituation(sit);
        setChronologie(Array.isArray(chrono) ? chrono : []);
        try {
          setEcheances(await service.getEcheances(id, exercice));
        } catch {
          setEcheances(null);
        }
      } catch (e) {
        toast.error(e.response?.data?.message || 'Erreur de chargement');
        setLignes([]);
        setSituation(null);
      } finally {
        setLoading(false);
      }
    },
    [toast]
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    charger(selected, annee);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, annee]);

  const suspendre = (a) => {
    setConfirm({
      titre: 'Demander la suspension',
      message:
        'La suspension d un acompte provisionnel sans motif valable expose a une amende de 80 % (CDI art. 05.01.06). Confirmer ?',
      texteConfirmer: 'Suspendre',
      danger: true,
      onConfirmer: async () => {
        try {
          await service.suspendre(a.idAcompte);
          toast.success('Acompte suspendu');
          charger(selected, annee);
        } catch (e) {
          toast.error(e.response?.data?.message || 'Erreur');
        }
      },
    });
  };

  const handleExportExcel = async () => {
    setExportLoading(true);
    try {
      await exportService.exportAcomptes();
      toast.success('Export effectue avec succes');
    } catch (e) {
      toast.error(e.response?.data?.message || "Erreur lors de l export");
    } finally {
      setExportLoading(false);
    }
  };

  const reactiver = async (a) => {
    try {
      await service.reactiver(a.idAcompte);
      toast.success('Acompte reactive');
      charger(selected, annee);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Erreur');
    }
  };

  const payer = async (a) => {
    try {
      await service.changerStatut(a.idAcompte, 'PAYE');
      toast.success('Acompte regle');
      charger(selected, annee);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Erreur');
    }
  };

  const enregistrerDouane = async (payload) => {
    try {
      await service.enregistrerDouane({ idContribuable: Number(selected), annee, ...payload });
      toast.success('Quittance de douane enregistree');
      setDouaneOuvert(false);
      charger(selected, annee);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Erreur');
    }
  };

  const rendreActions = (acompte, libelle) => {
    if (!acompte || !acompte.idAcompte) return null;
    const statut = acompte.statut;
    return (
      <Space size={4} wrap>
        <Text type="secondary" style={{ fontSize: 11 }}>
          {libelle}
        </Text>
        {statut !== 'PAYE' && statut !== 'SUSPENDU' && (
          <Tooltip title="Demander la suspension">
            <Button
              size="small"
              icon={<PauseCircleOutlined />}
              aria-label={'Suspendre l acompte ' + libelle}
              onClick={() => suspendre(acompte)}
            />
          </Tooltip>
        )}
        {statut === 'SUSPENDU' && (
          <Tooltip title="Reactiver l acompte">
            <Button
              size="small"
              type="primary"
              ghost
              icon={<PlayCircleOutlined />}
              aria-label={'Reactiver l acompte ' + libelle}
              onClick={() => reactiver(acompte)}
            />
          </Tooltip>
        )}
        {statut !== 'PAYE' && (
          <Tooltip title="Enregistrer le reglement">
            <Button
              size="small"
              type="primary"
              icon={<CheckCircleOutlined />}
              aria-label={'Regler l acompte ' + libelle}
              onClick={() => payer(acompte)}
            />
          </Tooltip>
        )}
      </Space>
    );
  };

  const s = {
    creation: situation?.creation || [],
    provisionnels: situation?.provisionnels || [],
    douane: situation?.douane || [],
    cumulVerse: situation?.cumulVerse || 0,
    irN1: situation?.irN1 || 0,
  };
  const contribuableSelectionne = contribuables.find(
    (c) => String(c.idContribuable) === String(selected)
  );
  const anneeCreation = contribuableSelectionne?.dateImmatriculation
    ? new Date(contribuableSelectionne.dateImmatriculation).getFullYear()
    : null;

  const cumulStatut = (statuts) =>
    lignes.reduce((total, ligne) => {
      const t1 =
        ligne.acompte1 && statuts.includes(ligne.acompte1.statut) ? ligne.montant1 || 0 : 0;
      const t2 =
        ligne.acompte2 && statuts.includes(ligne.acompte2.statut) ? ligne.montant2 || 0 : 0;
      return total + t1 + t2;
    }, 0);

  const totalAttendu = lignes.reduce((total, ligne) => {
    const t1 =
      ligne.acompte1 && ligne.acompte1.statut !== 'SUSPENDU' ? ligne.montant1 || 0 : 0;
    const t2 =
      ligne.acompte2 && ligne.acompte2.statut !== 'SUSPENDU' ? ligne.montant2 || 0 : 0;
    return total + t1 + t2;
  }, 0);
  const totalPaye = cumulStatut(['PAYE']);
  const totalRetard = cumulStatut(['EN_RETARD']);
  const resteAPayer = Math.max(totalAttendu - totalPaye, 0);
  const progression =
    totalAttendu > 0 ? Math.min(100, Math.round((totalPaye / totalAttendu) * 100)) : 0;

  const ligneExercice =
    lignes.find((ligne) => Number(ligne.annee) === Number(annee)) || null;
  const cartesExercice = ligneExercice
    ? [
        ligneExercice.acompte1
          ? {
              ...ligneExercice.acompte1,
              numero: 1,
              annee: ligneExercice.annee,
              montantAr: ligneExercice.acompte1.montantAr ?? ligneExercice.montant1,
              baseIrN1: ligneExercice.acompte1.baseIrN1 ?? ligneExercice.baseIrN1,
            }
          : null,
        ligneExercice.acompte2
          ? {
              ...ligneExercice.acompte2,
              numero: 2,
              annee: ligneExercice.annee,
              montantAr: ligneExercice.acompte2.montantAr ?? ligneExercice.montant2,
              baseIrN1: ligneExercice.acompte2.baseIrN1 ?? ligneExercice.baseIrN1,
            }
          : null,
      ].filter(Boolean)
    : [];
  const cartesAffichees = cartesExercice.length > 0 ? cartesExercice : s.provisionnels;
  const echeance15Mai = echeances?.eligible ? echeances.echeance15Mai : null;

  const totalDouane = s.douane.reduce((total, acompte) => total + (acompte.montantAr || 0), 0);

  const colonnes = [
    {
      title: 'Annee',
      dataIndex: 'annee',
      key: 'annee',
      width: 90,
      render: (v) => <Text strong>{v}</Text>,
    },
    {
      title: 'Base IR N-1',
      dataIndex: 'baseIrN1',
      key: 'baseIrN1',
      width: 150,
      align: 'right',
      render: (v) => <span className="mono">{formatAr(v)}</span>,
    },
    {
      title: 'Acompte 1 - 15 mai',
      key: 'acompte1',
      render: (_, ligne) => celluleAcompte(ligne.acompte1, ligne.montant1, ligne.date1),
    },
    {
      title: 'Acompte 2 - 15 novembre',
      key: 'acompte2',
      render: (_, ligne) => celluleAcompte(ligne.acompte2, ligne.montant2, ligne.date2),
    },
    {
      title: 'Statut',
      dataIndex: 'statut',
      key: 'statut',
      width: 120,
      render: (statut) => (
        <Tag color={STATUTS_ANNEE[statut]?.couleur || 'default'}>
          {STATUTS_ANNEE[statut]?.libelle || statut || '-'}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 260,
      render: (_, ligne) => (
        <Space size={10} wrap>
          {rendreActions(ligne.acompte1, 'A1')}
          {rendreActions(ligne.acompte2, 'A2')}
        </Space>
      ),
    },
  ];

  const colonnesDouane = [
    {
      title: 'Date',
      dataIndex: 'dateEcheance',
      key: 'date',
      render: (v) => formatDate(v),
    },
    {
      title: 'Reference douane',
      dataIndex: 'referenceDouane',
      key: 'reference',
      render: (v) => v || '-',
    },
    {
      title: 'Valeur CAF',
      dataIndex: 'baseIrN1',
      key: 'caf',
      align: 'right',
      render: (v) => formatAr(v),
    },
    {
      title: 'Taux',
      dataIndex: 'tauxPct',
      key: 'taux',
      align: 'right',
      render: (v) => (v != null ? v + ' %' : '-'),
    },
    {
      title: 'Montant',
      dataIndex: 'montantAr',
      key: 'montant',
      align: 'right',
      render: (v) => <Text strong>{formatAr(v)}</Text>,
    },
    {
      title: 'Statut',
      dataIndex: 'statut',
      key: 'statut',
      render: (statut) => (
        <Tag color={STATUT_ACOMPTE[statut]?.couleur || 'default'}>
          {STATUT_ACOMPTE[statut]?.libelle || statut || '-'}
        </Tag>
      ),
    },
  ];

  const colonnesCreation = [
    { title: 'Annee', dataIndex: 'annee', key: 'annee', width: 100 },
    {
      title: "Date d'echeance",
      dataIndex: 'dateEcheance',
      key: 'dateEcheance',
      render: (v) => formatDate(v),
    },
    {
      title: 'Montant',
      dataIndex: 'montantAr',
      key: 'montant',
      align: 'right',
      render: (v) => <Text strong>{formatAr(v)}</Text>,
    },
    {
      title: 'Statut',
      dataIndex: 'statut',
      key: 'statut',
      render: (statut) => (
        <Tag color={STATUT_ACOMPTE[statut]?.couleur || 'default'}>
          {STATUT_ACOMPTE[statut]?.libelle || statut || '-'}
        </Tag>
      ),
    },
  ];

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Acomptes</h1>
          <p className="page-subtitle">
            Exercice {annee} - Deux acomptes de 50 % de l IR N-1 (15 mai et 15 novembre)
          </p>
        </div>
        <Space wrap size={12}>
          <div style={{ width: 320, maxWidth: '100%' }}>
            <ContribuableRecherche
              contribuables={contribuables}
              value={selected}
              onChange={(id) => setSelected(id)}
            />
          </div>
          <InputNumber
            min={2000}
            max={2100}
            value={annee}
            onChange={(v) => setAnnee(v || anneeCourante)}
            addonBefore="Exercice"
            aria-label="Exercice"
            style={{ width: 180 }}
          />
          <Button
            icon={<FileExcelOutlined />}
            onClick={handleExportExcel}
            loading={exportLoading}
          >
            Exporter Excel
          </Button>
        </Space>
      </div>

      {!selected ? (
        <EmptyState
          titre="Selectionnez un contribuable"
          texte="Choisissez un contribuable pour consulter ses echeances et paiements."
        />
      ) : loading ? (
        <div aria-live="polite">
          <SkeletonStatsGrid count={4} />
          <SkeletonTable rows={5} cols={6} />
        </div>
      ) : (
        <>
          <Row gutter={[16, 16]}>
            <Col xs={12} md={6}>
              <Card>
                <Statistic
                  title="Total a payer"
                  value={totalAttendu}
                  precision={0}
                  suffix="Ar"
                  prefix={<FileTextOutlined style={{ color: '#0369A1' }} />}
                />
              </Card>
            </Col>
            <Col xs={12} md={6}>
              <Card>
                <Statistic
                  title="Total paye"
                  value={totalPaye}
                  precision={0}
                  suffix="Ar"
                  prefix={<CheckCircleOutlined style={{ color: '#16A34A' }} />}
                  valueStyle={{ color: '#16A34A' }}
                />
                <Progress
                  percent={progression}
                  size="small"
                  showInfo={false}
                  strokeColor="#0E7A55"
                  style={{ marginTop: 4 }}
                />
              </Card>
            </Col>
            <Col xs={12} md={6}>
              <Card>
                <Statistic
                  title="En retard"
                  value={totalRetard}
                  precision={0}
                  suffix="Ar"
                  prefix={<WarningOutlined style={{ color: '#DC2626' }} />}
                  valueStyle={{ color: '#DC2626' }}
                />
              </Card>
            </Col>
            <Col xs={12} md={6}>
              <Card>
                <Statistic
                  title="Reste a payer"
                  value={resteAPayer}
                  precision={0}
                  suffix="Ar"
                  prefix={<CreditCardOutlined style={{ color: '#EA580C' }} />}
                  valueStyle={{ color: '#EA580C' }}
                />
              </Card>
            </Col>
          </Row>

          <Card
            title={
              <span>
                <CalendarOutlined style={{ color: '#0E7A55', marginRight: 8 }} />
                Situation par annee
              </span>
            }
            extra={<Text type="secondary">{lignes.length} exercice(s)</Text>}
          >
            <Table
              rowKey="annee"
              size="small"
              columns={colonnes}
              dataSource={lignes}
              scroll={{ x: 960 }}
              pagination={{
                pageSize: 10,
                showSizeChanger: false,
                showTotal: (total) => `${total} exercice(s)`,
              }}
              locale={{
                emptyText: (
                  <EmptyState
                    titre="Aucun acompte enregistre"
                    texte="Les acomptes provisionnels sont generes apres validation d une declaration IR N-1."
                  />
                ),
              }}
            />
          </Card>

          <Card
            title={
              <span>
                <CalendarOutlined style={{ color: '#0369A1', marginRight: 8 }} />
                Acomptes provisionnels - exercice {annee}
              </span>
            }
            extra={<Tag color="blue">{cartesAffichees.length} acompte(s)</Tag>}
          >
            {cartesAffichees.length === 0 ? (
              <EmptyState
                titre="Aucun acompte provisionnel"
                texte={
                  echeances?.message ||
                  'Les acomptes sont generes apres validation d une declaration IR N-1.'
                }
              />
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                  gap: 16,
                }}
              >
                {cartesAffichees.map((acompte) => (
                  <AcompteCard
                    key={acompte.idAcompte || 'acompte-' + acompte.numero}
                    acompte={acompte}
                    echeancesDetail={acompte.numero === 1 ? echeance15Mai : null}
                    onSuspendre={suspendre}
                    onReactiver={reactiver}
                    onPayer={payer}
                  />
                ))}
              </div>
            )}
          </Card>

          {s.creation.length > 0 && (
            <Card
              title={
                <span>
                  <FileTextOutlined style={{ color: '#7C3AED', marginRight: 8 }} />
                  Acomptes de creation
                </span>
              }
              extra={<Text type="secondary">{s.creation.length} acompte(s)</Text>}
            >
              <Table
                rowKey="idAcompte"
                size="small"
                columns={colonnesCreation}
                dataSource={s.creation}
                pagination={false}
                scroll={{ x: 640 }}
              />
            </Card>
          )}

          <Card
            title={
              <span>
                <ContainerOutlined style={{ color: '#EA580C', marginRight: 8 }} />
                Acomptes douaniers - AIRS 2 %
              </span>
            }
            extra={
              <Space wrap size={12}>
                <Text type="secondary">
                  Total encaisse : <Text strong>{formatAr(totalDouane)}</Text>
                </Text>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => setDouaneOuvert(true)}
                >
                  Enregistrer une quittance
                </Button>
              </Space>
            }
          >
            {s.douane.length > 0 ? (
              <Table
                rowKey="idAcompte"
                size="small"
                columns={colonnesDouane}
                dataSource={s.douane}
                pagination={false}
                scroll={{ x: 780 }}
              />
            ) : (
              <EmptyState
                titre="Aucune quittance de douane"
                texte={`Aucune quittance enregistree pour l exercice ${annee}.`}
              />
            )}
          </Card>

          <Card
            title={
              <span>
                <RiseOutlined style={{ color: '#0E7A55', marginRight: 8 }} />
                Simulateur d&apos;atterrissage fiscal
              </span>
            }
          >
            <SimulateurLiquidation cumulAcomptes={s.cumulVerse || 0} />
          </Card>

          <Card
            title={
              <span>
                <ClockCircleOutlined style={{ color: '#F59E0B', marginRight: 8 }} />
                Chronologie des paiements
              </span>
            }
            extra={<Text type="secondary">{chronologie.length} exercice(s)</Text>}
          >
            <ChronologiePaiements
              anneeCreation={anneeCreation}
              annee={annee}
              irN1={s.irN1 || 0}
              acomptesVerses={s.cumulVerse || 0}
              chronologie={chronologie}
            />
          </Card>
        </>
      )}

      <AcompteDouaneModal
        ouvert={douaneOuvert}
        onFermer={() => setDouaneOuvert(false)}
        onValider={enregistrerDouane}
      />

      <ConfirmDialog
        ouvert={!!confirm}
        titre={confirm ? confirm.titre : ''}
        message={confirm ? confirm.message : ''}
        texteConfirmer={confirm ? confirm.texteConfirmer : 'Confirmer'}
        danger={confirm ? !!confirm.danger : false}
        onConfirmer={() => {
          if (confirm && confirm.onConfirmer) confirm.onConfirmer();
          setConfirm(null);
        }}
        onAnnuler={() => setConfirm(null)}
      />
    </div>
  );
}
