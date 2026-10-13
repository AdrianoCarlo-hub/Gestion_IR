export default function EmptyState({ icone, titre = 'Aucune donnee', texte = 'Aucune information disponible pour le moment.', action }) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon" aria-hidden="true">
        {icone}
      </div>
      {titre && <div className="empty-state-title">{titre}</div>}
      {texte && <div className="empty-state-text">{texte}</div>}
      {action && <div className="empty-state-action">{action}</div>}
    </div>
  );
}
