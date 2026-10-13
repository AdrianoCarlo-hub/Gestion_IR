const fmt = (n) => (n == null ? '0' : Number(n).toLocaleString('fr-FR').replace(/\u202f|\u00a0/g, ' '));

/**
 * Carte KPI d'une penalite (composant de presentation).
 * Props : icone (composant), label, valeur, suffixe, tone ('' | 'blue' | 'orange').
 */
export default function PenaliteCard({ icone: Icone, label, valeur, suffixe = '', tone = '' }) {
  return (
    <div className={'stat-card penalite-card ' + (tone ? 'financial ' + tone : '')}>
      <div className="stat-card-header">
        <div className={'stat-card-icon ' + tone}>
          {Icone ? <Icone className="icon" style={{ width: 20, height: 20 }} /> : null}
        </div>
      </div>
      <span className="stat-label">{label}</span>
      <span className="stat-value">{typeof valeur === 'number' ? fmt(valeur) : valeur}{suffixe}</span>
    </div>
  );
}
