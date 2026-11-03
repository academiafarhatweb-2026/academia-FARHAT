// Calendar dates ("YYYY-MM-DD") as the admin picks them, in the academy's
// local time zone (process.env.TZ, set in config/env.js).

export const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function toISODate(date) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function todayISO() {
  return toISODate(new Date());
}

// Local midnight of that day; null for impossible dates such as 2026-02-30.
export function startOfDay(iso) {
  const [year, month, day] = iso.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.getMonth() === month - 1 && date.getDate() === day ? date : null;
}

export function startOfNextDay(iso) {
  const date = startOfDay(iso);
  date.setDate(date.getDate() + 1);
  return date;
}
