import { createContext, useContext, useState } from 'react';
import { login as loginApi } from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [agent, setAgent] = useState(() => {
    // sessionStorage : la session expire a la fermeture du navigateur
    const saved = sessionStorage.getItem('agent');
    return saved ? JSON.parse(saved) : null;
  });

  const login = async (email, motDePasse) => {
    const data = await loginApi(email, motDePasse);
    sessionStorage.setItem('token', data.token);
    sessionStorage.setItem('agent', JSON.stringify(data));
    setAgent(data);
    return data;
  };

  const logout = () => {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('agent');
    // Nettoyage de l'ancien localStorage (migration)
    localStorage.removeItem('token');
    localStorage.removeItem('agent');
    setAgent(null);
  };

  const value = {
    agent,
    isAuth: !!agent,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth doit etre utilise dans AuthProvider');
  return ctx;
}
