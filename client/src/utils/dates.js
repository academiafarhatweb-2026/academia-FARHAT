// Calendar dates as <input type="date"> uses them ("YYYY-MM-DD"), in the
// browser's local time — never via toISOString(), which is UTC and would turn
// a Tucumán evening into tomorrow.

export function toISODate(date) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function todayISO() {
  return toISODate(new Date());
}

// First and last day of the month `offset` months from now (0 = this month).
export function monthRange(offset = 0) {
  const now = new Date();
  const first = new Date(now.getFullYear(), now.getMonth() + offset, 1);
  const last = new Date(now.getFullYear(), now.getMonth() + offset + 1, 0);
  return { from: toISODate(first), to: toISODate(last) };
}

export function formatDate(value) {
  return new Date(value).toLocaleDateString('es-AR');
}
