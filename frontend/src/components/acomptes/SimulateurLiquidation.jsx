import { useMemo, useState } from 'react';
import { LuCalculator } from 'react-icons/lu';

const fmt = (n) => (n == null ? '0' : Number(n).toLocaleString('fr-FR').replace(/\u202f|\u00a0/g, ' '));

/**
 * Simulateur de liquidation de l'IR.
 * Estimation : base = CA - charges ; IR = base x 20 % (droit commun), puis
 * comparaison avec le cumul des acomptes deja verses.
 */
export default function SimulateurLiquidation({
  cumulAcomptes = 0,
  tauxDefaut = 20,
  chronologie = [],
}) {
  const [ca, setCa] = useState('');
  const [charges, setCharges] = useState('');
  const [taux, setTaux] = useState(tauxDefaut);
  const [mode, setMode] = useState('simulation');

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
    <div className="simulateur-panel">
      <div className="simulateur-header">
        <h3 className="section-title">
          <LuCalculator className="section-icon" />
          Simulateur de liquidation
        </h3>
        <div className="simulateur-modes">
          <button type="button" className={'btn-secondary' + (mode === 'simulation' ? ' is-active' : '')}
            onClick={() => setMode('simulation')}>Simulation</button>
          <button type="button" className={'btn-secondary' + (mode === 'chronologie' ? ' is-active' : '')}
            onClick={() => setMode('chronologie')}>Chronologie</button>
        </div>
      </div>

      {mode === 'simulation' ? (
        <>
          <div className="form-row">
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

          <div className="simulateur-resultats">
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
        </>
      ) : (
        <div className="acompte-chronologie">
          {chronologie.length === 0 ? (
            <p className="acompte-chronologie-vide">
              Aucune declaration IR validee disponible pour afficher la chronologie.
            </p>
          ) : chronologie.map((periode) => (
            <div className="acompte-chronologie-item" key={periode.annee}>
              <strong>Annee {periode.annee}</strong>
              {!periode.eligible ? (
                <span>{periode.message || 'Aucun acompte provisionnel : aucun IR N-1 valide.'}</span>
              ) : (
                <>
                  <span>15 mai : solde IR {periode.annee - 1} : {fmt(periode.echeance15Mai.soldeN1)} Ar</span>
                  <span>Acompte 1 : {fmt(periode.echeance15Mai.acompte1N)} Ar</span>
                  <b>Total du 15 mai : {fmt(periode.echeance15Mai.total)} Ar</b>
                  <span>15 novembre : acompte 2 : {fmt(periode.echeance15Novembre.acompte2N)} Ar</span>
                  <b>Total du 15 novembre : {fmt(periode.echeance15Novembre.total)} Ar</b>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
