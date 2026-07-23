import { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import ProtectedRoute from './components/ProtectedRoute';
import { ConfirmProvider } from './context/ConfirmContext';

import Home from './pages/public/Home';
import Login from './pages/auth/Login';

import AdminLayout from './pages/admin/AdminLayout';
import Dashboard from './pages/admin/Dashboard';
import Instruments from './pages/admin/Instruments';

import ConfiguracionSection from './pages/admin/sections/ConfiguracionSection';
import AlumnosSection from './pages/admin/sections/AlumnosSection';
import ProfesoresSection from './pages/admin/sections/ProfesoresSection';
import ClasesSection from './pages/admin/sections/ClasesSection';

import StudentProfile from './pages/student/StudentProfile';

export default function App() {
  const fetchMe = useAuthStore((s) => s.fetchMe);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  return (
    <ConfirmProvider>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />

        <Route
          path="/admin"
          element={
            <ProtectedRoute role="admin">
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="configuracion" element={<ConfiguracionSection />} />
          <Route path="alumnos" element={<AlumnosSection />} />
          <Route path="profesores" element={<ProfesoresSection />} />
          <Route path="clases" element={<ClasesSection />} />
          <Route path="instrumentos" element={<Instruments />} />
        </Route>

        <Route
          path="/student"
          element={
            <ProtectedRoute role="student">
              <StudentProfile />
            </ProtectedRoute>
          }
        />
      </Routes>
    </ConfirmProvider>
  );
}
