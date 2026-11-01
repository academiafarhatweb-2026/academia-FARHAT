import { Suspense, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import Logo from '../../components/Logo';
import { useConfirm } from '../../hooks/useConfirm';

const links = [
  { to: '/admin/configuracion', label: 'Configuración' },
  { to: '/admin/alumnos', label: 'Alumnos' },
  { to: '/admin/profesores', label: 'Profesores' },
  { to: '/admin/clases', label: 'Clases' },
  { to: '/admin/instrumentos', label: 'Instrumentos' },
  { to: '/admin/stock', label: 'Stock' },
];

function MenuIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function ExternalIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M14 4h6v6M20 4l-9 9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export default function AdminLayout() {
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();
  const confirm = useConfirm();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  async function handleLogout() {
    const ok = await confirm({ title: 'Cerrar sesión', message: 'Vas a salir de tu cuenta. Continuar?', confirmLabel: 'Salir' });
    if (!ok) return;
    await logout();
    navigate('/login');
  }

  function closeSidebar() {
    setSidebarOpen(false);
  }

  return (
    <div className="admin-shell">
      <div className="admin-mobile-bar no-print">
        <button type="button" className="btn secondary" onClick={() => setSidebarOpen(true)} aria-label="Abrir menú">
          <MenuIcon className="h-5 w-5" />
        </button>
        <span className="flex items-center gap-2 font-display font-semibold text-ink">
          <Logo className="h-6 w-6" />
          Academia Farhat
        </span>
      </div>

      {sidebarOpen && <div className="admin-sidebar-backdrop no-print" onClick={closeSidebar} />}

      <aside className={`admin-sidebar no-print ${sidebarOpen ? 'admin-sidebar-open' : ''}`}>
        <NavLink to="/admin" end className="admin-sidebar-brand" onClick={closeSidebar}>
          <Logo className="h-7 w-7" />
          Academia Farhat
        </NavLink>
        <nav className="admin-sidebar-nav">
          {links.map((link) => (
            <NavLink key={link.to} to={link.to} onClick={closeSidebar}>
              {link.label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto flex flex-col gap-2">
          {/* New tab: the admin keeps its place in the panel (and its session) */}
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="btn secondary no-underline"
            aria-label="Ver sitio (se abre en otra pestaña)"
            onClick={closeSidebar}
          >
            Ver sitio
            <ExternalIcon className="h-4 w-4" />
          </a>
          <button className="btn secondary" onClick={handleLogout}>
            Salir
          </button>
        </div>
      </aside>

      <main className="admin-content">
        <Suspense fallback={null}>
          <Outlet />
        </Suspense>
      </main>
    </div>
  );
}
