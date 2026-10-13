import { NavLink, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  LuLayoutDashboard,
  LuUsers,
  LuFileText,
  LuTrendingDown,
  LuCalendar,
  LuCreditCard,
  LuTriangleAlert,
  LuCirclePause,
  LuScrollText,
  LuLogOut,
  LuUser,
  LuChevronLeft,
  LuChevronRight,
  LuChartColumn,
  LuSettings,
} from 'react-icons/lu';

const items = [
  { to: '/dashboard',     label: 'Tableau de bord', icon: LuLayoutDashboard },
  { to: '/contribuables', label: 'Contribuables',   icon: LuUsers },
  { to: '/declarations',  label: 'Declarations IR', icon: LuFileText },
  { to: '/deficits',      label: 'Deficits',        icon: LuTrendingDown },
  { to: '/acomptes',      label: 'Acomptes',        icon: LuCalendar },
  { to: '/paiements',     label: 'Paiements',       icon: LuCreditCard },
  { to: '/penalites',     label: 'Penalites',       icon: LuTriangleAlert },
  { to: '/suspensions',   label: 'Arret / reprise', icon: LuCirclePause },
  { to: '/statistiques',  label: 'Statistiques',    icon: LuChartColumn },
  { to: '/audit',         label: 'Journal d audit', icon: LuScrollText },
  { to: '/admin',         label: 'Administration',  icon: LuSettings, role: 'ADMIN' },
];

export default function Sidebar({ className = '' }) {
  const { agent, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const savedState = localStorage.getItem('sidebarCollapsed');
    if (savedState) setCollapsed(savedState === 'true');
  }, []);

  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', collapsed.toString());
  }, [collapsed]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getInitials = (nom, prenom) => {
    if (!nom && !prenom) return 'A';
    const f = prenom ? prenom.charAt(0).toUpperCase() : '';
    const n = nom ? nom.charAt(0).toUpperCase() : '';
    return (f + n).slice(0, 2) || 'A';
  };

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''} ${className}`.trim()}>
      <div className="sidebar-brand">
        <div className="brand-logo">IR</div>
        <div className="brand-text">
          <strong>Safidy</strong>
          <span>Centre fiscal</span>
        </div>
      </div>

      <button
        className="sidebar-collapse"
        onClick={() => setCollapsed(!collapsed)}
        title={collapsed ? 'Agrandir' : 'Reduire'}
      >
        {collapsed ? <LuChevronRight size={14} /> : <LuChevronLeft size={14} />}
      </button>

      <nav className="sidebar-nav">
        {items.filter((item) => !item.role || item.role === agent?.role).map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => 'nav-item' + (isActive ? ' active' : '')}
              title={collapsed ? item.label : undefined}
            >
              <span className="nav-icon"><Icon size={18} /></span>
              <span className="nav-label">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="agent-info">
          <div className="agent-avatar">
            {agent && (agent.prenom || agent.nom) ? (
              getInitials(agent.nom, agent.prenom)
            ) : (
              <LuUser size={14} />
            )}
          </div>
          <div className="agent-details">
            <span className="agent-name">
              {agent ? `${agent.prenom} ${agent.nom}` : ''}
            </span>
            <span className="agent-role">{agent ? agent.role : ''}</span>
          </div>
        </div>
        <button className="btn-logout" onClick={handleLogout} title="Deconnexion">
          <LuLogOut size={14} />
          <span className="nav-label">Deconnexion</span>
        </button>
      </div>
    </aside>
  );
}
