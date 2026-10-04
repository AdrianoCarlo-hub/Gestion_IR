import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { isAuth } = useAuth();

  // Securite renforcee : si pas de token en sessionStorage,
  // redirection vers login, quelle que soit la route demandee
  const token = sessionStorage.getItem('token');

  if (!isAuth || !token) {
    return <Navigate to="/login" replace />;
  }
  return children;
}
