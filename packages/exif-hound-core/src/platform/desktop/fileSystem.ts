export function isTauriEnvironment(): boolean {
  try {
    if (typeof window === 'undefined') return false;
    const win = window as unknown as {
      __TAURI_INTERNALS__?: unknown;
      __TAURI_IPC__?: unknown;
      __TAURI__?: unknown;
    };
    return !!(win.__TAURI_INTERNALS__ ?? win.__TAURI_IPC__ ?? win.__TAURI__);
  } catch {
    return false;
  }
}
