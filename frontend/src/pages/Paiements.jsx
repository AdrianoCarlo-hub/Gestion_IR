import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Col,
  DatePicker,
  Form,
  Input,
  Modal,
  Row,
  Segmented,
  Select,
  Space,
  Statistic,
  Steps,
  Table,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import {
  ArrowLeftOutlined,
  ArrowRightOutlined,
  CheckOutlined,
  CloseCircleOutlined,
  CloseOutlined,
  CreditCardOutlined,
  DeleteOutlined,
  DownloadOutlined,
  PlusOutlined,
  PrinterOutlined,
  UserOutlined,
  WalletOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useAuth } from '../context/AuthContext';
import SearchBar from '../components/SearchBar';
import ContribuableRecherche from '../components/ContribuableRecherche';
import ConfirmDialog from '../components/ConfirmDialog';
import EmptyState from '../components/EmptyState';
import { LoadingBlock, SkeletonTable } from '../components/Spinner';
import { useToast } from '../context/ToastContext';
import { lister as listerContribuables } from '../services/contribuableService';
import { lister as listerDeclarations } from '../services/declarationService';
import * as service from '../services/paiementService';
import * as exportService from '../services/exportService';
import { formatAr, formatDate } from '../utils/format';

const { Text } = Typography;

const MODES = [
  { value: 'VIREMENT', label: 'Virement' },
  { value: 'CHEQUE', label: 'Cheque' },
  { value: 'ESPECES', label: 'Especes' },
  { value: 'MOBILE_MONEY', label: 'Mobile Money' },
];

const ETAPES = [
  { title: 'Reglement', content: 'Contribuable et type' },
  { title: 'Paiement', content: 'Date et mode' },
  { title: 'Confirmation', content: 'Recapitulatif' },
];

const libelleReglement = (v) => (v === '2EME_ACOMPTE' ? '2e acompte' : 'Solde total (TOUS)');

const couleurReglement = (v) => (v === '2EME_ACOMPTE' ? 'orange' : 'blue');

function lignesRecap(r) {
  if (r.typeReglement === '2EME_ACOMPTE') {
    return [
      { label: `Acompte 2 (50 % de l'IR ${r.annee})`, valeur: formatAr(r.acompte2) },
      { label: 'Interets de retard (1 %/mois commence)', valeur: formatAr(r.interetRetard) },
      { label: 'Echeance', valeur: formatDate(r.echeance) },
      { label: 'Total a payer', valeur: formatAr(r.total), total: true },
    ];
  }
  const lignes = [
    { label: 'IR du', valeur: formatAr(r.irDu) },
    { label: 'Penalites dues', valeur: formatAr(r.penalites) },
    { label: `1er acompte ${r.annee + 1} (50 % de l'IR)`, valeur: formatAr(r.premierAcompte) },
    { label: 'Acomptes verses (deduction)', valeur: `- ${formatAr(r.acomptesVerses)}`, deduction: true },
    { label: 'Total a payer', valeur: formatAr(r.total), total: true },
  ];
  if (r.credit > 0) {
    lignes.push({ label: "Credit d'impot", valeur: formatAr(r.credit) });
  }
  return lignes;
}

export default function Paiements() {
  const { agent } = useAuth();
  const toast = useToast();

  const [liste, setListe] = useState([]);
  const [contribuables, setContribuables] = useState([]);
  const [declarations, setDeclarations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erreur, setErreur] = useState('');
  const [recherche, setRecherche] = useState('');
  const [idContribuable, setIdContribuable] = useState('');
  const [confirm, setConfirm] = useState(null);
  const [annulation, setAnnulation] = useState(null);
  const [dernierPaiement, setDernierPaiement] = useState(null);
  const [quittanceLoading, setQuittanceLoading] = useState(false);

  const [wizard, setWizard] = useState(false);
  const [etape, setEtape] = useState(0);
  const [typeReglement, setTypeReglement] = useState('TOUS');
  const [idDeclaration, setIdDeclaration] = useState('');
  const [datePaiement, setDatePaiement] = useState(() => dayjs());
  const [mode, setMode] = useState('VIREMENT');
  const [recap, setRecap] = useState(null);
  const [recapErreur, setRecapErreur] = useState('');
  const [erreurWizard, setErreurWizard] = useState('');
  const [enCours, setEnCours] = useState(false);

  const recharger = () => {
    service
      .lister()
      .then((data) => setListe(data))
      .catch((e) => setErreur(e.response?.data?.message || 'Erreur'));
  };

  useEffect(() => {
    listerContribuables().then(setContribuables).catch(() => {});
    listerDeclarations().then(setDeclarations).catch(() => {});
    service
      .lister()
      .then((data) => setListe(data))
      .catch((e) => setErreur(e.response?.data?.message || 'Erreur'))
      .finally(() => setLoading(false));
  }, []);

  const listeFiltree = useMemo(() => {
    const r = recherche.trim().toLowerCase();
    return liste.filter((p) => {
      if (idContribuable && String(p.contribuable?.idContribuable) !== String(idContribuable)) {
        return false;
      }
      if (!r) return true;
      return (
        (p.referenceQuittance || '').toLowerCase().includes(r) ||
        (p.contribuable?.raisonSociale || '').toLowerCase().includes(r) ||
        (p.contribuable?.nif || '').includes(r)
      );
    });
  }, [liste, recherche, idContribuable]);

  const declarationsDuContribuable = useMemo(
    () =>
      declarations.filter(
        (d) => String(d.contribuable?.idContribuable) === String(idContribuable)
      ),
    [declarations, idContribuable]
  );

  const optionsDeclarations = declarationsDuContribuable.map((d) => ({
    value: String(d.idDeclaration),
    label: `${d.annee} - IR ${formatAr(d.irDu)} - solde ${formatAr(d.soldeAPayer)} (${
      d.statut || '-'
    })`,
  }));

  useEffect(() => {
    if (!wizard || etape !== 2 || !idDeclaration) return undefined;
    let ignore = false;
    service
      .recap(Number(idDeclaration), typeReglement, datePaiement.format('YYYY-MM-DD'))
      .then((data) => {
        if (!ignore) setRecap(data);
      })
      .catch((e) => {
        if (ignore) return;
        setRecap(null);
        setRecapErreur(
          e.response?.data?.message || 'Erreur lors du chargement du recapitulatif'
        );
      });
    return () => {
      ignore = true;
    };
  }, [wizard, etape, idDeclaration, typeReglement, datePaiement]);

  const ouvrirWizard = () => {
    setEtape(0);
    setTypeReglement('TOUS');
    setIdDeclaration('');
    setDatePaiement(dayjs());
    setMode('VIREMENT');
    setRecap(null);
    setRecapErreur('');
    setErreurWizard('');
    setWizard(true);
  };

  const fermerWizard = () => {
    setWizard(false);
    setRecap(null);
    setRecapErreur('');
    setErreurWizard('');
  };

  const allerEtape = (n) => {
    setEtape(n);
    setRecap(null);
    setRecapErreur('');
    setErreurWizard('');
  };

  const peutSuivant = etape === 0 ? !!idContribuable && !!idDeclaration : !!datePaiement && !!mode;

  const confirmer = async () => {
    setEnCours(true);
    setErreurWizard('');
    try {
      const paiement = await service.enregistrer({
        idContribuable: Number(idContribuable),
        idDeclaration: Number(idDeclaration),
        typeReglement,
        datePaiement: datePaiement.format('YYYY-MM-DD'),
        mode,
        idAgent: agent ? agent.idAgent : 3,
      });
      if (paiement && paiement.idPaiement) {
        setDernierPaiement(paiement);
      }
      toast.success('Paiement enregistre');
      fermerWizard();
      recharger();
      listerDeclarations().then(setDeclarations).catch(() => {});
    } catch (e) {
      const message = e.response?.data?.message || 'Erreur';
      toast.error(message);
      setErreurWizard(message);
    } finally {
      setEnCours(false);
    }
  };

  const handleImprimerQuittance = async (id) => {
    if (!id) {
      toast.error("Impossible de retrouver la quittance");
      return;
    }
    setQuittanceLoading(true);
    try {
      await exportService.exportQuittancePdf(id);
      toast.success('Quittance telechargee');
    } catch (e) {
      toast.error(e.response?.data?.message || "Erreur lors du telechargement");
    } finally {
      setQuittanceLoading(false);
    }
  };

  const demanderAnnulation = (p) =>
    setAnnulation({ id: p.idPaiement, reference: p.referenceQuittance, motif: '' });

  const validerAnnulation = () => {
    if (!annulation || !annulation.motif.trim()) return;
    const { id, motif, reference } = annulation;
    setAnnulation(null);
    setConfirm({
      titre: 'Annuler le paiement',
      message: `Voulez-vous vraiment annuler la quittance ${
        reference || '-'
      } ? Cette action est irreversible.`,
      texteConfirmer: 'Annuler le paiement',
      danger: true,
      onConfirmer: async () => {
        try {
          await service.annuler(id, motif.trim());
          toast.success('Paiement annule');
          recharger();
        } catch (e) {
          toast.error(e.response?.data?.message || 'Erreur');
        }
      },
    });
  };

  const totalMontant = liste.reduce((sum, p) => sum + (p.montantAr || 0), 0);
  const paiementsValides = liste.filter((p) => !p.annule).length;
  const paiementsAnnules = liste.filter((p) => p.annule).length;

  const colonnes = [
    {
      title: 'Date',
      dataIndex: 'datePaiement',
      key: 'date',
      width: 110,
      render: (v) => formatDate(v),
    },
    {
      title: 'Contribuable',
      key: 'contribuable',
      render: (_, p) =>
        p.contribuable ? (
          <>
            <div>{p.contribuable.raisonSociale}</div>
            <div className="muted" style={{ fontSize: 12 }}>
              NIF {p.contribuable.nif}
            </div>
          </>
        ) : (
          '-'
        ),
    },
    {
      title: 'Quittance',
      dataIndex: 'referenceQuittance',
      key: 'quittance',
      render: (v) => <Text strong>{v || '-'}</Text>,
    },
    {
      title: 'Reglement',
      key: 'reglement',
      width: 150,
      render: (_, p) => (
        <Tag color={couleurReglement(p.typeReglement)}>{p.typeReglement || 'TOUS'}</Tag>
      ),
    },
    {
      title: 'Mode',
      dataIndex: 'mode',
      key: 'mode',
      width: 130,
      render: (v) => v || '-',
    },
    {
      title: 'Montant',
      dataIndex: 'montantAr',
      key: 'montant',
      align: 'right',
      width: 140,
      render: (v) => <Text strong>{formatAr(v)}</Text>,
    },
    {
      title: 'Agent',
      key: 'agent',
      render: (_, p) =>
        p.agent ? `${p.agent.prenom || ''} ${p.agent.nom || ''}`.trim() : '-',
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 190,
      render: (_, p) => (
        <Space size={4}>
          <Button
            size="small"
            icon={<PrinterOutlined />}
            onClick={() => exportService.exportQuittancePdf(p.idPaiement)}
          >
            Quittance
          </Button>
          {p.annule ? (
            <Tag color="default">Annule</Tag>
          ) : (
            <Tooltip title="Annuler le paiement">
              <Button
                size="small"
                danger
                type="text"
                icon={<DeleteOutlined />}
                onClick={() => demanderAnnulation(p)}
              />
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1 className="page-title">Paiements</h1>
          <p className="page-subtitle">Enregistrement des paiements et quittances</p>
        </div>
      </header>

      {erreur && (
        <Alert type="error" showIcon message={erreur} closable onClose={() => setErreur('')} />
      )}

      {dernierPaiement && (
        <Alert
          type="success"
          showIcon
          message="Paiement enregistre avec succes"
          closable
          onClose={() => setDernierPaiement(null)}
          action={
            <Button
              size="small"
              icon={<PrinterOutlined />}
              loading={quittanceLoading}
              onClick={() => handleImprimerQuittance(dernierPaiement.idPaiement)}
            >
              Imprimer la quittance
            </Button>
          }
        />
      )}


      <div className="toolbar">
        <div style={{ flex: '1 1 300px', maxWidth: 460 }}>
          <ContribuableRecherche
            contribuables={contribuables}
            value={idContribuable}
            onChange={(id) => setIdContribuable(id)}
          />
        </div>
        <Space wrap>
          <Button type="primary" icon={<PlusOutlined />} onClick={ouvrirWizard}>
            Enregistrer un paiement
          </Button>
          <Button icon={<DownloadOutlined />} onClick={() => exportService.exportPaiements()}>
            Exporter Excel
          </Button>
          <Button icon={<PrinterOutlined />} onClick={() => window.print()}>
            Imprimer
          </Button>
        </Space>
      </div>

      <SearchBar
        value={recherche}
        onChange={setRecherche}
        placeholder="Recherche (quittance, contribuable, NIF)"
      />

      <Row gutter={[16, 16]}>
        <Col xs={12} md={6}>
          <Card>
            <Statistic
              title="Total paiements"
              value={liste.length}
              prefix={<CreditCardOutlined style={{ color: '#0E7A55' }} />}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card>
            <Statistic
              title="Montant total"
              value={totalMontant}
              suffix="Ar"
              prefix={<WalletOutlined style={{ color: '#16A34A' }} />}
              valueStyle={{ color: '#16A34A' }}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card>
            <Statistic
              title="Valides"
              value={paiementsValides}
              prefix={<UserOutlined style={{ color: '#0369A1' }} />}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card>
            <Statistic
              title="Annules"
              value={paiementsAnnules}
              prefix={<CloseCircleOutlined style={{ color: '#DC2626' }} />}
            />
          </Card>
        </Col>
      </Row>

      {loading ? (
        <SkeletonTable rows={5} cols={8} />
      ) : listeFiltree.length === 0 ? (
        <EmptyState
          icone={<CreditCardOutlined style={{ fontSize: 32, color: '#0E7A55' }} />}
          titre="Aucun paiement"
          texte="Ajoutez un paiement pour commencer"
          action={
            recherche || idContribuable ? (
              <Button
                onClick={() => {
                  setRecherche('');
                  setIdContribuable('');
                }}
              >
                Reinitialiser la recherche
              </Button>
            ) : null
          }
        />
      ) : (
        <Table
          rowKey="idPaiement"
          size="medium"
          columns={colonnes}
          dataSource={listeFiltree}
          pagination={{ pageSize: 10, showSizeChanger: true }}
          locale={{ emptyText: 'Aucun paiement' }}
        />
      )}

      <Modal
        open={wizard}
        title="Enregistrer un paiement"
        onCancel={fermerWizard}
        footer={null}
        width={700}
        centered
        destroyOnHidden
      >
        <Steps current={etape} items={ETAPES} style={{ marginBottom: 24 }} />

        {etape === 0 && (
          <Form layout="vertical">
            <Form.Item label="Contribuable" required>
              <ContribuableRecherche
                contribuables={contribuables}
                value={idContribuable}
                onChange={(id) => {
                  setIdContribuable(id);
                  setIdDeclaration('');
                }}
              />
            </Form.Item>
            <Form.Item label="Type de reglement" required>
              <Segmented
                block
                value={typeReglement}
                onChange={setTypeReglement}
                options={[
                  { label: 'Solde total (TOUS)', value: 'TOUS' },
                  { label: '2e acompte', value: '2EME_ACOMPTE' },
                ]}
              />
            </Form.Item>
            <Form.Item
              label="Declaration concernee"
              required
              extra={
                idContribuable
                  ? undefined
                  : "Selectionnez d'abord un contribuable pour afficher ses declarations"
              }
            >
              <Select
                value={idDeclaration || undefined}
                placeholder="Choisir une declaration"
                options={optionsDeclarations}
                onChange={(v) => setIdDeclaration(v)}
                disabled={!idContribuable}
                notFoundContent="Aucune declaration pour ce contribuable"
              />
            </Form.Item>
          </Form>
        )}

        {etape === 1 && (
          <Form layout="vertical">
            <Form.Item label="Date du paiement" required>
              <DatePicker
                style={{ width: '100%' }}
                value={datePaiement}
                onChange={(v) => {
                  if (v) setDatePaiement(v);
                }}
                format="YYYY-MM-DD"
                allowClear={false}
                disabledDate={(d) => !!d && d.isAfter(dayjs(), 'day')}
              />
            </Form.Item>
            <Form.Item label="Mode de paiement" required>
              <Select value={mode} onChange={setMode} options={MODES} />
            </Form.Item>
          </Form>
        )}

        {etape === 2 && (
          <div>
            {erreurWizard && (
              <Alert
                type="error"
                showIcon
                message={erreurWizard}
                style={{ marginBottom: 12 }}
              />
            )}
            {recapErreur ? (
              <Alert type="error" showIcon message={recapErreur} />
            ) : !recap ? (
              <LoadingBlock message="Chargement du recapitulatif..." />
            ) : (
              <Card
                size="small"
                title={`Recapitulatif - ${libelleReglement(recap.typeReglement)}`}
                extra={
                  <Tag color={couleurReglement(recap.typeReglement)}>
                    Annee {recap.annee}
                  </Tag>
                }
              >
                {lignesRecap(recap).map((ligne) => (
                  <div
                    key={ligne.label}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      gap: 12,
                      padding: '8px 0',
                      borderBottom: ligne.total ? 'none' : '1px solid #eef1f0',
                    }}
                  >
                    <span
                      style={{
                        fontSize: 13,
                        color: ligne.deduction ? '#16A34A' : '#6b7f7a',
                      }}
                    >
                      {ligne.label}
                    </span>
                    <span
                      style={{
                        fontSize: ligne.total ? 15 : 13,
                        fontWeight: ligne.total ? 700 : 500,
                        color: ligne.total ? '#0A5E41' : undefined,
                      }}
                    >
                      {ligne.valeur}
                    </span>
                  </div>
                ))}
              </Card>
            )}
          </div>
        )}

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: 20,
          }}
        >
          <Button
            icon={etape === 0 ? <CloseOutlined /> : <ArrowLeftOutlined />}
            onClick={() => (etape === 0 ? fermerWizard() : allerEtape(etape - 1))}
          >
            {etape === 0 ? 'Fermer' : 'Precedent'}
          </Button>
          {etape < 2 ? (
            <Button
              type="primary"
              disabled={!peutSuivant}
              onClick={() => allerEtape(etape + 1)}
            >
              Suivant <ArrowRightOutlined />
            </Button>
          ) : (
            <Button
              type="primary"
              icon={<CheckOutlined />}
              loading={enCours}
              disabled={!recap || !!recapErreur}
              onClick={confirmer}
            >
              Confirmer le paiement
            </Button>
          )}
        </div>
      </Modal>

      <Modal
        open={!!annulation}
        title="Motif d'annulation du paiement"
        onCancel={() => setAnnulation(null)}
        footer={null}
        width={460}
        centered
        destroyOnHidden
      >
        <Form layout="vertical" onFinish={validerAnnulation}>
          <Form.Item
            label="Motif de l'annulation"
            required
            extra="Le motif est transmis au serveur et journalise."
          >
            <Input.TextArea
              rows={3}
              value={annulation ? annulation.motif : ''}
              onChange={(e) =>
                setAnnulation((a) => (a ? { ...a, motif: e.target.value } : a))
              }
              placeholder="Ex : erreur de saisie du mode de paiement..."
            />
          </Form.Item>
          <Space style={{ justifyContent: 'flex-end', width: '100%' }}>
            <Button onClick={() => setAnnulation(null)}>Annuler</Button>
            <Button
              type="primary"
              danger
              htmlType="submit"
              disabled={!annulation || !annulation.motif.trim()}
            >
              Continuer
            </Button>
          </Space>
        </Form>
      </Modal>

      <ConfirmDialog
        ouvert={!!confirm}
        titre={confirm ? confirm.titre : 'Confirmation'}
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
