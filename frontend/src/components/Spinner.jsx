import { LuLoader } from "react-icons/lu";

// Spinner simple
function Spinner({ taille = 20, couleur = '#1a5c4a' }) {
  return (
    <span
      className="spinner"
      style={{
        width: taille,
        height: taille,
        borderColor: `${couleur} transparent ${couleur} ${couleur}`,
      }}
    />
  );
}

// Spinner avec icône
function SpinnerIcon({ taille = 20, couleur = '#ffffff' }) {
  return (
    <LuLoader
      className="icon"
      style={{
        width: taille,
        height: taille,
        color: couleur,
        animation: 'spin 0.8s linear infinite',
      }}
    />
  );
}

// Spinner dans un bouton
function ButtonSpinner({ taille = 16 }) {
  return (
    <LuLoader
      className="icon"
      style={{
        width: taille,
        height: taille,
        color: 'currentColor',
        animation: 'spin 0.8s linear infinite',
      }}
    />
  );
}

// Bloc de chargement
function LoadingBlock({ message = 'Chargement...' }) {
  return (
    <div className="loading-block">
      <div className="loading-spinner" />
      <span>{message}</span>
    </div>
  );
}

// Skeleton pour le chargement des cartes
function SkeletonCard() {
  return (
    <div className="card skeleton-card">
      <div className="skeleton skeleton-title" />
      <div className="skeleton skeleton-text long" />
      <div className="skeleton skeleton-text short" />
    </div>
  );
}

// Skeleton pour les lignes de tableau
function SkeletonTableRow({ cols = 4 }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, index) => (
        <td key={index}>
          <div className="skeleton skeleton-text" />
        </td>
      ))}
    </tr>
  );
}

// Skeleton pour le tableau complet
function SkeletonTable({ rows = 5, cols = 4 }) {
  return (
    <div className="table-container">
      <table className="data-table">
        <thead>
          <tr>
            {Array.from({ length: cols }).map((_, index) => (
              <th key={index}>
                <div className="skeleton skeleton-text short" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <SkeletonTableRow key={rowIndex} cols={cols} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Skeleton pour les stats cards
function SkeletonStatsGrid({ count = 4 }) {
  return (
    <div className="cards-grid">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="stat-card">
          <div className="skeleton skeleton-text short" />
          <div className="skeleton skeleton-text long" />
        </div>
      ))}
    </div>
  );
}

// Skeleton pour le formulaire
function SkeletonForm() {
  return (
    <div className="form-panel">
      <div className="skeleton skeleton-title" />
      <div className="skeleton skeleton-text long" style={{ marginBottom: 16 }} />
      <div className="skeleton skeleton-text long" style={{ marginBottom: 16 }} />
      <div className="skeleton skeleton-text long" style={{ marginBottom: 16 }} />
      <div className="skeleton skeleton-text short" />
    </div>
  );
}

// Skeleton pour la page complète
function SkeletonPage() {
  return (
    <div className="page">
      <div className="skeleton skeleton-text" style={{ width: '30%', marginBottom: 16 }} />
      <SkeletonStatsGrid count={4} />
      <SkeletonTable rows={5} cols={6} />
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
  SkeletonPage
};
