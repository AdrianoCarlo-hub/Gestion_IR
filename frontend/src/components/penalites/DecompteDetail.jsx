import { Collapse, Descriptions, Tag } from 'antd';
import { CalculatorOutlined } from '@ant-design/icons';
import { formatAr, formatDate, STATUT_PENALITE, TYPE_PENALITE } from '../../utils/format';

/**
 * Accordion de decompte detaille d'une penalite (formule + article + dates).
 */
export default function DecompteDetail({ detail }) {
  const statut = STATUT_PENALITE[detail.statut];

  const items = [];
  if (detail.baseCalculAr != null) {
    items.push({ key: 'base', label: 'Base de calcul', children: formatAr(detail.baseCalculAr) });
  }
  if (detail.tauxPct != null) {
    items.push({ key: 'taux', label: 'Taux', children: `${detail.tauxPct} %` });
  }
  if (detail.nbMois != null && detail.nbMois > 0) {
    items.push({ key: 'retard', label: 'Retard', children: `${detail.nbMois} mois` });
  }
  if (detail.dateLimite) {
    items.push({ key: 'echeance', label: 'Echeance', children: formatDate(detail.dateLimite) });
  }
  if (detail.articleRef) {
    items.push({ key: 'article', label: 'Article', children: detail.articleRef });
  }
  if (detail.motifAnnulation) {
    items.push({
      key: 'annulation',
      label: "Motif d'annulation",
      children: detail.motifAnnulation,
      span: 2,
    });
  }

  const pieces = [
    {
      key: 'decompte',
      label: (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 10,
            flexWrap: 'wrap',
          }}
        >
          <CalculatorOutlined />
          <strong>{TYPE_PENALITE[detail.type] || detail.type}</strong>
          {detail.motif && (
            <span className="muted" style={{ fontSize: 12 }}>
              {detail.motif}
            </span>
          )}
          <Tag color={statut ? statut.couleur : 'default'}>
            {statut ? statut.libelle : detail.statut}
          </Tag>
          <strong>{formatAr(detail.montantAr)}</strong>
        </span>
      ),
      children: (
        <>
          {detail.formule && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 12px',
                marginBottom: 12,
                borderRadius: 8,
                background: '#F1F8F5',
                overflowX: 'auto',
              }}
            >
              <code style={{ fontSize: 13, color: '#0A5E41' }}>{detail.formule}</code>
            </div>
          )}
          {items.length > 0 && (
            <Descriptions size="small" column={2} items={items} />
          )}
        </>
      ),
    },
  ];

  return <Collapse items={pieces} />;
}
