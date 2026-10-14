import { LuCalendarClock, LuCircleCheck, LuCircleDashed } from 'react-icons/lu';

const fmt = (n) => (n == null ? '0' : Number(n).toLocaleString('fr-FR').replace(/\u202f|\u00a0/g, ' '));

export default function ChronologiePaiements({
  anneeCreation,
  annee,
  irN1,
  acomptesVerses,
  chronologie = [],
}) {
  const periodes = [...chronologie].sort((a, b) => a.annee - b.annee);
  const anneesAffichees = new Set(periodes.map((periode) => periode.annee));
  const montrerCreation = anneeCreation && !anneesAffichees.has(anneeCreation);

  return (
    <div className="chronologie" aria-label="Chronologie des paiements">
      {montrerCreation && (
        <article className="chronologie-etape chronologie-etape--creation">
          <span className="chronologie-point"><LuCircleDashed /></span>
          <div className="chronologie-contenu">
            <span className="chronologie-date">{anneeCreation}</span>
            <h3>Annee de creation</h3>
            <p>Aucun acompte provisionnel : pas d'IR N-1 de reference.</p>
          </div>
        </article>
      )}

      {periodes.length === 0 && !montrerCreation ? (
        <div className="chronologie-vide">
          <LuCalendarClock aria-hidden="true" />
          <p>Aucune declaration validee disponible pour construire la chronologie.</p>
        </div>
      ) : (
        periodes.map((periode) => {
          const estAnneeCreation = anneeCreation && periode.annee === anneeCreation;
          return (
            <article className={'chronologie-etape' + (periode.annee === annee ? ' is-current' : '')}
              key={periode.annee}>
              <span className="chronologie-point">
                {periode.eligible ? <LuCircleCheck /> : <LuCircleDashed />}
              </span>
              <div className="chronologie-contenu">
                <span className="chronologie-date">Exercice {periode.annee}</span>
                {estAnneeCreation || !periode.eligible ? (
                  <>
                    <h3>{estAnneeCreation ? 'Annee de creation' : "Pas d'acompte provisionnel"}</h3>
                    <p>{periode.message || "Aucun IR N-1 valide : aucun acompte provisionnel n'est genere."}</p>
                    {estAnneeCreation && irN1 > 0 && (
                      <p className="chronologie-note">IR de reference enregistre : {fmt(irN1)} Ar</p>
                    )}
                  </>
                ) : (
                  <>
                    <h3>Echeances {periode.annee}</h3>
                    <div className="chronologie-lignes">
                      <div>
                        <span>15 mai — Solde IR {periode.annee - 1}</span>
                        <strong>{fmt(periode.echeance15Mai.soldeN1)} Ar</strong>
                      </div>
                      <div>
                        <span>Acompte 1 (50 % de l'IR N-1)</span>
                        <strong>{fmt(periode.echeance15Mai.acompte1N)} Ar</strong>
                      </div>
                      <div className="chronologie-total">
                        <span>Total du 15 mai</span>
                        <strong>{fmt(periode.echeance15Mai.total)} Ar</strong>
                      </div>
                      <div>
                        <span>15 novembre — Acompte 2</span>
                        <strong>{fmt(periode.echeance15Novembre.acompte2N)} Ar</strong>
                      </div>
                    </div>
                    {periode.annee === annee && acomptesVerses > 0 && (
                      <p className="chronologie-note">Acomptes enregistres pour l'exercice : {fmt(acomptesVerses)} Ar</p>
                    )}
                  </>
                )}
              </div>
            </article>
          );
        })
      )}
    </div>
  );
}
