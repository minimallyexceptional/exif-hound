/**
 * Safe localStorage helpers for settings persistence (quota / disabled storage).
 */
export function readJsonStorage<T extends object>(key: string, defaults: T): T {
  try {
    const saved = localStorage.getItem(key);
    if (!saved) {
      return defaults;
    }
    const parsed: unknown = JSON.parse(saved);
    if (!parsed || typeof parsed !== 'object') {
      return defaults;
    }
    return { ...defaults, ...(parsed as Partial<T>) };
  } catch (error) {
    if (__DEV__) {
      console.warn(`Unable to read ${key} from localStorage; using defaults.`, error);
    }
    return defaults;
  }
}

export function writeJsonStorage(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    if (__DEV__) {
      console.warn(`Unable to persist ${key} to localStorage.`, error);
    }
  }
}
