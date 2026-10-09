import { Outlet, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import useInactivityLogout from '../hooks/useInactivityLogout';

export default function Layout() {
  // Deconnexion automatique apres 15 min d'inactivite
  useInactivityLogout();

  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Fermer la sidebar sur changement de route (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [location]);

  // Gestion du clic sur le backdrop
  const handleBackdropClick = () => {
    setSidebarOpen(false);
  };

  // Toggle sidebar pour mobile
  const toggleSidebar = () => {
    setSidebarOpen((prev) => !prev);
  };

  return (
    <div className="app-shell">
      {/* Backdrop pour mobile */}
      {sidebarOpen && (
        <div
          className="modal-overlay"
          onClick={handleBackdropClick}
          style={{
            zIndex: 9997,
            backdropFilter: 'blur(2px)'
          }}
        />
      )}

      {/* Sidebar avec classe mobile-open pour mobile */}
      <Sidebar className={sidebarOpen ? 'mobile-open' : ''} />

      {/* Bouton menu hamburger pour mobile */}
      <button
        type="button"
        className="mobile-menu-toggle"
        onClick={toggleSidebar}
        aria-label="Ouvrir le menu"
      >
        <svg
          style={{ width: 20, height: 20 }}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}
