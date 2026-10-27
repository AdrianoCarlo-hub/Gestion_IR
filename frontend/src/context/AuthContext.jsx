/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { login as loginApi } from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [agent, setAgent] = useState(() => {
    const saved = sessionStorage.getItem('agent');
    return saved ? JSON.parse(saved) : null;
  });

  const login = useCallback(async (email, motDePasse) => {
    const data = await loginApi(email, motDePasse);
    sessionStorage.setItem('token', data.token);
    sessionStorage.setItem('agent', JSON.stringify(data));
    setAgent(data);
    return data;
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('agent');
    localStorage.removeItem('token');
    localStorage.removeItem('agent');
    setAgent(null);
  }, []);

  // ✅ useMemo : la valeur change uniquement quand agent/login/logout changent
  const value = useMemo(
    () => ({ agent, isAuth: !!agent, login, logout }),
    [agent, login, logout]
  );

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
