/** ISO date YYYY-MM-DD for today minus `days` (local calendar). */
export function isoDaysAgo(days: number, from: Date = new Date()): string {
  const d = new Date(from);
  d.setDate(d.getDate() - days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function isoToday(from: Date = new Date()): string {
  return isoDaysAgo(0, from);
}

export function isoMonthStart(from: Date = new Date()): string {
  const y = from.getFullYear();
  const m = String(from.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}-01`;
}

export function isoYearStart(from: Date = new Date()): string {
  return `${from.getFullYear()}-01-01`;
}
