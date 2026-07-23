import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { enrollmentsApi } from '../../api/enrollments';
import { studentsApi } from '../../api/catalog';

function PeopleIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <circle cx="9" cy="8" r="3.2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M15.5 6a3 3 0 0 1 0 5.8M20 20c0-2.8-2-5.1-4.7-5.8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function ListIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M9 6h11M9 12h11M9 18h11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="4.5" cy="6" r="1.4" fill="currentColor" />
      <circle cx="4.5" cy="12" r="1.4" fill="currentColor" />
      <circle cx="4.5" cy="18" r="1.4" fill="currentColor" />
    </svg>
  );
}

function BellIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M6 10a6 6 0 1 1 12 0c0 4 1.5 5.5 1.5 5.5H4.5S6 14 6 10Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M10 18.5a2 2 0 0 0 4 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export default function Dashboard() {
  const [enrollments, setEnrollments] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([enrollmentsApi.list(), studentsApi.list()]).then(([e, s]) => {
      setEnrollments(e);
      setStudents(s);
      setLoading(false);
    });
  }, []);

  if (loading) return <p>Cargando...</p>;

  const activeEnrollments = enrollments.filter((e) => e.active !== false);
  const expiringSoon = enrollments.filter((e) => e.expirationStatus === 'expiring_soon');
  const expired = enrollments.filter((e) => e.expirationStatus === 'expired');
  const activeStudents = students.filter((s) => s.active !== false);

  return (
    <div>
      <h1>Dashboard</h1>

      <div className="grid mb-16">
        <Link to="/admin/alumnos?tab=Alumnos" className="stat-card group block no-underline">
          <PeopleIcon className="ghost-icon" />
          <span className="icon-badge">
            <PeopleIcon className="h-6 w-6" />
          </span>
          <div className="label">Alumnos activos</div>
          <div className="value">{activeStudents.length}</div>
          <div className="link-hint">Ver lista &rarr;</div>
        </Link>
        <Link to="/admin/alumnos?tab=Inscripciones" className="stat-card accent-emerald group block no-underline">
          <ListIcon className="ghost-icon" />
          <span className="icon-badge">
            <ListIcon className="h-6 w-6" />
          </span>
          <div className="label">Inscripciones activas</div>
          <div className="value">{activeEnrollments.length}</div>
          <div className="link-hint">Ver lista &rarr;</div>
        </Link>
        <Link to="/admin/alumnos?tab=Inscripciones" className="stat-card accent-wine group block no-underline">
          <BellIcon className="ghost-icon" />
          <span className="icon-badge">
            <BellIcon className="h-6 w-6" />
          </span>
          <div className="label">Por vencer / vencidos</div>
          <div className="value">{expiringSoon.length} / {expired.length}</div>
          <div className="link-hint">Ver lista &rarr;</div>
        </Link>
      </div>
    </div>
  );
}
