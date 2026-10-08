/**
 * Small formatting helpers for the Investigations dashboard. Timestamps
 * are rendered as camera-clock local time (dateTimeOriginal carries no
 * zone information; the dashboard labels it as such rather than guessing).
 */

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  const month = MONTHS[date.getMonth()];
  const day = date.getDate();
  const year = date.getFullYear();
  const time = formatClock(timestamp);
  return `${day} ${month} ${year}, ${time}`;
}

export function formatClock(timestamp: number): string {
  const date = new Date(timestamp);
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

export function formatDuration(ms: number): string {
  const seconds = Math.round(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remSeconds = seconds % 60;
  if (minutes < 60) return remSeconds > 0 ? `${minutes}m ${remSeconds}s` : `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const remMinutes = minutes % 60;
  return remMinutes > 0 ? `${hours}h ${remMinutes}m` : `${hours}h`;
}

export function formatHour(hour: number): string {
  return `${String(hour).padStart(2, '0')}:00`;
}

export function formatRange(start: number, end: number): string {
  if (start === end) return formatTimestamp(start);
  const startDate = new Date(start);
  const endDate = new Date(end);
  const sameYear = startDate.getFullYear() === endDate.getFullYear();
  const startLabel = sameYear
    ? `${startDate.getDate()} ${MONTHS[startDate.getMonth()]}`
    : formatTimestamp(start);
  return `${startLabel} – ${formatTimestamp(end)}`;
}

export function formatAltitudes(altitudes: number[]): string | undefined {
  if (altitudes.length === 0) return undefined;
  if (altitudes.length === 1) return `${altitudes[0]} m alt`;
  return `${altitudes[0]}–${altitudes[altitudes.length - 1]} m alt`;
}
