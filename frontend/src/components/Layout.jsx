import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Layout as AntLayout, Button, Typography, Space, Avatar, Dropdown } from 'antd';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  LogoutOutlined,
  UserOutlined,
} from '@ant-design/icons';
import Sidebar from './Sidebar';
import useInactivityLogout from '../hooks/useInactivityLogout';
import { useAuth } from '../context/AuthContext';

const { Header, Sider, Content } = AntLayout;
const { Text } = Typography;

const TITRES = {
  '/dashboard': 'Tableau de bord',
  '/contribuables': 'Contribuables',
  '/declarations': 'Declarations IR',
  '/deficits': 'Deficits',
  '/acomptes': 'Acomptes',
  '/paiements': 'Paiements',
  '/penalites': 'Penalites',
  '/recouvrement': 'Recouvrement',
  '/suspensions': 'Arret / reprise',
  '/audit': "Journal d'audit",
  '/admin': 'Administration',
};

export default function Layout() {
  useInactivityLogout();
  const location = useLocation();
  const navigate = useNavigate();
  const { agent, logout } = useAuth();

  const [collapsed, setCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebarCollapsed');
    return saved ? saved === 'true' : false;
  });

  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', String(collapsed));
  }, [collapsed]);

  const titre = Object.entries(TITRES)
    .sort(([a], [b]) => b.length - a.length)
    .find(([path]) => location.pathname.startsWith(path))?.[1] || 'Gestion IR';

  const menuAgent = {
    items: [
      {
        key: 'logout',
        icon: <LogoutOutlined />,
        label: 'Deconnexion',
        onClick: () => {
          logout();
          navigate('/login');
        },
      },
    ],
  };

  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        breakpoint="lg"
        collapsedWidth={0}
        trigger={null}
        width={248}
        style={{ position: 'fixed', insetBlock: 0, insetInlineStart: 0, zIndex: 100 }}
      >
        <Sidebar collapsed={collapsed} />
      </Sider>

      <AntLayout style={{ marginInlineStart: collapsed ? 0 : 248, transition: 'all 0.2s' }}>
        <Header className="app-header">
          <Space size="middle">
            <Button
              type="text"
              aria-label="Ouvrir / fermer le menu"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed((v) => !v)}
            />
            <Text strong className="app-header-title">
              {titre}
            </Text>
          </Space>

          <Dropdown menu={{ items: menuAgent }} placement="bottomRight">
            <Space size={8} className="app-header-user" style={{ cursor: 'pointer' }}>
              <Avatar
                size={32}
                style={{ backgroundColor: '#0E7A55' }}
                icon={<UserOutlined />}
              />
              <Text className="app-header-user-name">
                {agent ? `${agent.prenom || ''} ${agent.nom || ''}`.trim() : ''}
              </Text>
            </Space>
          </Dropdown>
        </Header>

        <Content className="app-content">
          <Outlet />
        </Content>
      </AntLayout>
    </AntLayout>
  );
}
