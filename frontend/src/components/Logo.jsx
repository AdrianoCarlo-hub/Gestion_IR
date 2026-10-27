import { useState } from 'react';

/**
 * Logo de l'application.
 * Charge /logo.png (fourni par le centre fiscal) et bascule sur un
 * libelle de repli si l'image n'est pas encore installee.
 */
export default function Logo({
  size = 32,
  repli = 'IR',
  style = {},
  fondRepli = '#0E7A55',
  couleurRepli = '#fff',
}) {
  const [ko, setKo] = useState(false);

  if (ko) {
    return (
      <div
        style={{
          width: size,
          height: size,
          borderRadius: Math.max(6, Math.round(size * 0.2)),
          background: fondRepli,
          color: couleurRepli,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 700,
          fontSize: Math.max(11, Math.round(size * 0.38)),
          flexShrink: 0,
          ...style,
        }}
      >
        {repli}
      </div>
    );
  }

  return (
    <img
      src="/logo.png"
      alt="Logo"
      onError={() => setKo(true)}
      style={{
        width: size,
        height: size,
        objectFit: 'contain',
        borderRadius: Math.max(6, Math.round(size * 0.2)),
        background: '#fff',
        flexShrink: 0,
        ...style,
      }}
    />
  );
}
