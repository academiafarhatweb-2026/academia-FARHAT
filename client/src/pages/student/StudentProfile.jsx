import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { enrollmentsApi } from '../../api/enrollments';
import { homeApi } from '../../api/home';
import { useAuthStore } from '../../store/authStore';
import { dayLabel } from '../../utils/days';
import Logo from '../../components/Logo';
import SoundRings from '../../components/SoundRings';
import WhatsappButton from '../../components/WhatsappButton';
import { useConfirm } from '../../context/ConfirmContext';

const STATUS_INFO = {
  active: { label: 'Al dia', className: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300' },
  expiring_soon: { label: 'Por vencer', className: 'border-gold/40 bg-gold/15 text-gold' },
  expired: { label: 'Vencido', className: 'border-wine/50 bg-wine/25 text-rose-200' },
  no_payment: { label: 'Sin pagos', className: 'border-ivory/20 bg-ivory/10 text-ivory/60' },
};

function StatusPill({ status }) {
  const info = STATUS_INFO[status] || STATUS_INFO.no_payment;
  return (
    <span className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-bold ${info.className}`}>
      {info.label}
    </span>
  );
}

function scheduleLines(classes) {
  const byDay = new Map();
  for (const c of classes || []) {
    for (const s of c.slots || []) {
      if (!byDay.has(s.day)) byDay.set(s.day, []);
      byDay.get(s.day).push(`${s.startHour}-${s.endHour}hs`);
    }
  }
  return [...byDay.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([day, ranges]) => `${dayLabel(day)} ${ranges.join(' / ')}`);
}

export default function StudentProfile() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const confirm = useConfirm();
  const [enrollments, setEnrollments] = useState([]);
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([enrollmentsApi.listMine(), homeApi.get()]).then(([data, content]) => {
      setEnrollments(data);
      setWhatsappNumber(content?.whatsappNumber || '');
      setLoading(false);
    });
  }, []);

  async function handleLogout() {
    const ok = await confirm({ title: 'Cerrar sesion', message: 'Vas a salir de tu cuenta. Continuar?', confirmLabel: 'Salir' });
    if (!ok) return;
    await logout();
    navigate('/');
  }

  const expired = enrollments.filter((e) => e.expirationStatus === 'expired');
  const expiringSoon = enrollments.filter((e) => e.expirationStatus === 'expiring_soon');
  const urgent = expired[0] || expiringSoon[0];

  return (
    <div className="grain relative min-h-svh overflow-hidden bg-stage text-ivory">
      <SoundRings className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 text-gold/10" />
      <SoundRings className="pointer-events-none absolute -bottom-40 -left-40 h-96 w-96 text-gold/5" />

      <header className="relative z-10 flex items-center justify-between border-b border-ivory/10 px-5 py-4 sm:px-8">
        <div className="flex items-center gap-2">
          <Logo className="h-7 w-7" />
          <span className="font-display font-semibold tracking-tight">Academia Farhat</span>
        </div>
        <button className="btn secondary !border-ivory/25 !text-ivory hover:!bg-ivory/10" onClick={handleLogout}>
          Salir
        </button>
      </header>

      <main className="container relative z-10 py-10 sm:py-14">
        <span className="text-xs font-semibold uppercase tracking-[0.3em] text-gold">Tu espacio</span>
        <h1 className="mt-1 font-display text-4xl font-bold text-ivory sm:text-5xl">
          Hola, {user?.name}
        </h1>

        {loading ? (
          <p className="mt-8 text-ivory/60">Cargando...</p>
        ) : (
          <>
            {urgent && (
              <div
                className={`mt-8 flex flex-col gap-4 rounded-2xl border p-5 sm:flex-row sm:items-center sm:justify-between ${
                  expired.length > 0 ? 'border-wine/50 bg-wine/15' : 'border-gold/40 bg-gold/10'
                }`}
              >
                <div>
                  <p className="font-display text-lg font-semibold text-ivory">
                    {expired.length > 0
                      ? 'Tu inscripcion esta vencida'
                      : 'Tu clase esta por vencer'}
                  </p>
                  <p className="mt-1 text-sm text-ivory/70">
                    {expired.length > 0
                      ? 'Escribinos para renovar y no perderte tus proximas clases.'
                      : 'Falta poco para tu proximo vencimiento. Escribinos para renovar sin perder tu lugar.'}
                  </p>
                </div>
                <WhatsappButton
                  phone={whatsappNumber}
                  message={`Hola! Quiero renovar mi inscripcion de ${urgent.instrumentNames || urgent.classes?.map((c) => c.instrument?.name).join(', ')}.`}
                />
              </div>
            )}

            <h2 className="mb-4 mt-10 font-display text-xl font-semibold text-ivory">Tus clases</h2>

            {enrollments.length === 0 ? (
              <div className="rounded-2xl border border-ivory/10 bg-walnut p-8 text-center">
                <p className="text-ivory/70">
                  Aun no tenes clases asignadas. Cuando el admin te inscriba en una, la vas a ver aca.
                </p>
              </div>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2">
                {enrollments.map((e) => {
                  const instrumentNames = e.classes?.map((c) => c.instrument?.name).join(', ');
                  const teacherNames = [...new Set(e.classes?.map((c) => c.teacher?.name).filter(Boolean))].join(', ');
                  const lines = scheduleLines(e.classes);

                  return (
                    <div
                      key={e._id}
                      className="rounded-2xl border border-gold/20 bg-walnut p-6 shadow-lg shadow-stage/40"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="font-display text-2xl font-semibold text-ivory">{instrumentNames}</h3>
                        <StatusPill status={e.expirationStatus} />
                      </div>

                      {teacherNames && <p className="mt-2 text-sm text-ivory/70">Profesor: {teacherNames}</p>}

                      {lines.length > 0 && (
                        <div className="mt-3 space-y-1">
                          {lines.map((line) => (
                            <p key={line} className="font-mono text-xs text-gold">
                              {line}
                            </p>
                          ))}
                        </div>
                      )}

                      {e.nextDueDate && (
                        <p className="mt-4 border-t border-ivory/10 pt-3 text-sm text-ivory/60">
                          Proxima fecha de pago:{' '}
                          <span className="font-mono text-ivory">
                            {new Date(e.nextDueDate).toLocaleDateString('es-AR')}
                          </span>
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </main>

      <WhatsappButton phone={whatsappNumber} floating message="Hola! Tengo una consulta sobre mis clases." />
    </div>
  );
}
