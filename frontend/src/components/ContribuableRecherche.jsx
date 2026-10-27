import { useMemo, useState, useEffect } from 'react';
import { AutoComplete, Tag, Typography } from 'antd';

const { Text } = Typography;

// Libelle affiche pour un contribuable
const libelle = (c) => `${c.nif} - ${c.raisonSociale}`;

/**
 * Champ de recherche de contribuable avec suggestions (autocomplete Ant Design).
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

  const selection = useMemo(
    () => contribuables.find((c) => String(c.idContribuable) === String(value)),
    [contribuables, value]
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTexte(selection ? libelle(selection) : '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const options = useMemo(() => {
    const t = texte.trim().toLowerCase();
    const base = t
      ? contribuables.filter(
          (c) =>
            (c.nif || '').toLowerCase().includes(t) ||
            (c.raisonSociale || '').toLowerCase().includes(t) ||
            (c.nomDirigeant || '').toLowerCase().includes(t)
        )
      : contribuables;
    return base.slice(0, max).map((c) => ({
      value: String(c.idContribuable),
      libelle: libelle(c),
      contribuable: c,
      label: (
        <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.25 }}>
          <span>
            <Tag color="green" style={{ marginInlineEnd: 6 }}>
              {c.nif}
            </Tag>
            <Text strong>{c.raisonSociale}</Text>
          </span>
          {c.nomDirigeant && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              Dirigeant : {c.nomDirigeant}
            </Text>
          )}
        </span>
      ),
    }));
  }, [texte, contribuables, max]);

  const handleSelect = (_val, option) => {
    setTexte(option.libelle);
    if (onChange) onChange(option.value, option.contribuable);
  };

  const handleChange = (v) => {
    setTexte(v);
    if (selection && onChange) onChange('', null);
  };

  const handleClear = () => {
    setTexte('');
    if (onChange) onChange('', null);
  };

  return (
    <AutoComplete
      style={{ width: '100%', maxWidth: 520 }}
      value={texte}
      options={options}
      onChange={handleChange}
      onSelect={handleSelect}
      onClear={handleClear}
      allowClear
      placeholder={placeholder}
      disabled={disabled}
      filterOption={false}
      notFoundContent={texte.trim() ? 'Aucun contribuable trouve' : null}
    />
  );
}
