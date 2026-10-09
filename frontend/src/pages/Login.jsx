import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LuMail, LuLock, LuEye, LuEyeOff, LuShieldCheck, LuLoader, LuCircleAlert } from 'react-icons/lu';

export default function Login() {
  const [email, setEmail] = useState('admin@safidy.mg');
  const [motDePasse, setMotDePasse] = useState('admin1234');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, isAuth } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuth) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuth, navigate]);

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

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  return (
    <div className="login-page">
      <div className="login-blob login-blob-1" />
      <div className="login-blob login-blob-2" />

      <form className={`login-card ${error ? 'login-card-error' : ''}`} onSubmit={handleSubmit}>
        <div className="login-logo">
          <LuShieldCheck />
        </div>

        <h1 className="login-title">Connexion agent</h1>
        <p className="login-subtitle">Application reservee aux agents du centre fiscal</p>

        {error && (
          <div className="login-error" role="alert">
            <LuCircleAlert />
            <span>{error}</span>
          </div>
        )}

        <div className="login-input-group">
          <LuMail className="login-input-icon" />
          <input
            type="email"
            className="login-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="E-mail"
            autoComplete="username"
            disabled={loading}
          />
        </div>

        <div className="login-input-group">
          <LuLock className="login-input-icon" />
          <input
            type={showPassword ? 'text' : 'password'}
            className="login-input"
            value={motDePasse}
            onChange={(e) => setMotDePasse(e.target.value)}
            placeholder="Mot de passe"
            autoComplete="current-password"
            disabled={loading}
          />
          <button
            type="button"
            className="login-toggle-password"
            onClick={togglePasswordVisibility}
            aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
            disabled={loading}
          >
            {showPassword ? <LuEyeOff /> : <LuEye />}
          </button>
        </div>

        <div className="login-options">
          <label className="login-checkbox">
            <input type="checkbox" />
            <span>Souvenir de moi</span>
          </label>
          <a href="#" className="login-forgot" onClick={(e) => e.preventDefault()}>
            Mot de passe oublie ?
          </a>
        </div>

        <button type="submit" className="btn-login" disabled={loading}>
          {loading ? (
            <>
              <LuLoader className="spin" />
              <span>Connexion...</span>
            </>
          ) : (
            'SE CONNECTER'
          )}
        </button>
      </form>
    </div>
  );
}
