import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import PDFs from './pages/PDFs';
import PDFDetail from './pages/PDFDetail';
import PDFViewer from './pages/PDFViewer';
import Colleges from './pages/Colleges';
import CollegeDetail from './pages/CollegeDetail';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Profile from './pages/Profile';
import Purchased from './pages/Purchased';

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/pdfs" element={<PDFs />} />
        <Route path="/pdfs/:id" element={<PDFDetail />} />
        <Route
          path="/pdfs/:id/view"
          element={
            <ProtectedRoute>
              <PDFViewer />
            </ProtectedRoute>
          }
        />
        <Route path="/colleges" element={<Colleges />} />
        <Route path="/colleges/:id" element={<CollegeDetail />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/purchased"
          element={
            <ProtectedRoute>
              <Purchased />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}
