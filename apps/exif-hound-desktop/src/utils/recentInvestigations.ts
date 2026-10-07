/**
 * Recent investigations history for the splash screen (design.md D7).
 * Tracks saved/opened file paths — entries are resumable records, not
 * copies of the data. Capped at 10, most-recent-first.
 */
export interface RecentInvestigation {
  path: string;
  name: string;
  lastOpenedAt: number;
}

const STORAGE_KEY = 'exifhound.recentInvestigations';
const MAX_ENTRIES = 10;

export function getRecentInvestigations(): RecentInvestigation[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const entries = parsed
      .filter(
        (e): e is RecentInvestigation =>
          typeof e === 'object' && e !== null &&
          typeof (e as RecentInvestigation).path === 'string' &&
          typeof (e as RecentInvestigation).name === 'string' &&
          typeof (e as RecentInvestigation).lastOpenedAt === 'number'
      )
      .sort((a, b) => b.lastOpenedAt - a.lastOpenedAt)
      .slice(0, MAX_ENTRIES);
    return entries;
  } catch {
    // Defensive: corrupt storage yields an empty list, never a crash.
    return [];
  }
}

/** Upsert by path (a re-saved file moves to the top), cap at 10. */
export function recordRecentInvestigation(path: string, name: string): void {
  if (!path) return;
  const rest = getRecentInvestigations().filter((e) => e.path !== path);
  const next = [{ path, name, lastOpenedAt: Date.now() }, ...rest].slice(0, MAX_ENTRIES);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Storage unavailable (quota/private mode) — history is best-effort.
  }
}