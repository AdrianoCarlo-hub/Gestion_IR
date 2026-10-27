import { useNavigate, useLocation } from 'react-router-dom';
import { Menu, Avatar, Typography, Button, Tooltip } from 'antd';
import {
  DashboardOutlined,
  TeamOutlined,
  FileTextOutlined,
  FallOutlined,
  CalendarOutlined,
  CreditCardOutlined,
  WarningOutlined,
  PauseCircleOutlined,
  AuditOutlined,
  SettingOutlined,
  LogoutOutlined,
  UserOutlined,
  AlertOutlined,
} from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import Logo from './Logo';

const { Text } = Typography;

const MENU = [
  { path: '/dashboard', label: 'Tableau de bord', icon: <DashboardOutlined /> },
  { path: '/contribuables', label: 'Contribuables', icon: <TeamOutlined /> },
  { path: '/declarations', label: 'Declarations IR', icon: <FileTextOutlined /> },
  { path: '/deficits', label: 'Deficits', icon: <FallOutlined /> },
  { path: '/acomptes', label: 'Acomptes', icon: <CalendarOutlined /> },
  { path: '/paiements', label: 'Paiements', icon: <CreditCardOutlined /> },
  { path: '/penalites', label: 'Penalites', icon: <WarningOutlined /> },
  { path: '/suspensions', label: 'Arret / reprise', icon: <PauseCircleOutlined /> },
  { path: '/audit', label: "Journal d'audit", icon: <AuditOutlined /> },
  { path: '/admin', label: 'Administration', icon: <SettingOutlined />, role: 'ADMIN' },
];

export default function Sidebar({ collapsed = false }) {
  const { agent, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const items = MENU.filter((m) => !m.role || m.role === agent?.role).map((m) => ({
    key: m.path,
    icon: m.icon,
    label: m.label,
  }));

  const selected = items.find((i) => location.pathname.startsWith(i.key))?.key
    || '/dashboard';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="side-menu">
      <div className="side-brand">
        <Logo size={34} repli="IR" />
        {!collapsed && (
          <div className="side-brand-text">
            <strong>Gestion IR</strong>
            <span>Centre fiscal</span>
          </div>
        )}
      </div>

      <Menu
        theme="dark"
        mode="inline"
        inlineCollapsed={collapsed}
        selectedKeys={[selected]}
        items={items}
        onClick={({ key }) => navigate(key)}
        style={{ borderInlineEnd: 'none', flex: 1, overflowY: 'auto' }}
      />

      <div className="side-footer">
        <Avatar
          size={32}
          style={{ backgroundColor: '#0E7A55', flexShrink: 0 }}
          icon={!agent?.prenom && !agent?.nom ? <UserOutlined /> : undefined}
        >
          {agent?.prenom || agent?.nom
            ? `${(agent?.prenom || '')[0] || ''}${(agent?.nom || '')[0] || ''}`.toUpperCase()
            : ''}
        </Avatar>
        {!collapsed && (
          <div className="side-agent">
            <Text strong style={{ color: '#fff', lineHeight: 1.2 }}>
              {agent ? `${agent.prenom || ''} ${agent.nom || ''}`.trim() : ''}
            </Text>
            <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>
              {agent?.role || ''}
            </Text>
          </div>
        )}
        <Tooltip title="Deconnexion" placement="right">
          <Button
            type="text"
            icon={<LogoutOutlined />}
            onClick={handleLogout}
            style={{ color: 'rgba(255,255,255,0.75)', marginLeft: 'auto' }}
          />
        </Tooltip>
      </div>
    </div>
  );
}
