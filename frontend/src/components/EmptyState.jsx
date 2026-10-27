import { Empty } from 'antd';

export default function EmptyState({
  icone,
  titre = 'Aucune donnee',
  texte = 'Aucune information disponible pour le moment.',
  action,
}) {
  return (
    <div style={{ textAlign: 'center', padding: '28px 0' }}>
      <Empty
        image={icone ? undefined : Empty.PRESENTED_IMAGE_SIMPLE}
        description={
          <span>
            <strong>{titre}</strong>
            {texte && (
              <span style={{ display: 'block', color: '#6b7f7a', fontSize: 13 }}>
                {texte}
              </span>
            )}
          </span>
        }
      >
        {action}
      </Empty>
    </div>
  );
}
