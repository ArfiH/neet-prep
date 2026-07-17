import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import PdfList from './pages/PdfList';
import PdfForm from './pages/PdfForm';
import CollegeList from './pages/CollegeList';
import CollegeForm from './pages/CollegeForm';
import CollegeImport from './pages/CollegeImport';
import CutoffList from './pages/CutoffList';
import CutoffForm from './pages/CutoffForm';
import CutoffImport from './pages/CutoffImport';
import UserList from './pages/UserList';
import UserPurchases from './pages/UserPurchases';
import BroadcastNotification from './pages/BroadcastNotification';
import DeliveryRequestList from './pages/DeliveryRequestList';
import Settings from './pages/Settings';
import Payments from './pages/Payments';
import { getStoredToken, getDashboard, getUrlToken } from './lib/api';

function AuthGuard({ children }: { children: React.ReactNode }) {
  const [checking, setChecking] = useState(true);
  const [valid, setValid] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      setChecking(false);
      return;
    }
    getDashboard()
      .then(() => setValid(true))
      .catch(() => {
        sessionStorage.removeItem('admin_token');
        if (getUrlToken()) {
          window.location.href = window.location.pathname;
        }
      })
      .finally(() => setChecking(false));
  }, [location.pathname]);

  if (checking) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', color: 'var(--color-text-3)', fontSize: 14 }}>
        Checking session...
      </div>
    );
  }

  if (!valid) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <AuthGuard>
            <Layout />
          </AuthGuard>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="pdfs" element={<PdfList />} />
        <Route path="pdfs/new" element={<PdfForm />} />
        <Route path="pdfs/:id/edit" element={<PdfForm />} />
        <Route path="colleges" element={<CollegeList />} />
        <Route path="colleges/new" element={<CollegeForm />} />
        <Route path="colleges/import" element={<CollegeImport />} />
        <Route path="colleges/:id/edit" element={<CollegeForm />} />
        <Route path="cutoffs" element={<CutoffList />} />
        <Route path="cutoffs/new" element={<CutoffForm />} />
        <Route path="cutoffs/import" element={<CutoffImport />} />
        <Route path="cutoffs/:id/edit" element={<CutoffForm />} />
        <Route path="users" element={<UserList />} />
        <Route path="users/:id/purchases" element={<UserPurchases />} />
        <Route path="delivery-requests" element={<DeliveryRequestList />} />
        <Route path="notifications/broadcast" element={<BroadcastNotification />} />
        <Route path="settings" element={<Settings />} />
        <Route path="payments" element={<Payments />} />
      </Route>
    </Routes>
  );
}
