import { useMemo, useState } from 'react';

const fmt = (n) => (n == null ? '0' : Number(n).toLocaleString('fr-FR').replace(/\u202f|\u00a0/g, ' '));

/**
 * Simulateur de liquidation de l'IR.
 * Estimation : base = CA - charges ; IR = base x 20 % (droit commun), puis
 * comparaison avec le cumul des acomptes deja verses.
 */
export default function SimulateurLiquidation({
  cumulAcomptes = 0,
  tauxDefaut = 20,
}) {
  const [ca, setCa] = useState('');
  const [charges, setCharges] = useState('');
  const [taux, setTaux] = useState(tauxDefaut);

  const resultat = useMemo(() => {
    const caNum = Number(ca) || 0;
    const chNum = Number(charges) || 0;
    const base = caNum - chNum;
    const baseArrondie = base > 0 ? Math.floor(base / 1000) * 1000 : 0;
    const ir = Math.round(baseArrondie * (Number(taux) / 100));
    const reste = ir - cumulAcomptes;
    return { baseArrondie, ir, reste };
  }, [ca, charges, taux, cumulAcomptes]);

  return (
    <div className="simulateur-panel simulateur-grid">
      <div className="simulateur-inputs">
        <div className="simulateur-champ">
          <div className="form-group">
            <label className="form-label">CA previsionnel (Ar)</label>
            <input type="number" className="form-input" value={ca}
              onChange={(e) => setCa(e.target.value)} placeholder="0" />
          </div>
          <div className="form-group">
            <label className="form-label">Charges ded. (Ar)</label>
            <input type="number" className="form-input" value={charges}
              onChange={(e) => setCharges(e.target.value)} placeholder="0" />
          </div>
          <div className="form-group">
            <label className="form-label">Taux (%)</label>
            <input type="number" className="form-input" value={taux}
              onChange={(e) => setTaux(e.target.value)} />
          </div>
        </div>
      </div>

      <div className="simulateur-resultats">
        <h3>Resultat estime</h3>
            <div className="simulateur-ligne">
              <span>Base imposable estimee</span>
              <strong>{fmt(resultat.baseArrondie)} Ar</strong>
            </div>
            <div className="simulateur-ligne">
              <span>IR estime</span>
              <strong>{fmt(resultat.ir)} Ar</strong>
            </div>
            <div className="simulateur-ligne">
              <span>Cumul acomptes verses</span>
              <strong>{fmt(cumulAcomptes)} Ar</strong>
            </div>
            <div className={'simulateur-ligne ' + (resultat.reste > 0 ? 'reste-a-payer' : 'credit')}>
              <span>{resultat.reste >= 0 ? 'Reste a payer' : 'Credit d impot'}</span>
              <strong>{fmt(Math.abs(resultat.reste))} Ar</strong>
            </div>
      </div>
    </div>
  );
}
