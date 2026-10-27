import { useEffect, useState } from 'react';
import { Input, Space } from 'antd';

/**
 * Barre de recherche avec debounce (API conservee).
 *
 * Props :
 *  - value       : valeur initiale (optionnel)
 *  - onChange    : (valeur) => void — appele APRES le debounce
 *  - placeholder : texte du placeholder
 *  - delai       : delai du debounce en ms (300 par defaut)
 *  - children    : filtres additionnels (select, etc.)
 */
export default function SearchBar({
  value: initialValue = '',
  onChange,
  placeholder = 'Rechercher...',
  delai = 300,
  children,
}) {
  const [local, setLocal] = useState(initialValue);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLocal(initialValue);
  }, [initialValue]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (local !== initialValue) onChange(local);
    }, delai);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [local, delai]);

  return (
    <Space wrap size={8}>
      <Input
        allowClear
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        placeholder={placeholder}
        style={{ width: 260 }}
      />
      {children}
    </Space>
  );
}
