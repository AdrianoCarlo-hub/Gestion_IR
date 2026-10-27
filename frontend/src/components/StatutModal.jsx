import { useEffect, useState } from 'react';
import { Modal, Select, Tag, Button } from 'antd';


export default function StatutModal({
  ouvert,
  titre = 'Changer le statut',
  statutActuel,
  options = [],
  onChoisir,
  onFermer,
}) {
  const [choix, setChoix] = useState('');

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (ouvert) setChoix(statutActuel || '');
  }, [ouvert, statutActuel]);

  const optionsSelect = options.map((opt) => ({
    value: opt.value,
    disabled: opt.value === statutActuel,
    label: (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: opt.couleur || '#64748b',
            display: 'inline-block',
          }}
        />
        {opt.label}
      </span>
    ),
  }));

  const valider = () => {
    if (choix && choix !== statutActuel) onChoisir(choix);
    onFermer();
  };

  return (
    <Modal
      open={ouvert}
      title={titre}
      onCancel={onFermer}
      centered
      width={440}
      destroyOnHidden
      footer={[
        <Button key="annuler" onClick={onFermer}>
          Annuler
        </Button>,
        <Button
          key="valider"
          type="primary"
          disabled={!choix || choix === statutActuel}
          onClick={valider}
        >
          Valider
        </Button>,
      ]}
    >
      {statutActuel && (
        <p style={{ marginBottom: 16, color: '#64748b' }}>
          Statut actuel :{' '}
          <Tag color="blue" style={{ marginInlineStart: 4 }}>
            {statutActuel}
          </Tag>
        </p>
      )}
      <Select
        style={{ width: '100%' }}
        placeholder="Choisir un nouveau statut"
        value={choix || undefined}
        onChange={setChoix}
        options={optionsSelect}
      />
    </Modal>
  );
}
