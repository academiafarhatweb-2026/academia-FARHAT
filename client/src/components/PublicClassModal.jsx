import { dayLabel } from '../utils/days';
import { assetUrl } from '../utils/assetUrl';
import WhatsappButton from './WhatsappButton';
import Logo from './Logo';

// Groups slots by teacher, then by day, so a day with several time ranges
// (e.g. Viernes 17-19 and 19-21) shows the day name only once.
function groupByTeacher(schedule) {
  const teachers = new Map();
  for (const s of schedule || []) {
    if (!teachers.has(s.teacherName)) teachers.set(s.teacherName, new Map());
    const days = teachers.get(s.teacherName);
    if (!days.has(s.day)) days.set(s.day, []);
    days.get(s.day).push({ startHour: s.startHour, label: `${s.startHour}:00-${s.endHour}:00` });
  }

  return [...teachers.entries()].map(([teacherName, days]) => ({
    teacherName,
    days: [...days.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([day, entries]) => ({
        day,
        ranges: entries.sort((a, b) => a.startHour - b.startHour).map((e) => e.label),
      })),
  }));
}

export default function PublicClassModal({ instrument, schedule, whatsappNumber, onClose }) {
  if (!instrument) return null;

  const message = `Hola! Quiero consultar sobre las clases de ${instrument.name}.`;
  const teacherGroups = groupByTeacher(schedule);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stage/80 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        className="grain relative max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-3xl border border-gold/30 bg-walnut text-ivory shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-stage/70 text-ivory/70 transition hover:text-gold"
        >
          &times;
        </button>

        {instrument.images?.[0] ? (
          <div className="relative h-48 w-full overflow-hidden bg-stage sm:h-56">
            <img
              src={assetUrl(instrument.images[0])}
              alt={instrument.name}
              className="absolute inset-0 h-full w-full object-cover object-top"
            />
          </div>
        ) : (
          <div className="flex h-48 w-full items-center justify-center bg-stage sm:h-56">
            <Logo className="h-14 w-14 opacity-60" />
          </div>
        )}

        <div className="px-8 py-7 text-center">
          <span className="text-xs font-semibold uppercase tracking-[0.3em] text-gold">Clase de</span>
          <h3 className="mt-1 font-display text-3xl font-semibold text-ivory">{instrument.name}</h3>
          {instrument.description && <p className="mt-3 text-sm text-ivory/70">{instrument.description}</p>}

          {teacherGroups.length > 0 && (
            <div className="mt-6 border-t border-ivory/10 pt-5">
              <span className="text-xs font-semibold uppercase tracking-wide text-ivory/40">Profesores y horarios</span>
              <div className="mt-3 flex flex-wrap justify-center gap-x-10 gap-y-5">
                {teacherGroups.map(({ teacherName, days }) => (
                  <div key={teacherName}>
                    <p className="font-display text-sm font-semibold text-ivory">{teacherName}</p>
                    <div className="mt-2 space-y-1">
                      {days.map(({ day, ranges }) => (
                        <p key={day} className="font-mono text-xs text-ivory/80">
                          <span className="text-ivory/60">{dayLabel(day).slice(0, 3)}</span>{' '}
                          <span className="text-gold">{ranges.join(' · ')}</span>
                        </p>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6 flex justify-center">
            <WhatsappButton phone={whatsappNumber} message={message} />
          </div>
        </div>
      </div>
    </div>
  );
}
