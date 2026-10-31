import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import { ConfirmProvider } from './context/ConfirmContext';

import Home from './pages/public/Home';

// Everything except the public Home is loaded on demand, so visitors on a
// phone don't download the whole admin panel just to see the landing page.
const Login = lazy(() => import('./pages/auth/Login'));

const AdminLayout = lazy(() => import('./pages/admin/AdminLayout'));
const Dashboard = lazy(() => import('./pages/admin/Dashboard'));
const Instruments = lazy(() => import('./pages/admin/Instruments'));

const ConfiguracionSection = lazy(() => import('./pages/admin/sections/ConfiguracionSection'));
const AlumnosSection = lazy(() => import('./pages/admin/sections/AlumnosSection'));
const ProfesoresSection = lazy(() => import('./pages/admin/sections/ProfesoresSection'));
const ClasesSection = lazy(() => import('./pages/admin/sections/ClasesSection'));

const StudentProfile = lazy(() => import('./pages/student/StudentProfile'));

export default function App() {
  return (
    <ConfirmProvider>
      <Suspense fallback={<div className="min-h-svh bg-stage" />}>
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
      </Suspense>
    </ConfirmProvider>
  );
}
