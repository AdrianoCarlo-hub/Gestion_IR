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
  const timerRef = useRef(null);
  const avertissementRef = useRef(false);

  useEffect(() => {
    if (!isAuth) return;

    const reset = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      avertissementRef.current = false;

      timerRef.current = setTimeout(() => {
        toast.warning('Vous allez etre deconnecte dans 1 minute pour inactivite...', 60000);
        avertissementRef.current = true;

        timerRef.current = setTimeout(() => {
          logout();
          toast.info('Session expiree pour inactivite. Veuillez vous reconnecter.');
          navigate('/login', { replace: true });
        }, AVERTISSEMENT_AVANT_MS);
      }, DUREE_INACTIVITE_MS - AVERTISSEMENT_AVANT_MS);
    };

    const events = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    events.forEach((e) => window.addEventListener(e, reset, { passive: true }));

    reset();

    return () => {
      events.forEach((e) => window.removeEventListener(e, reset));
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isAuth, logout, navigate, toast]);
}
