import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Contribuables from './pages/Contribuables';
import Declarations from './pages/Declarations';
import Deficits from './pages/Deficits';
import Acomptes from './pages/Acomptes';
import Paiements from './pages/Paiements';
import Suspensions from './pages/Suspensions';
import Statistiques from './pages/Statistiques';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/contribuables" element={<Contribuables />} />
            <Route path="/declarations" element={<Declarations />} />
            <Route path="/deficits" element={<Deficits />} />
            <Route path="/acomptes" element={<Acomptes />} />
            <Route path="/paiements" element={<Paiements />} />
            <Route path="/suspensions" element={<Suspensions />} />
            <Route path="/statistiques" element={<Statistiques />} />
          </Route>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
