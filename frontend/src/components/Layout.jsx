import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import useInactivityLogout from '../hooks/useInactivityLogout';

export default function Layout() {
  // Déconnexion automatique après 15 min d'inactivité
  useInactivityLogout();

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}
