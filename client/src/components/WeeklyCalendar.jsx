import { DAYS } from '../utils/days';

const DAY_COLUMNS = DAYS.filter((d) => d.value !== 0);

// Warm, on-brand palette for telling instruments apart at a glance.
const DOT_COLORS = ['bg-gold', 'bg-wine', 'bg-ink', 'bg-emerald-600'];

function colorForInstrument(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return DOT_COLORS[Math.abs(hash) % DOT_COLORS.length];
}

function rateFor(teacher, instrumentId) {
  return teacher?.rates?.find((r) => String(r.instrument) === String(instrumentId))?.percentage;
}

// Groups the flat FixedClass list into one row per teacher+instrument, matching
// the paper schedule (profesor | % | instrumento | días) instead of a day/hour
// grid — each day column just lists the hour(s) that combination meets.
// A class can reference a teacher/instrument that was since deleted — those
// show up as "Profesor eliminado" / "Instrumento eliminado" instead of crashing.
function groupClasses(classes) {
  const groups = new Map();
  for (const c of classes) {
    const key = `${c.teacher?._id || 'none'}-${c.instrument?._id || 'none'}`;
    if (!groups.has(key)) {
      groups.set(key, {
        teacherName: c.teacher?.name || 'Profesor eliminado',
        instrumentName: c.instrument?.name || 'Instrumento eliminado',
        percentage: rateFor(c.teacher, c.instrument?._id),
        byDay: new Map(),
      });
    }
    const group = groups.get(key);
    for (const s of c.slots) {
      if (!group.byDay.has(s.day)) group.byDay.set(s.day, []);
      group.byDay.get(s.day).push({ classId: c._id, startHour: s.startHour, endHour: s.endHour });
    }
  }
  return [...groups.values()].sort((a, b) => a.teacherName.localeCompare(b.teacherName));
}

export default function WeeklyCalendar({ classes, onSelect }) {
  const rows = groupClasses(classes);

  return (
    <div className="table-wrap overflow-x-auto">
      <table className="min-w-[860px]">
        <thead>
          <tr>
            <th>Profesor</th>
            <th>%</th>
            <th>Instrumento</th>
            {DAY_COLUMNS.map((d) => (
              <th key={d.value} className="text-center">{d.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((group, i) => (
            <tr key={i}>
              <td className="font-semibold text-ink">{group.teacherName}</td>
              <td className="font-mono text-ink/60">{group.percentage != null ? `${group.percentage}%` : '-'}</td>
              <td>
                <span className="flex-row" style={{ gap: 6 }}>
                  <span className={`h-2 w-2 shrink-0 rounded-full ${colorForInstrument(group.instrumentName)}`} />
                  {group.instrumentName}
                </span>
              </td>
              {DAY_COLUMNS.map((d) => {
                const entries = (group.byDay.get(d.value) || []).sort((a, b) => a.startHour - b.startHour);
                return (
                  <td key={d.value}>
                    {entries.length > 0 && (
                      <div className="flex flex-wrap justify-center gap-1">
                        {entries.map((e) => (
                          <button
                            key={e.classId}
                            type="button"
                            title={`${e.startHour}:00 a ${e.endHour}:00 - Tocar para ver el detalle`}
                            className="cursor-pointer rounded-full border border-gold/40 bg-gold/10 px-2.5 py-1 font-mono text-xs font-bold text-wine shadow-sm transition hover:-translate-y-0.5 hover:border-gold hover:bg-gold hover:text-ink hover:shadow"
                            onClick={() => onSelect(classes.find((c) => c._id === e.classId))}
                          >
                            {e.startHour}hs
                          </button>
                        ))}
                      </div>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={3 + DAY_COLUMNS.length}>Sin clases cargadas.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
