import { useEffect, useState } from 'react';
import { LuSearch, LuX } from 'react-icons/lu';

/**
 * Barre de recherche avec debounce.
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
    setLocal(initialValue);
  }, [initialValue]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (local !== initialValue) onChange(local);
    }, delai);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [local, delai]);

  const handleClear = () => {
    setLocal('');
    onChange('');
  };

  return (
    <div className="search-bar">
      <div className="search-input-wrapper">
        <LuSearch className="search-icon" size={16} />
        <input
          type="text"
          className="search-input form-input"
          value={local}
          onChange={(e) => setLocal(e.target.value)}
          placeholder={placeholder}
        />
        {local && (
          <button
            type="button"
            className="search-clear"
            onClick={handleClear}
            title="Effacer"
          >
            <LuX size={14} />
          </button>
        )}
      </div>
      {children}
    </div>
  );
}
