import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const DUREE_INACTIVITE_MS = 15 * 60 * 1000; // 15 minutes
const AVERTISSEMENT_AVANT_MS = 60 * 1000;   // toast 1 min avant

export default function useInactivityLogout() {
  const { isAuth, logout } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  // Refs pour éviter que le useEffect se relance à chaque render
  const toastRef = useRef(toast);
  const logoutRef = useRef(logout);
  const navigateRef = useRef(navigate);

  // Mise à jour des refs sans relancer le useEffect
  useEffect(() => {
    toastRef.current = toast;
    logoutRef.current = logout;
    navigateRef.current = navigate;
  });

  useEffect(() => {
    if (!isAuth) return;

    let timerAvertissement = null;
    let timerDeconnexion = null;

    const reset = () => {
      if (timerAvertissement) clearTimeout(timerAvertissement);
      if (timerDeconnexion) clearTimeout(timerDeconnexion);

      // Phase 1 : attendre (15 min - 1 min) puis afficher le toast
      timerAvertissement = setTimeout(() => {
        toastRef.current.warning(
          'Vous allez etre deconnecte dans 1 minute pour inactivite...',
          60000
        );

        // Phase 2 : après 1 minute, déconnecter
        timerDeconnexion = setTimeout(() => {
          logoutRef.current();
          toastRef.current.info(
            'Session expiree pour inactivite. Veuillez vous reconnecter.',
            5000
          );
          navigateRef.current('/login', { replace: true });
        }, AVERTISSEMENT_AVANT_MS);
      }, DUREE_INACTIVITE_MS - AVERTISSEMENT_AVANT_MS);
    };

    const events = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    events.forEach((e) => window.addEventListener(e, reset, { passive: true }));

    reset(); // Démarre le premier cycle

    return () => {
      events.forEach((e) => window.removeEventListener(e, reset));
      if (timerAvertissement) clearTimeout(timerAvertissement);
      if (timerDeconnexion) clearTimeout(timerDeconnexion);
    };
  }, [isAuth]); // ✅ Une seule dépendance : isAuth
}
