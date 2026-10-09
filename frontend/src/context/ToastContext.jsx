import { createContext, useContext, useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { LuCircleCheck, LuCircleX, LuInfo, LuTriangleAlert, LuX } from "react-icons/lu";

const ToastContext = createContext(null);

let idCounter = 0;

// Composant Toast individuel
function ToastItem({ toast, onRemove, index }) {
  const [exiting, setExiting] = useState(false);
  const [timer, setTimer] = useState(null);

  const handleRemove = useCallback(() => {
    setExiting(true);
    setTimeout(() => {
      onRemove(toast.id);
    }, 300); // Correspond a la duree de l'animation
  }, [onRemove, toast.id]);

  // Gestion du timer auto-dismiss
  useEffect(() => {
    if (toast.duree > 0 && !exiting) {
      const t = setTimeout(() => {
        handleRemove();
      }, toast.duree);
      setTimer(t);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [toast.duree, exiting, handleRemove]);

  // Pause au survol
  const handleMouseEnter = useCallback(() => {
    if (timer) {
      clearTimeout(timer);
      setTimer(null);
    }
  }, [timer]);

  const handleMouseLeave = useCallback(() => {
    if (toast.duree > 0 && !exiting) {
      const t = setTimeout(() => {
        handleRemove();
      }, toast.duree);
      setTimer(t);
    }
  }, [toast.duree, exiting, handleRemove]);

  // Selection de l'icône selon le type
  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return <LuCircleCheck className="icon" style={{ width: 16, height: 16 }} />;
      case 'error':
        return <LuCircleX className="icon" style={{ width: 16, height: 16 }} />;
      case 'info':
        return <LuInfo className="icon" style={{ width: 16, height: 16 }} />;
      case 'warning':
        return <LuTriangleAlert className="icon" style={{ width: 16, height: 16 }} />;
      default:
        return <LuInfo className="icon" style={{ width: 16, height: 16 }} />;
    }
  };

  return (
    <div
      className={`toast ${toast.type} ${exiting ? 'toast-exit' : ''}`}
      onClick={handleRemove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        animationDelay: `${index * 50}ms`,
        zIndex: 10000 + index
      }}
    >
      <div className="toast-icon">
        {getIcon(toast.type)}
      </div>
      <div className="toast-message">{toast.message}</div>
      <button
        className="toast-close"
        onClick={(e) => {
          e.stopPropagation();
          handleRemove();
        }}
        aria-label="Fermer"
      >
        <LuX className="icon" />
      </button>
    </div>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const remove = useCallback((id) => {
    setToasts((arr) => arr.filter((t) => t.id !== id));
  }, []);

  const push = useCallback((type, message, duree = 4000) => {
    const id = ++idCounter;
    setToasts((arr) => [...arr, { id, type, message, duree }]);
    return id;
  }, []);

  const success = useCallback((msg, d = 3500) => push('success', msg, d), [push]);
  const error = useCallback((msg, d = 6000) => push('error', msg, d), [push]);
  const info = useCallback((msg, d = 4000) => push('info', msg, d), [push]);
  const warning = useCallback((msg, d = 5000) => push('warning', msg, d), [push]);

  // Memo pour la valeur du contexte
  const value = useMemo(
    () => ({ toasts, push, success, error, info, warning, remove }),
    [toasts, push, success, error, info, warning, remove]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-container">
        {toasts.map((t, index) => (
          <ToastItem
            key={t.id}
            toast={t}
            onRemove={remove}
            index={index}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast doit etre utilise dans ToastProvider');
  return ctx;
}
