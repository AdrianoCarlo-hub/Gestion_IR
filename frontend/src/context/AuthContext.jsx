import { createContext, useContext, useState } from 'react';
import { login as loginApi } from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [agent, setAgent] = useState(() => {
    const saved = localStorage.getItem('agent');
    return saved ? JSON.parse(saved) : null;
  });

  const login = async (email, motDePasse) => {
    const data = await loginApi(email, motDePasse);
    localStorage.setItem('token', data.token);
    localStorage.setItem('agent', JSON.stringify(data));
    setAgent(data);
    return data;
  };

  const logout = () => {
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
