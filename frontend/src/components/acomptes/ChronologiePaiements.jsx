import { Timeline, Tag, Typography } from 'antd';
import EmptyState from '../EmptyState';
import { formatAr } from '../../utils/format';

const { Text } = Typography;

function ligneMontant(label, valeur, options = {}) {
  const { total = false } = options;
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        gap: 10,
        padding: total ? '5px 8px' : '2px 0',
        background: total ? '#eef4f2' : undefined,
        borderRadius: total ? 6 : undefined,
      }}
    >
      <Text type="secondary" style={total ? { color: '#0a2c22' } : undefined}>
        {label}
      </Text>
      <Text strong>{formatAr(valeur)}</Text>
    </div>
  );
}

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

  const items = [];

  if (montrerCreation) {
    items.push({
      key: 'creation',
      color: 'gray',
      title: String(anneeCreation),
      content: (
        <div style={{ paddingBottom: 4 }}>
          <Text strong>Annee de creation</Text>
          <div style={{ fontSize: 13, color: '#6b7f7a' }}>
            Aucun acompte provisionnel : pas d&apos;IR N-1 de reference.
          </div>
        </div>
      ),
    });
  }

  periodes.forEach((periode) => {
    const estCreation = anneeCreation && periode.annee === anneeCreation;
    const enCours = Number(periode.annee) === Number(annee);

    const contenu = periode.eligible ? (
      <div style={{ paddingBottom: 4 }}>
        <div style={{ marginBottom: 6 }}>
          <Text strong>Echeances {periode.annee}</Text>
          {enCours && (
            <Tag color="green" style={{ marginInlineStart: 8 }}>
              Exercice en cours
            </Tag>
          )}
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
            gap: '2px 20px',
            fontSize: 13,
          }}
        >
          {ligneMontant(
            '15 mai - Solde IR ' + (periode.annee - 1),
            periode.echeance15Mai?.soldeN1
          )}
          {ligneMontant('Acompte 1 (50 % de l IR N-1)', periode.echeance15Mai?.acompte1N)}
          {ligneMontant('Total du 15 mai', periode.echeance15Mai?.total, { total: true })}
          {ligneMontant(
            '15 novembre - Acompte 2',
            periode.echeance15Novembre?.acompte2N
          )}
        </div>
        {enCours && acomptesVerses > 0 && (
          <div style={{ marginTop: 8, fontSize: 12 }}>
            <Text type="secondary">
              Acomptes enregistres pour l&apos;exercice :{' '}
              <Text strong>{formatAr(acomptesVerses)}</Text>
            </Text>
          </div>
        )}
      </div>
    ) : (
      <div style={{ paddingBottom: 4 }}>
        <div style={{ marginBottom: 4 }}>
          <Text strong>{estCreation ? 'Annee de creation' : "Pas d'acompte provisionnel"}</Text>
        </div>
        <div style={{ fontSize: 13, color: '#6b7f7a' }}>
          {periode.message ||
            "Aucun IR N-1 valide : aucun acompte provisionnel n'est genere."}
        </div>
        {estCreation && irN1 > 0 && (
          <div style={{ marginTop: 4, fontSize: 12 }}>
            <Text type="secondary">
              IR de reference enregistre : <Text strong>{formatAr(irN1)}</Text>
            </Text>
          </div>
        )}
      </div>
    );

    items.push({
      key: 'periode-' + periode.annee,
      color: periode.eligible ? (enCours ? 'green' : 'blue') : 'gray',
      title: `Exercice ${periode.annee}`,
      content: contenu,
    });
  });

  if (items.length === 0) {
    return (
      <EmptyState
        titre="Aucune chronologie"
        texte="Aucune declaration validee disponible pour construire la chronologie."
      />
    );
  }

  return <Timeline items={items} />;
}
