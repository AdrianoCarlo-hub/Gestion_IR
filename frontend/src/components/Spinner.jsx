export default function Spinner({ taille = 20, couleur = '#1a5c4a' }) {
  return (
    <span
      className="spinner"
      style={{
        width: taille,
        height: taille,
        borderColor: couleur + ' transparent ' + couleur + ' ' + couleur,
      }}
    />
  );
}

export function LoadingBlock({ message = 'Chargement...' }) {
  return (
    <div className="loading-block">
      <Spinner taille={32} />
      <span>{message}</span>
    </div>
  );
}
