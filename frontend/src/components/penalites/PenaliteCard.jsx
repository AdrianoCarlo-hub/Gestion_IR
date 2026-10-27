import { Card } from 'antd';

const fmt = (n) =>
  n == null ? '0' : Number(n).toLocaleString('fr-FR').replace(/\u202f|\u00a0/g, ' ');

const TONES = {
  '': '#0E7A55',
  blue: '#0369A1',
  'ir-du': '#0369A1',
  orange: '#EA580C',
  encaisse: '#16A34A',
};

/**
 * Carte KPI d'une penalite (composant de presentation).
 * Props : icone (composant), label, valeur, suffixe, tone ('' | 'blue' | 'orange' | ...).
 */
export default function PenaliteCard({ icone: Icone, label, valeur, suffixe = '', tone = '' }) {
  const couleur = TONES[tone] || TONES[''];

  return (
    <Card size="small" style={{ height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            flexShrink: 0,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: couleur,
            background: `${couleur}1A`,
          }}
        >
          {Icone ? <Icone style={{ fontSize: 18 }} /> : null}
        </span>
        <div style={{ minWidth: 0 }}>
          <div className="stat-label">{label}</div>
          <div
            style={{
              fontSize: 20,
              fontWeight: 700,
              color: '#0a2c22',
              lineHeight: 1.2,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {typeof valeur === 'number' ? fmt(valeur) : valeur}
            {suffixe}
          </div>
        </div>
      </div>
    </Card>
  );
}
