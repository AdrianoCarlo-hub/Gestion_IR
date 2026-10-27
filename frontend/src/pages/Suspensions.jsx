import { useEffect, useState, useCallback } from 'react';
import { Card, Row, Col, Button, Modal, Form, Input, Select, Tabs } from 'antd';
import {
  PauseCircleOutlined,
  PlayCircleOutlined,
  FileTextOutlined,
  HistoryOutlined,
  CalculatorOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import { lister as listerContribuables } from '../services/contribuableService';
import * as service from '../services/suspensionService';
import ContribuableRecherche from '../components/ContribuableRecherche';
import ConfirmDialog from '../components/ConfirmDialog';
import StatutBanner from '../components/suspensions/StatutBanner';
import DeclarationForm from '../components/suspensions/DeclarationForm';
import HistoriqueTimeline from '../components/suspensions/HistoriqueTimeline';
import ImpactFiscalPanel from '../components/suspensions/ImpactFiscalPanel';
import { LoadingBlock } from '../components/Spinner';
import EmptyState from '../components/EmptyState';
import { useToast } from '../context/ToastContext';

const today = () => {
  const date = new Date();
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
};
const yesterday = () => {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
};
const lendemain = (date) => {
  if (!date) return undefined;
  const lendemainDate = new Date(date + 'T00:00:00');
  lendemainDate.setDate(lendemainDate.getDate() + 1);
  const local = new Date(lendemainDate.getTime() - lendemainDate.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
};

const MOTIFS_ARRET = [
  { value: 'MANQUE_ACTIVITE', label: "Manque d'activite" },
  { value: 'TRAVAUX', label: 'Travaux' },
  { value: 'SAISON', label: 'Activite saisonniere' },
  { value: 'DIFFICULTE_FINANCIERE', label: 'Difficulte financiere' },
  { value: 'REORGANISATION', label: 'Reorganisation' },
  { value: 'AUTRE', label: 'Autre' },
];

export default function Suspensions() {
  const { agent } = useAuth();
  const toast = useToast();
  const [confirm, setConfirm] = useState(null);
  const [statusDialog, setStatusDialog] = useState(null);
  const [contribuables, setContribuables] = useState([]);
  const [selected, setSelected] = useState('');
  const [situation, setSituation] = useState(null);
  const [impact, setImpact] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    listerContribuables().then(setContribuables).catch(() => {});
  }, []);

  const charger = useCallback(async (id) => {
    if (!id) {
      setSituation(null);
      setImpact(null);
      return;
    }
    setLoading(true);
    try {
      const [sit, imp] = await Promise.all([
        service.situation(id),
        service.simuler(id).catch(() => null),
      ]);
      setSituation(sit);
      setImpact(imp);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (selected) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      charger(selected);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected]);

  const idAgent = agent ? agent.idAgent : 3;
  const enCours = situation ? situation.idSuspensionEnCours : null;
  const statutActuel = situation?.statutActuel;
  const evenementEnCours = situation?.historique?.find((evenement) => evenement.statut === 'EN_COURS');

  const demanderChangementStatut = () => {
    if (statutActuel !== 'ACTIF' && statutActuel !== 'SUSPENDU') return;

    const nouveauStatut = statutActuel === 'ACTIF' ? 'SUSPENDU' : 'ACTIF';
    setStatusDialog({
      statut: nouveauStatut,
      date: today(),
      dateArret: nouveauStatut === 'ACTIF' && !evenementEnCours ? yesterday() : '',
      motif: MOTIFS_ARRET[0].value,
    });
  };

  const soumettreChangementStatut = async (values) => {
    if (!statusDialog) return;
    try {
      await service.changerStatut(Number(selected), statusDialog.statut, idAgent, {
        dateArret: statusDialog.statut === 'SUSPENDU'
          ? values.date
          : !evenementEnCours ? values.dateArret : undefined,
        motif: statusDialog.statut === 'SUSPENDU' || !evenementEnCours
          ? values.motif : undefined,
        dateReprise: statusDialog.statut === 'ACTIF' ? values.date : undefined,
      });
      setStatusDialog(null);
      await charger(selected);
      toast.success(statusDialog.statut === 'ACTIF' ? 'Reprise enregistree' : 'Suspension enregistree');
    } catch (e2) {
      toast.error(e2.response?.data?.message || 'Erreur de changement du statut');
    }
  };

  const soumettre = async (type, payload) => {
    try {
      if (type === 'VEILLEUSE') {
        await service.declarerVeilleuse({ idContribuable: Number(selected), idAgent, ...payload });
        toast.success('Mise en veilleuse enregistree');
      } else if (type === 'CESSATION') {
        await service.declarerCessation({ idContribuable: Number(selected), idAgent, ...payload });
        toast.success('Cessation enregistree');
      } else if (type === 'REPRISE') {
        await service.declarerReprise(enCours, { idAgent, ...payload });
        toast.success('Reprise enregistree');
      }
      charger(selected);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Erreur');
    }
  };

  const attestation = async () => {
    try {
      const res = await service.attestationRadiation(enCours);
      toast.success('Attestation de radiation : ' + (res.attestationRadiationNumero || ''));
      charger(selected);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Erreur');
    }
  };

  const annuler = (id) => {
    setConfirm({
      titre: 'Annuler l evenement',
      message: 'Annuler cet evenement d arret / reprise ?',
      texteConfirmer: 'Annuler',
      danger: true,
      onConfirmer: async () => {
        try {
          await service.annuler(id);
          toast.success('Evenement annule');
          charger(selected);
        } catch (e) {
          toast.error(e.response?.data?.message || 'Erreur');
        }
      },
    });
  };

  const onglets = [
    {
      key: 'declaration',
      label: 'Declaration',
      icon: <FileTextOutlined />,
      disabled: statutActuel === 'SUSPENDU' && !enCours,
      children: (
        <DeclarationForm onSoumettre={soumettre} enCours={enCours} enCoursId={enCours} />
      ),
    },
    {
      key: 'historique',
      label: 'Historique',
      icon: <HistoryOutlined />,
      children: (
        <>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
            {enCours && situation?.typeEvenementEnCours === 'VEILLEUSE' && (
              <Button onClick={() => annuler(enCours)}>Annuler l arret en cours</Button>
            )}
            {enCours && situation?.typeEvenementEnCours === 'CESSATION' && (
              <Button
                type="primary"
                icon={<SafetyCertificateOutlined />}
                onClick={attestation}
              >
                Attestation de radiation
              </Button>
            )}
          </div>
          <HistoriqueTimeline historique={situation?.historique || []} />
        </>
      ),
    },
    {
      key: 'impact',
      label: 'Impact fiscal',
      icon: <CalculatorOutlined />,
      children: <ImpactFiscalPanel impact={impact} />,
    },
  ];

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Arret / reprise d activite</h1>
          <p className="page-subtitle">Veilleuse, cessation definitive et reprise</p>
        </div>
      </div>

      <Card size="small" style={{ marginBottom: 16 }}>
        <ContribuableRecherche
          contribuables={contribuables}
          value={selected}
          onChange={(id) => setSelected(id)}
        />
      </Card>

      {!selected ? (
        <EmptyState
          titre="Selectionnez un contribuable"
          texte="Choisissez un contribuable pour gerer son activite"
        />
      ) : loading ? (
        <LoadingBlock message="Chargement..." />
      ) : (
        <>
          <Row gutter={[16, 16]} align="middle" style={{ marginBottom: 16 }}>
            <Col xs={24} md={18}>
              <StatutBanner statut={statutActuel} moisActifs={situation?.moisActifs} />
            </Col>
            {(statutActuel === 'ACTIF' || statutActuel === 'SUSPENDU') && (
              <Col xs={24} md={6} style={{ textAlign: 'right' }}>
                <Button
                  type={statutActuel === 'ACTIF' ? 'default' : 'primary'}
                  icon={
                    statutActuel === 'ACTIF' ? (
                      <PauseCircleOutlined />
                    ) : (
                      <PlayCircleOutlined />
                    )
                  }
                  onClick={demanderChangementStatut}
                >
                  {statutActuel === 'ACTIF' ? 'Suspendre' : 'Reactiver'}
                </Button>
              </Col>
            )}
          </Row>

          <Card>
            <Tabs defaultActiveKey="declaration" items={onglets} />
          </Card>
        </>
      )}

      <ConfirmDialog
        ouvert={!!confirm}
        titre={confirm ? confirm.titre : ''}
        message={confirm ? confirm.message : ''}
        texteConfirmer={confirm ? confirm.texteConfirmer : 'Confirmer'}
        danger={confirm ? !!confirm.danger : false}
        onConfirmer={() => { if (confirm) confirm.onConfirmer(); setConfirm(null); }}
        onAnnuler={() => setConfirm(null)}
      />

      {statusDialog && (
        <Modal
          open
          title={
            statusDialog.statut === 'SUSPENDU'
              ? 'Suspendre l activite'
              : "Reprise d'activite"
          }
          onCancel={() => setStatusDialog(null)}
          destroyOnHidden
          centered
          width={520}
          footer={[
            <Button key="annuler" onClick={() => setStatusDialog(null)}>
              Annuler
            </Button>,
            <Button
              key="confirmer"
              type="primary"
              htmlType="submit"
              form="form-changement-statut"
            >
              {statusDialog.statut === 'SUSPENDU'
                ? 'Confirmer la suspension'
                : 'Confirmer la reprise'}
            </Button>,
          ]}
        >
          <Form
            id="form-changement-statut"
            layout="vertical"
            initialValues={{
              date: statusDialog.date,
              motif: statusDialog.motif,
              dateArret: statusDialog.dateArret,
            }}
            onValuesChange={(changed) =>
              setStatusDialog((current) => ({ ...current, ...changed }))
            }
            onFinish={soumettreChangementStatut}
          >
            <Form.Item
              label={
                statusDialog.statut === 'SUSPENDU' ? "Date d'arret" : 'Date de reprise'
              }
              name="date"
              rules={[{ required: true, message: 'Date requise' }]}
            >
              <Input
                type="date"
                min={statusDialog.statut === 'ACTIF'
                  ? lendemain(evenementEnCours?.dateArret || statusDialog.dateArret)
                  : undefined}
                max={today()}
              />
            </Form.Item>

            {statusDialog.statut === 'SUSPENDU' && (
              <Form.Item
                label="Motif de suspension"
                name="motif"
                rules={[{ required: true, message: 'Motif requis' }]}
              >
                <Select options={MOTIFS_ARRET} />
              </Form.Item>
            )}

            {statusDialog.statut === 'ACTIF' && !evenementEnCours && (
              <>
                <Form.Item
                  label="Date de suspension historique"
                  name="dateArret"
                  rules={[{ required: true, message: 'Date requise' }]}
                >
                  <Input type="date" max={statusDialog.date} />
                </Form.Item>
                <Form.Item
                  label="Motif de suspension"
                  name="motif"
                  rules={[{ required: true, message: 'Motif requis' }]}
                >
                  <Select options={MOTIFS_ARRET} />
                </Form.Item>
              </>
            )}
          </Form>
        </Modal>
      )}
    </div>
  );
}
