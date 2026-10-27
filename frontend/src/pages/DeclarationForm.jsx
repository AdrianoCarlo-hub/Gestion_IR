import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Button,
  Card,
  Col,
  Descriptions,
  Input,
  InputNumber,
  Row,
  Select,
  Space,
  Statistic,
  Steps,
  Table,
  Tag,
  Typography,
} from 'antd';
import {
  ArrowLeftOutlined,
  CalculatorOutlined,
  CheckCircleOutlined,
  DeleteOutlined,
  FilePdfOutlined,
  PlusOutlined,
  SaveOutlined,
} from '@ant-design/icons';
import * as service from '../services/declarationService';
import * as exportService from '../services/exportService';
import ConfirmDialog from '../components/ConfirmDialog';
import { LoadingBlock } from '../components/Spinner';
import { useToast } from '../context/ToastContext';
import { formatAr, STATUT_DECLARATION } from '../utils/format';

const { Text, Title } = Typography;

const CATEGORIES = [
  { value: 'SALAIRE', label: 'Salaire' },
  { value: 'LOYER', label: 'Loyer' },
  { value: 'ELECTRICITE', label: 'Electricite' },
  { value: 'TRANSPORT', label: 'Transport' },
  { value: 'AUTRE', label: 'Autre' },
];

const afficherCategorie = (c) => {
  if (c.categorie === 'AUTRE') {
    return c.categorieLibre ? 'AUTRE : ' + c.categorieLibre : 'AUTRE';
  }
  const cat = CATEGORIES.find((x) => x.value === c.categorie);
  return cat ? cat.label : c.categorie;
};

export default function DeclarationForm({ idDeclaration, onRetour }) {
  const toast = useToast();
  const navigate = useNavigate();
  const [confirm, setConfirm] = useState(null);
  const [declaration, setDeclaration] = useState(null);
  const [charges, setCharges] = useState([]);
  const [caHt, setCaHt] = useState(0);
  const [moisActifs, setMoisActifs] = useState(12);
  const [nouvelleCharge, setNouvelleCharge] = useState({
    categorie: 'SALAIRE',
    categorieLibre: '',
    montant: null,
    justificatif: '',
  });
  const [tentativeAjout, setTentativeAjout] = useState(false);
  const [loading, setLoading] = useState(false);
  const [enregistrementBrouillon, setEnregistrementBrouillon] = useState(false);

  const charger = async () => {
    try {
      const d = await service.trouver(idDeclaration);
      setDeclaration(d);
      setCaHt(d.caHt || 0);
      setMoisActifs(d.moisActifs == null ? 12 : d.moisActifs);
      const c = await service.listerCharges(idDeclaration);
      setCharges(c);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Erreur de chargement');
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    charger();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idDeclaration]);

  const verrouille = declaration && declaration.statut !== 'BROUILLON';

  const handleSauverCa = async () => {
    try {
      await service.modifierCaHt(idDeclaration, Number(caHt) || 0);
      toast.success('Chiffre d affaires enregistre');
      charger();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Erreur');
    }
  };

  const handleSauverMoisActifs = async () => {
    const valeur = Number(moisActifs);
    if (Number.isNaN(valeur) || valeur < 0 || valeur > 12) {
      toast.error('Mois actifs : valeur de 0 a 12');
      return;
    }
    try {
      await service.modifierMoisActifs(idDeclaration, valeur);
      toast.success('Mois actifs enregistres');
      charger();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Erreur');
    }
  };

  const handleAjouterCharge = async () => {
    const { categorie, categorieLibre, montant, justificatif } = nouvelleCharge;
    setTentativeAjout(true);
    if (montant == null || Number(montant) <= 0) {
      toast.error('Montant (Ar) obligatoire et > 0');
      return;
    }
    if (!justificatif || !justificatif.trim()) {
      toast.error('Numero de facture obligatoire');
      return;
    }
    if (categorie === 'AUTRE' && !categorieLibre.trim()) {
      toast.error('Precisez la categorie libre (ex: Fournitures)');
      return;
    }
    try {
      await service.ajouterCharge(idDeclaration, {
        categorie,
        categorieLibre: categorie === 'AUTRE' ? categorieLibre.trim() : null,
        montantAr: Number(montant),
        justificatifRef: justificatif.trim(),
      });
      setNouvelleCharge({ categorie: 'SALAIRE', categorieLibre: '', montant: null, justificatif: '' });
      setTentativeAjout(false);
      toast.success('Charge ajoutee');
      charger();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Erreur');
    }
  };

  const handleSupprimerCharge = (idLigne) => {
    setConfirm({
      titre: 'Supprimer la charge',
      message: 'Voulez-vous vraiment supprimer cette charge ?',
      texteConfirmer: 'Supprimer',
      danger: true,
      onConfirmer: async () => {
        try {
          await service.supprimerCharge(idLigne);
          toast.success('Charge supprimee');
          charger();
        } catch (e) {
          toast.error(e.response?.data?.message || 'Erreur');
        }
      },
    });
  };

  const handleCalculer = async () => {
    setLoading(true);
    try {
      await service.modifierCaHt(idDeclaration, Number(caHt) || 0);
      const d = await service.calculer(idDeclaration, {});
      setDeclaration(d);
      toast.success('Calcul effectue avec succes');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Erreur de calcul');
    } finally {
      setLoading(false);
    }
  };

  const handleEnregistrerBrouillon = async () => {
    setEnregistrementBrouillon(true);
    try {
      const caValeur = Number(caHt) || 0;
      const moisValeur = Number(moisActifs);
      if (caValeur > 0 && caValeur !== (declaration.caHt || 0)) {
        await service.modifierCaHt(idDeclaration, caValeur);
      }
      if (
        !Number.isNaN(moisValeur) &&
        moisValeur >= 0 &&
        moisValeur <= 12 &&
        moisValeur !== (declaration.moisActifs ?? 12)
      ) {
        await service.modifierMoisActifs(idDeclaration, moisValeur);
      }
      await charger();
      toast.success('Brouillon enregistre. Vous pouvez revenir plus tard.');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Erreur d enregistrement');
    } finally {
      setEnregistrementBrouillon(false);
    }
  };

  const handleValider = () => {
    setConfirm({
      titre: 'Valider la declaration',
      message:
        'Valider cette declaration ? Les acomptes de l annee suivante seront generes.',
      texteConfirmer: 'Valider',
      onConfirmer: async () => {
        try {
          const d = await service.valider(idDeclaration);
          setDeclaration(d);
          toast.success('Declaration validee. Acomptes generes.');
          navigate('/declarations');
          if (onRetour) onRetour();
        } catch (e) {
          toast.error(e.response?.data?.message || 'Erreur');
        }
      },
    });
  };

  if (!declaration) {
    return <LoadingBlock message="Chargement de la declaration..." />;
  }

  const totalChargesAffiche = charges.reduce((s, c) => s + (c.montantAr || 0), 0);
  const taux = declaration.tauxIr == null ? 20 : Number(declaration.tauxIr);
  const penalites = declaration.penaliteDueAr || 0;
  const premierAcompte = declaration.premierAcompteAr || 0;
  const acomptesVerses = declaration.acomptesVerses || 0;
  const totalAPayer =
    (declaration.irDu || 0) + penalites + premierAcompte - acomptesVerses;
  const soldeAffiche = declaration.soldeAPayer || 0;
  const credit = declaration.creditImpot || 0;

  const statutDef = STATUT_DECLARATION[declaration.statut] || {
    couleur: 'default',
    libelle: declaration.statut,
  };

  const etapesResultat = [
    { label: '1. CA HT', valeur: formatAr(declaration.caHt) },
    { label: '2. Charges deductibles', valeur: formatAr(declaration.totalCharges) },
    { label: '3. Resultat comptable', valeur: formatAr(declaration.resultatComptable) },
    { label: '4. Reintegrations', valeur: formatAr(declaration.totalReintegrations) },
    { label: '5. Deductions', valeur: formatAr(declaration.totalDeductions) },
    { label: '6. Deficit impute', valeur: formatAr(declaration.deficitImpute) },
    { label: '7. Base imposable', valeur: formatAr(declaration.baseImposable) },
    { label: `8. IR brut (${taux} %)`, valeur: formatAr(declaration.irBrut) },
    { label: '9. Minimum de perception', valeur: formatAr(declaration.minimumPerception) },
    { label: '10. IR du', valeur: formatAr(declaration.irDu), fort: true },
    {
      label: '11. Solde (IR + penalites + 1er acompte - acomptes)',
      valeur: formatAr(totalAPayer),
      fort: true,
    },
    {
      label: '12. Resultat net',
      valeur:
        soldeAffiche > 0
          ? 'Solde a payer : ' + formatAr(soldeAffiche)
          : credit > 0
            ? 'Credit d impot : ' + formatAr(credit)
            : 'N a payer',
      final: true,
      solde: soldeAffiche > 0,
      credit: credit > 0,
    },
  ];

  const colonnesCharges = [
    {
      title: 'Categorie',
      dataIndex: 'categorie',
      render: (_, c) => afficherCategorie(c),
    },
    {
      title: 'Montant',
      dataIndex: 'montantAr',
      align: 'right',
      width: 160,
      render: formatAr,
    },
    {
      title: 'N facture',
      dataIndex: 'justificatifRef',
      render: (v) =>
        v ? (
          <Text>{v}</Text>
        ) : (
          <Text type="warning" italic>
            Non renseigne
          </Text>
        ),
    },
    ...(verrouille
      ? []
      : [
          {
            title: '',
            width: 110,
            align: 'center',
            render: (_, c) => (
              <Button
                type="link"
                danger
                size="small"
                icon={<DeleteOutlined />}
                onClick={() => handleSupprimerCharge(c.idLigne)}
              >
                Supprimer
              </Button>
            ),
          },
        ]),
  ];

  return (
    <>
      <div className="page-header">
        <div>
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={onRetour}
            style={{ marginBottom: 4, paddingInline: 0 }}
          >
            Retour a la liste
          </Button>
          <Title level={4} style={{ margin: 0 }}>
            {declaration.contribuable?.raisonSociale} — Exercice {declaration.annee}
          </Title>
          <Text type="secondary">
            NIF : {declaration.contribuable?.nif} —{' '}
            <Tag color={statutDef.couleur} style={{ marginInlineStart: 4 }}>
              {statutDef.libelle}
            </Tag>
          </Text>
        </div>
        <Space>
          <Button
            icon={<FilePdfOutlined />}
            onClick={() => exportService.exportFichePdf(idDeclaration)}
          >
            Fiche de declaration (PDF)
          </Button>
        </Space>
      </div>

      {verrouille && (
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
          message={`Cette declaration est ${declaration.statut} — elle n est plus modifiable.`}
        />
      )}

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={15}>
          <Card
            size="small"
            title="Chiffre d affaires"
            style={{ marginBottom: 16 }}
            extra={
              !verrouille && (
                <Button size="small" icon={<SaveOutlined />} onClick={handleSauverCa}>
                  Enregistrer
                </Button>
              )
            }
          >
            <Space.Compact style={{ width: '100%' }}>
              <InputNumber
                value={caHt}
                onChange={(v) => setCaHt(v ?? 0)}
                min={0}
                step={100000}
                style={{ width: '100%' }}
                disabled={verrouille}
                addonAfter="Ar"
                placeholder="CA HT"
              />
            </Space.Compact>
          </Card>

          <Card
            size="small"
            title={`Charges (${charges.length})`}
            style={{ marginBottom: 16 }}
            extra={<Statistic value={totalChargesAffiche} suffix="Ar" valueStyle={{ fontSize: 14 }} />}
          >
            <Table
              rowKey="idLigne"
              columns={colonnesCharges}
              dataSource={charges}
              pagination={false}
              size="small"
              locale={{ emptyText: 'Aucune charge' }}
            />
            {!verrouille && (
              <Row gutter={[8, 8]} style={{ marginTop: 12 }}>
                <Col xs={24} sm={6}>
                  <Select
                    value={nouvelleCharge.categorie}
                    onChange={(v) =>
                      setNouvelleCharge((s) => ({
                        ...s,
                        categorie: v,
                        categorieLibre: v === 'AUTRE' ? s.categorieLibre : '',
                      }))
                    }
                    options={CATEGORIES}
                    style={{ width: '100%' }}
                  />
                </Col>
                {nouvelleCharge.categorie === 'AUTRE' && (
                  <Col xs={24} sm={6}>
                    <Input
                      placeholder="Precisez (ex: Fournitures)"
                      maxLength={50}
                      value={nouvelleCharge.categorieLibre}
                      onChange={(e) =>
                        setNouvelleCharge((s) => ({ ...s, categorieLibre: e.target.value }))
                      }
                    />
                  </Col>
                )}
                <Col xs={24} sm={6}>
                  <InputNumber
                    placeholder="Montant (Ar) *"
                    min={0}
                    required
                    status={
                      tentativeAjout && (nouvelleCharge.montant == null || Number(nouvelleCharge.montant) <= 0)
                        ? 'error'
                        : ''
                    }
                    style={{ width: '100%' }}
                    value={nouvelleCharge.montant}
                    onChange={(v) => setNouvelleCharge((s) => ({ ...s, montant: v }))}
                    addonAfter="Ar"
                  />
                </Col>
                <Col xs={24} sm={4}>
                  <Input
                    placeholder="N facture *"
                    required
                    maxLength={40}
                    status={tentativeAjout && !nouvelleCharge.justificatif?.trim() ? 'error' : ''}
                    value={nouvelleCharge.justificatif}
                    onChange={(e) =>
                      setNouvelleCharge((s) => ({ ...s, justificatif: e.target.value }))
                    }
                  />
                </Col>
                <Col xs={24} sm={2} style={{ display: 'flex' }}>
                  <Button type="primary" icon={<PlusOutlined />} block onClick={handleAjouterCharge}>
                    Ajouter
                  </Button>
                </Col>
              </Row>
            )}
          </Card>

          <Card size="small" title="Mois actifs (arret d activite)">
            <Space.Compact style={{ width: '100%', maxWidth: 420 }}>
              <InputNumber
                value={moisActifs}
                onChange={(v) => setMoisActifs(v ?? 0)}
                min={0}
                max={12}
                disabled={verrouille}
                style={{ width: 140 }}
              />
              {!verrouille && (
                <Button icon={<SaveOutlined />} onClick={handleSauverMoisActifs}>
                  Enregistrer
                </Button>
              )}
            </Space.Compact>
            <Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
              Le minimum de perception est proratise : part fixe x mois actifs / 12.
            </Text>
          </Card>
        </Col>

        <Col xs={24} lg={9}>
          <div style={{ position: 'sticky', top: 16 }}>
            <Card
              size="small"
              title="Resultat du calcul — 12 etapes"
              style={{ marginBottom: 16 }}
            >
              <Steps
                direction="vertical"
                size="small"
                current={-1}
                items={etapesResultat.map((e) => ({
                  title: (
                    <span
                      style={{
                        fontWeight: e.fort || e.final ? 700 : 500,
                        color: e.final ? (e.solde ? '#cf1322' : e.credit ? '#0e7a55' : undefined) : undefined,
                      }}
                    >
                      {e.label}
                    </span>
                  ),
                  description: (
                    <Text
                      strong={e.fort || e.final}
                      style={{
                        fontSize: e.final ? 16 : 14,
                        color: e.final
                          ? e.solde
                            ? '#cf1322'
                            : e.credit
                              ? '#0e7a55'
                              : undefined
                          : undefined,
                      }}
                    >
                      {e.valeur}
                    </Text>
                  ),
                  status: 'finish',
                }))}
              />

              <Descriptions
                column={1}
                size="small"
                style={{ marginTop: 12 }}
                items={[
                  {
                    key: 'pen',
                    label: 'Penalites dues',
                    children: formatAr(penalites),
                  },
                  {
                    key: 'premier',
                    label: '1er acompte N+1',
                    children: formatAr(premierAcompte),
                  },
                  {
                    key: 'acomp',
                    label: 'Acomptes verses',
                    children: formatAr(acomptesVerses),
                  },
                ]}
              />

              {!verrouille && (
                <Space direction="vertical" style={{ width: '100%', marginTop: 16 }}>
                  <Button
                    type="primary"
                    block
                    icon={<CalculatorOutlined />}
                    loading={loading}
                    onClick={handleCalculer}
                  >
                    Calculer l impot
                  </Button>
                  <Space wrap style={{ width: '100%' }}>
                    <Button
                      icon={<SaveOutlined />}
                      loading={enregistrementBrouillon}
                      onClick={handleEnregistrerBrouillon}
                    >
                      Enregistrer en brouillon
                    </Button>
                    <Button
                      icon={<CheckCircleOutlined />}
                      style={{
                        background: '#0e7a55',
                        borderColor: '#0e7a55',
                        color: '#fff',
                      }}
                      onClick={handleValider}
                    >
                      Valider la declaration
                    </Button>
                  </Space>
                </Space>
              )}
            </Card>
          </div>
        </Col>
      </Row>

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
    </>
  );
}
