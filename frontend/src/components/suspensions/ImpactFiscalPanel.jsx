import { LuTrendingDown, LuCirclePause, LuWallet } from 'react-icons/lu';

const fmt = (n) => (n == null ? '0' : Number(n).toLocaleString('fr-FR').replace(/\u202f|\u00a0/g, ' '));

/**
 * Panneau de simulation de l'impact fiscal d'un arret (mise en veilleuse).
 */
export default function ImpactFiscalPanel({ impact }) {
  if (!impact) {
    return (
      <div className="impact-panel">
        <p className="impact-vide">Choisissez une date d arret pour simuler l impact fiscal</p>
      </div>
    );
  }

  return (
    <div className="impact-panel">
      <h3 className="section-title">Simulation de l impact fiscal</h3>
      <div className="impact-grid">
        <div className="impact-item">
          <LuTrendingDown className="icon" />
          <span className="impact-label">Minimum au prorata ({impact.moisActifs} mois)</span>
          <strong className="impact-valeur">{fmt(impact.minimumProrata)} Ar</strong>
        </div>
        <div className="impact-item">
          <LuCirclePause className="icon" />
          <span className="impact-label">Acomptes a suspendre</span>
          <strong className="impact-valeur">{fmt(impact.acompteSuspendu)} Ar</strong>
        </div>
        <div className={'impact-item ' + (impact.creditImpot > 0 ? 'credit' : '')}>
          <LuWallet className="icon" />
          <span className="impact-label">Credit d impot reportable</span>
          <strong className="impact-valeur">{fmt(impact.creditImpot)} Ar</strong>
        </div>
      </div>
    </div>
  );
}
