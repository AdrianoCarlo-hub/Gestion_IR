/**
 * Configuration globale des notifications (Ant Design `message`).
 *
 * - duration      : 5 SECONDES (unite antd v6) => chaque notification
 *                   disparait automatiquement apres 5 s.
 * - maxCount      : 3 notifications maximum empilees a l'ecran.
 * - pauseOnHover  : false => un survol de la souris ne peut pas figer
 *                   une notification a l'ecran.
 * - top           : decalage vertical du conteneur de notifications.
 */
export const MESSAGE_CONFIG = {
  duration: 5,
  maxCount: 3,
  top: 24,
  pauseOnHover: false,
};

/** Duree par defaut d'une notification, en millisecondes. */
export const DUREE_TOAST_MS = MESSAGE_CONFIG.duration * 1000;

/** Nombre maximum de notifications affichees simultanement. */
export const MAX_TOASTS = MESSAGE_CONFIG.maxCount;
