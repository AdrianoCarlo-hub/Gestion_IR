const SIZE_MAP = {
  petit: 12,
  moyen: 18,
  grand: 26,
};

export default function SafidyLoader({ taille = 'moyen', label = 'Chargement...' }) {
  const size = SIZE_MAP[taille] ?? SIZE_MAP.moyen;

  return (
    <div className="safidy-loader-wrap" aria-live="polite" aria-busy="true">
      <div className="safidy-loader" style={{ height: `${size * 2.1}px` }} aria-hidden="true">
        <span style={{ height: `${size * 0.75}px` }} />
        <span style={{ height: `${size * 1.4}px` }} />
        <span style={{ height: `${size * 1}px` }} />
      </div>
      {label && <span className="safidy-loader-label">{label}</span>}
    </div>
  );
}
