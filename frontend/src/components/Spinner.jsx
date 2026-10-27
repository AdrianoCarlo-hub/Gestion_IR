import { Spin, Skeleton, Card } from 'antd';

// Spinner simple
function Spinner({ taille = 20 }) {
  return <Spin size="small" style={{ width: taille, height: taille }} />;
}

// Spinner avec icone (dans un bouton / badge)
function SpinnerIcon({ taille = 16 }) {
  return <Spin size="small" style={{ width: taille, height: taille }} />;
}

// Spinner dans un bouton
function ButtonSpinner() {
  return <Spin size="small" />;
}

// Bloc de chargement centre
function LoadingBlock({ message = 'Chargement...' }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        padding: '60px 0',
        color: '#6b7f7a',
      }}
    >
      <Spin size="large" />
      <span style={{ fontSize: 13 }}>{message}</span>
    </div>
  );
}

// Carte de chargement
function SkeletonCard() {
  return (
    <Card>
      <Skeleton active paragraph={{ rows: 2 }} title={{ width: '40%' }} />
    </Card>
  );
}

// Ligne de chargement (tableau brut)
function SkeletonTableRow({ cols = 4 }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, index) => (
        <td key={index} style={{ padding: '12px 8px' }}>
          <Skeleton.Input active block size="small" />
        </td>
      ))}
    </tr>
  );
}

// Tableau de chargement
function SkeletonTable({ rows = 5, cols = 4 }) {
  const largeur = `${Math.max(20, Math.floor(80 / Math.max(cols, 1)))}%`;
  return (
    <Card>
      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        {Array.from({ length: Math.min(cols, 6) }).map((_, index) => (
          <Skeleton.Input
            key={index}
            active
            size="small"
            style={{ width: index === 0 ? largeur : '18%' }}
          />
        ))}
      </div>
      <Skeleton.Node active style={{ width: '100%', height: rows * 34 + 24 }} />
    </Card>
  );
}

// Grille de cartes de statistiques
function SkeletonStatsGrid({ count = 4 }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
      {Array.from({ length: count }).map((_, index) => (
        <Card key={index}>
          <Skeleton active paragraph={{ rows: 1 }} title={{ width: '55%' }} />
        </Card>
      ))}
    </div>
  );
}

// Formulaire de chargement
function SkeletonForm() {
  return (
    <Card>
      <Skeleton active paragraph={{ rows: 4 }} title={{ width: '45%' }} />
    </Card>
  );
}

// Page complete
function SkeletonPage({ rows = 5, cols = 6 }) {
  return (
    <div className="page">
      <Skeleton.Input active size="small" style={{ width: 240 }} />
      <SkeletonStatsGrid count={4} />
      <SkeletonTable rows={rows} cols={cols} />
    </div>
  );
}

export {
  Spinner,
  SpinnerIcon,
  ButtonSpinner,
  LoadingBlock,
  SkeletonCard,
  SkeletonTableRow,
  SkeletonTable,
  SkeletonStatsGrid,
  SkeletonForm,
  SkeletonPage,
};
