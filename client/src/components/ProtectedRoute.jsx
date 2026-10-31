import { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

// UX only: hides pages the visitor can't use. The real access control is the
// server, which checks the session cookie and role on every API request.
export default function ProtectedRoute({ role, children }) {
  const { user, status, fetchMe } = useAuthStore();

  // The session is only checked when a protected page is opened, so the
  // public Home doesn't spend a request (and a cold server start) on it.
  useEffect(() => {
    if (status === 'idle') fetchMe();
  }, [status, fetchMe]);

  if (status !== 'ready') return null;
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to="/" replace />;

  return children;
}
