import { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

let idCounter = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const remove = useCallback((id) => {
    setToasts((arr) => arr.filter((t) => t.id !== id));
  }, []);

  const push = useCallback((type, message, duree = 4000) => {
    const id = ++idCounter;
    setToasts((arr) => [...arr, { id, type, message }]);
    if (duree > 0) {
      setTimeout(() => remove(id), duree);
    }
    return id;
  }, [remove]);

  const success = useCallback((msg, d = 3500) => push('success', msg, d), [push]);
  const error   = useCallback((msg, d = 6000) => push('error', msg, d), [push]);
  const info    = useCallback((msg, d = 4000) => push('info', msg, d), [push]);
  const warning = useCallback((msg, d = 5000) => push('warning', msg, d), [push]);

  return (
    <ToastContext.Provider value={{ toasts, push, success, error, info, warning, remove }}>
      {children}
      <div className="toast-container">
        {toasts.map((t) => (
          <div key={t.id} className={'toast toast-' + t.type} onClick={() => remove(t.id)}>
            <div className="toast-icon">
              {t.type === 'success' && '✓'}
              {t.type === 'error' && '!'}
              {t.type === 'info' && 'i'}
              {t.type === 'warning' && '⚠'}
            </div>
            <div className="toast-message">{t.message}</div>
            <button className="toast-close" onClick={() => remove(t.id)}>×</button>
          </div>
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
