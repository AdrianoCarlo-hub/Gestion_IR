import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Contribuables from './pages/Contribuables';
import Declarations from './pages/Declarations';

function Placeholder({ title }) {
  return (
    <div className="page">
      <header className="page-header">
        <h1>{title}</h1>
        <p className="page-sub">Module en cours de developpement</p>
      </header>
    </div>
  );
}

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
            <Route path="/deficits" element={<Placeholder title="Deficits" />} />
            <Route path="/acomptes" element={<Placeholder title="Acomptes" />} />
            <Route path="/paiements" element={<Placeholder title="Paiements" />} />
            <Route path="/suspensions" element={<Placeholder title="Arret / reprise" />} />
            <Route path="/statistiques" element={<Placeholder title="Statistiques" />} />
          </Route>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
