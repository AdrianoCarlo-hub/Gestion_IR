import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const items = [
  { to: '/dashboard', label: 'Tableau de bord' },
  { to: '/contribuables', label: 'Contribuables' },
  { to: '/declarations', label: 'Declarations IR' },
  { to: '/deficits', label: 'Deficits' },
  { to: '/acomptes', label: 'Acomptes' },
  { to: '/paiements', label: 'Paiements' },
  { to: '/penalites', label: 'Penalites' },
  { to: '/suspensions', label: 'Arret / reprise' },
  { to: '/statistiques', label: 'Statistiques' },
  { to: '/audit', label: 'Journal d audit' },
];

export default function Sidebar() {
  const { agent, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-logo">IR</div>
        <div className="brand-text">
          <strong>Safidy</strong>
          <span>Centre fiscal</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {items.map((it) => (
          <NavLink
            key={it.to}
            to={it.to}
            className={({ isActive }) => 'nav-item' + (isActive ? ' active' : '')}
          >
            {it.label}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="agent-info">
          <span className="agent-name">
            {agent ? agent.prenom + ' ' + agent.nom : ''}
          </span>
          <span className="agent-role">{agent ? agent.role : ''}</span>
        </div>
        <button className="btn-logout" onClick={handleLogout}>
          Deconnexion
        </button>
      </div>
    </aside>
  );
}
