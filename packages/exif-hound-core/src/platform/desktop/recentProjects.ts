/**
 * Recent projects history for the splash screen. Tracks opened project
 * folder paths — entries are resumable records. Capped at 10,
 * most-recent-first.
 */
export interface RecentProject {
  path: string;
  name: string;
  lastOpenedAt: number;
}

const STORAGE_KEY = 'exifhound.recentProjects';
const MAX_ENTRIES = 10;

export function getRecentProjects(): RecentProject[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (e): e is RecentProject =>
          typeof e === 'object' && e !== null &&
          typeof (e as RecentProject).path === 'string' &&
          typeof (e as RecentProject).name === 'string' &&
          typeof (e as RecentProject).lastOpenedAt === 'number'
      )
      .sort((a, b) => b.lastOpenedAt - a.lastOpenedAt)
      .slice(0, MAX_ENTRIES);
  } catch {
    // Defensive: corrupt storage yields an empty list, never a crash.
    return [];
  }
}

/** Upsert by path (a re-opened project moves to the top), cap at 10. */
export function recordRecentProject(path: string, name: string): void {
  if (!path) return;
  const rest = getRecentProjects().filter((e) => e.path !== path);
  const next = [{ path, name, lastOpenedAt: Date.now() }, ...rest].slice(0, MAX_ENTRIES);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Storage unavailable (quota/private mode) — history is best-effort.
  }
}