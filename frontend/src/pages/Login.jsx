import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Form, Input, Button, Typography, Alert, Checkbox, Space } from 'antd';
import { LockOutlined, MailOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import Logo from '../components/Logo';

const { Title, Paragraph, Text } = Typography;

export default function Login() {
  const [form] = Form.useForm();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, isAuth } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuth) navigate('/dashboard', { replace: true });
  }, [isAuth, navigate]);

  const handleSubmit = async (values) => {
    setError('');
    setLoading(true);
    try {
      await login(values.email, values.motDePasse);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(
        err.response?.data?.message ||
          (!err.response
            ? 'Serveur inaccessible. Verifiez que le backend est demarre et que son URL est correcte.'
            : 'Erreur de connexion. Reessayez.')
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-shape login-shape-1" />
      <div className="login-shape login-shape-2" />
      <div className="login-shape login-shape-3" />

      <div className="login-wrapper">
        <div className="login-brand">
          <Logo size={60} repli="IR" fondRepli="#fff" couleurRepli="#0E7A55" />
          <Title level={2} className="login-brand-title">
            Gestion IR
          </Title>

        </div>

        <Card className="login-card" bordered={false}>
          <Space direction="vertical" size={4} style={{ width: '100%', marginBottom: 24 }}>
            <Title level={4} className="login-card-title">
              <SafetyCertificateOutlined style={{ color: '#0E7A55', marginRight: 10 }} />
              Connexion agent
            </Title>
            <Text type="secondary">Application reservee aux agents du centre fiscal</Text>
          </Space>

          {error && (
            <Alert
              type="error"
              showIcon
              message={error}
              style={{ marginBottom: 18 }}
              closable
              onClose={() => setError('')}
            />
          )}

          <Form
            form={form}
            layout="vertical"
            initialValues={{ email: 'admin@safidy.mg', motDePasse: 'admin1234' }}
            onFinish={handleSubmit}
            size="large"
          >
            <Form.Item
              name="email"
              label="Adresse e-mail"
              rules={[
                { required: true, message: 'E-mail requis' },
                { type: 'email', message: 'Adresse e-mail invalide' },
              ]}
            >
              <Input
                prefix={<MailOutlined style={{ color: '#8aa39c' }} />}
                placeholder="votre.email@centre.mg"
                autoComplete="username"
                disabled={loading}
              />
            </Form.Item>

            <Form.Item
              name="motDePasse"
              label="Mot de passe"
              rules={[{ required: true, min: 8, message: '8 caracteres minimum' }]}
            >
              <Input.Password
                prefix={<LockOutlined style={{ color: '#8aa39c' }} />}
                placeholder="Mot de passe"
                autoComplete="current-password"
                disabled={loading}
              />
            </Form.Item>

            <div className="login-options">
              <Checkbox disabled={loading}>Souvenir de moi</Checkbox>
              <a
                href="#"
                className="login-forgot"
                onClick={(e) => e.preventDefault()}
              >
                Mot de passe oublie ?
              </a>
            </div>

            <Button
              type="primary"
              htmlType="submit"
              block
              loading={loading}
              size="large"
              className="login-submit"
            >
              SE CONNECTER
            </Button>
          </Form>
        </Card>

 
      </div>
    </div>
  );
}
