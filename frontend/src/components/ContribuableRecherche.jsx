import { useEffect, useMemo, useRef, useState } from 'react';
import { LuSearch, LuX } from 'react-icons/lu';

// Libelle affiche pour un contribuable
const libelle = (c) => `${c.nif} - ${c.raisonSociale}`;

/**
 * Champ de recherche de contribuable avec suggestions (autocomplete).
 *
 * Props :
 *  - contribuables : liste complete chargee par la page
 *  - value         : id du contribuable selectionne (string ou number)
 *  - onChange      : (id, contribuable|null) => void
 *  - placeholder   : texte d'aide
 *  - max           : nombre maximum de suggestions affichees (8 par defaut)
 *  - disabled      : desactive le champ
 *
 * La recherche porte sur le NIF, la raison sociale et le nom du dirigeant.
 */
export default function ContribuableRecherche({
  contribuables = [],
  value = '',
  onChange,
  placeholder = 'Rechercher un contribuable (NIF, nom, raison sociale)...',
  max = 8,
  disabled = false,
}) {
  const [texte, setTexte] = useState('');
  const [editing, setEditing] = useState(false);
  const [ouvert, setOuvert] = useState(false);
  const [index, setIndex] = useState(0);
  const wrapRef = useRef(null);

  const selection = useMemo(
    () => contribuables.find((c) => String(c.idContribuable) === String(value)),
    [contribuables, value]
  );

  // Valeur affichee : le texte saisi pendant l'edition, sinon le libelle de la selection
  const affiche = editing ? texte : selection ? libelle(selection) : '';

  // Ferme la liste au clic exterieur
  useEffect(() => {
    const onDown = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOuvert(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  const resultats = useMemo(() => {
    if (!editing) return [];
    const t = texte.trim().toLowerCase();
    if (!t) return contribuables.slice(0, max);
    return contribuables
      .filter(
        (c) =>
          (c.nif || '').toLowerCase().includes(t) ||
          (c.raisonSociale || '').toLowerCase().includes(t) ||
          (c.nomDirigeant || '').toLowerCase().includes(t)
      )
      .slice(0, max);
  }, [editing, texte, contribuables, max]);

  const choisir = (c) => {
    if (onChange) onChange(String(c.idContribuable), c);
    setEditing(false);
    setTexte('');
    setOuvert(false);
    setIndex(0);
  };

  const handleFocus = () => {
    setEditing(true);
    setTexte('');
    setOuvert(true);
    setIndex(0);
  };

  const handleChange = (e) => {
    setTexte(e.target.value);
    setOuvert(true);
    setIndex(0);
    // L'utilisateur retape : la selection precedente n'est plus valable
    if (selection && onChange) onChange('', null);
  };

  const handleBlur = () => {
    // Laisse le temps au clic sur une suggestion (onMouseDown) de se declencher
    setTimeout(() => {
      setEditing(false);
      setOuvert(false);
    }, 120);
  };

  const handleClear = () => {
    setEditing(true);
    setTexte('');
    setOuvert(true);
    if (onChange) onChange('', null);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!ouvert) setOuvert(true);
      else setIndex((i) => Math.min(i + 1, resultats.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      if (ouvert && resultats[index]) {
        e.preventDefault();
        choisir(resultats[index]);
      }
    } else if (e.key === 'Escape') {
      setOuvert(false);
    }
  };

  return (
    <div className="combobox" ref={wrapRef}>
      <div className="combobox-input-wrapper">
        <LuSearch className="combobox-icon" size={16} />
        <input
          type="text"
          className="form-input combobox-input"
          value={affiche}
          placeholder={placeholder}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          autoComplete="off"
        />
        {affiche && !disabled && (
          <button type="button" className="combobox-clear" onClick={handleClear} title="Effacer">
            <LuX size={14} />
          </button>
        )}
      </div>

      {ouvert && resultats.length > 0 && (
        <ul className="combobox-menu">
          {resultats.map((c, i) => (
            <li
              key={c.idContribuable}
              className={'combobox-item' + (i === index ? ' active' : '')}
              onMouseDown={(e) => {
                e.preventDefault();
                choisir(c);
              }}
              onMouseEnter={() => setIndex(i)}
            >
              <span className="combobox-item-nif">{c.nif}</span>
              <span className="combobox-item-rs">{c.raisonSociale}</span>
              {c.nomDirigeant && <span className="combobox-item-dir">{c.nomDirigeant}</span>}
            </li>
          ))}
        </ul>
      )}

      {ouvert && editing && texte.trim() && resultats.length === 0 && (
        <ul className="combobox-menu">
          <li className="combobox-empty">Aucun contribuable trouve</li>
        </ul>
      )}
    </div>
  );
}
