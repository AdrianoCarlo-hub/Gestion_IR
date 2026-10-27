import { Timeline, Tag, Typography } from 'antd';
import {
  PauseCircleOutlined,
  PlayCircleOutlined,
  StopOutlined,
} from '@ant-design/icons';
import EmptyState from '../EmptyState';
import { formatDate } from '../../utils/format';

const { Text } = Typography;

const ICONES = {
  VEILLEUSE: <PauseCircleOutlined />,
  CESSATION: <StopOutlined />,
  REPRISE: <PlayCircleOutlined />,
};

const LABELS = {
  VEILLEUSE: 'Mise en veilleuse',
  CESSATION: 'Cessation definitive',
  REPRISE: "Reprise d activite",
};

const STATUTS = {
  EN_COURS: { label: 'En cours', couleur: 'processing' },
  TERMINEE: { label: 'Terminee', couleur: 'success' },
  ANNULEE: { label: 'Annulee', couleur: 'default' },
};

const COULEURS_TIMELINE = {
  EN_COURS: 'blue',
  TERMINEE: 'green',
  ANNULEE: 'gray',
};

const MOTIFS = {
  MANQUE_ACTIVITE: "Manque d activite",
  TRAVAUX: 'Travaux',
  SAISON: 'Activite saisonniere',
  DIFFICULTE_FINANCIERE: 'Difficulte financiere',
  REORGANISATION: 'Reorganisation',
  AUTRE: 'Autre',
};

/**
 * Timeline verticale de l'historique des arrets / reprises d'un contribuable.
 */
export default function HistoriqueTimeline({ historique = [] }) {
  if (!historique.length) {
    return <EmptyState titre="Aucun evenement enregistre" texte="" />;
  }

  const items = historique.map((h) => {
    const type = h.typeEvenement || 'VEILLEUSE';
    const libelleEvenement = h.dateReprise
      ? "Arret puis reprise d activite"
      : LABELS[type] || type;
    const statut = STATUTS[h.statut] || { label: h.statut, couleur: 'default' };

    return {
      key: h.idSuspension,
      color: COULEURS_TIMELINE[h.statut] || 'blue',
      children: (
        <div style={{ paddingBottom: 4 }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 8,
              flexWrap: 'wrap',
              marginBottom: 6,
            }}
          >
            <strong>
              {ICONES[type] || <PauseCircleOutlined />} {libelleEvenement}
            </strong>
            <Tag color={statut.couleur}>{statut.label}</Tag>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, fontSize: 13 }}>
            {h.dateArret && (
              <span>
                <Text strong>Arret de l activite :</Text> {formatDate(h.dateArret)}
              </span>
            )}
            {h.dateReprise && (
              <span>
                <Text strong>Reprise de l activite :</Text> {formatDate(h.dateReprise)}
              </span>
            )}
            {h.motif && (
              <span>
                <Text strong>Motif :</Text> {MOTIFS[h.motif] || h.motif}
              </span>
            )}
            {h.dateLimiteDeclaration && (
              <span>
                <Text strong>Date limite de declaration :</Text>{' '}
                {formatDate(h.dateLimiteDeclaration)}
              </span>
            )}
            {h.agentArret && <span>Enregistre par : {h.agentArret}</span>}
            {h.agentReprise && <span>Reprise enregistree par : {h.agentReprise}</span>}
            {h.attestationRadiationNumero && (
              <span>Attestation : {h.attestationRadiationNumero}</span>
            )}
          </div>
        </div>
      ),
    };
  });

  return <Timeline items={items} />;
}
