/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useMemo, useCallback } from 'react';
import { App as AntApp } from 'antd';
import { DUREE_TOAST_MS } from '../config/messageConfig';

const ToastContext = createContext(null);

/**
 * Toasts basees sur Ant Design (message).
 * API : toast.success(msg, dureeMs?), toast.error(...), toast.info(...),
 *       toast.warning(...), toast.push(type, msg, dureeMs?).
 *
 * Pieges antd v6 evites ici (source du bug "notifications persistantes") :
 *  - le 2e argument positionnel de message.success(msg, X) est la DUREE,
 *    pas un objet de configuration. Passer { duration: 5 } a cet endroit
 *    fait retomber la duree a 0 => la notification ne se ferme JAMAIS.
 *  - la duree est exprimee en SECONDES par antd, alors que l'API publique
 *    de ce contexte reste en MILLISECONDES (coherent avec l'existant).
 *  - pauseOnHover est desactive (voir config/messageConfig.js) pour qu'un
 *    survol de la souris ne puisse pas figer une notification a l'ecran.
 */
export function ToastProvider({ children }) {
  const { message } = AntApp.useApp();

  const push = useCallback(
    (type, contenu, dureeMs = DUREE_TOAST_MS) => {
      const ms = Number(dureeMs);
      // Duree en secondes pour antd. Toujours > 0 : jamais de notification persistante.
      const dureeSecondes = Number.isFinite(ms) && ms > 0 ? ms / 1000 : DUREE_TOAST_MS / 1000;
      const typeValide = ['success', 'error', 'warning', 'info'].includes(type) ? type : 'info';

      // message.open() est la seule API acceptant un objet de configuration :
      // la duree y est un nombre de secondes, donc le minuteur se lance.
      message.open({
        content: contenu,
        type: typeValide,
        duration: dureeSecondes,
      });
    },
    [message]
  );

  const success = useCallback((msg, dureeMs) => push('success', msg, dureeMs), [push]);
  const error = useCallback((msg, dureeMs) => push('error', msg, dureeMs), [push]);
  const info = useCallback((msg, dureeMs) => push('info', msg, dureeMs), [push]);
  const warning = useCallback((msg, dureeMs) => push('warning', msg, dureeMs), [push]);

  const value = useMemo(
    () => ({ push, success, error, info, warning }),
    [push, success, error, info, warning]
  );

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast doit etre utilise dans ToastProvider');
  return ctx;
}
