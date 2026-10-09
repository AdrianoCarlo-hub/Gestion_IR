import { useEffect, useState, useRef } from 'react';
import { LuTriangleAlert, LuInfo, LuX, LuCircleCheck, LuCircleX } from "react-icons/lu";

const ICONS = {
  warning: LuTriangleAlert,
  question: LuInfo,
  error: LuCircleX,
  danger: LuTriangleAlert,
};

export default function ConfirmDialog({
  ouvert,
  titre = 'Confirmation',
  message,
  texteConfirmer = 'Confirmer',
  texteAnnuler = 'Annuler',
  danger = false,
  onConfirmer,
  onAnnuler,
}) {
  const [visible, setVisible] = useState(false);
  const dialogRef = useRef(null);

  useEffect(() => {
    if (ouvert) {
      setVisible(true);
      document.body.style.overflow = 'hidden';
    } else {
      setVisible(false);
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [ouvert]);

  // Animation de fermeture
  useEffect(() => {
    if (!ouvert && visible) {
      const timer = setTimeout(() => {
        setVisible(false);
      }, 250); // Correspond a la duree de l'animation
      return () => clearTimeout(timer);
    }
  }, [ouvert, visible]);

  // Gestion des touches clavier
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape' && ouvert) {
        e.preventDefault();
        onAnnuler();
      }
      if (e.key === 'Enter' && ouvert) {
        e.preventDefault();
        onConfirmer();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [ouvert, onAnnuler, onConfirmer]);

  // Fermeture au clic sur l'arriere-plan
  const handleBackdropClick = (e) => {
    if (e.target === dialogRef.current) {
      onAnnuler();
    }
  };

  // Determination de l'icône selon le niveau de danger
  const getIconType = () => {
    if (danger) return 'warning';
    return 'question';
  };

  const Icon = ICONS[getIconType()] || LuInfo;

  if (!ouvert) return null;

  return (
    <div
      className={`modal-overlay ${visible ? 'visible' : ''}`}
      onClick={handleBackdropClick}
      ref={dialogRef}
    >
      <div
        className={`modal-box confirm-dialog ${visible ? 'visible' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Icône de confirmation */}
        <div className={`confirm-dialog-icon ${danger ? 'warning' : 'question'}`}>
          <Icon className="icon" />
        </div>
        
        {/* Header */}
        <div className="modal-header">
          <h3>{titre}</h3>
        </div>
        
        {/* Body */}
        <div className="modal-body">
          <p>{message}</p>
        </div>
        
        {/* Footer avec boutons */}
        <div className="modal-footer">
          <button 
            className="btn btn-secondary" 
            onClick={onAnnuler}
          >
            {texteAnnuler}
          </button>
          <button
            className={danger ? 'btn btn-danger' : 'btn btn-primary'}
            onClick={onConfirmer}
          >
            {texteConfirmer}
          </button>
        </div>
      </div>
    </div>
  );
}
