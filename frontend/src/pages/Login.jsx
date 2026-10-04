import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('admin@safidy.mg');
  const [motDePasse, setMotDePasse] = useState('admin1234');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, isAuth } = useAuth();
  const navigate = useNavigate();

  if (isAuth) {
    navigate('/dashboard', { replace: true });
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email.includes('@')) {
      setError('Adresse e-mail invalide');
      return;
    }
    if (motDePasse.length < 8) {
      setError('8 caracteres minimum');
      return;
    }
    setLoading(true);
    try {
      await login(email, motDePasse);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      const msg = err.response?.data?.message || 'E-mail ou mot de passe incorrect';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={handleSubmit}>
        <div className="login-logo">IR</div>
        <h1 className="login-title">Connexion agent</h1>
        <p className="login-subtitle">Application reservee aux agents du centre fiscal</p>

        {error && <div className="alert-error">{error}</div>}

        <label className="form-label">E-mail</label>
        <input
          type="email"
          className="form-input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="agent@centre-fiscal.mg"
          autoComplete="username"
        />

        <label className="form-label">Mot de passe (8 caracteres minimum)</label>
        <input
          type="password"
          className="form-input"
          value={motDePasse}
          onChange={(e) => setMotDePasse(e.target.value)}
          placeholder="********"
          autoComplete="current-password"
        />

        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Connexion...' : 'Se connecter'}
        </button>

        <p className="login-hint">Mot de passe oublie : contacter l'administrateur</p>
      </form>
    </div>
  );
}
