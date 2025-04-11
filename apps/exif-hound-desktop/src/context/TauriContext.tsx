import { createContext } from 'react';

export interface TauriContextType {
  isAvailable: boolean;
  isInitialized: boolean;
  error: string | null;
  checkTauriStatus: () => void;
}

const TauriContext = createContext<TauriContextType>({
  isAvailable: false,
  isInitialized: false,
  error: null,
  checkTauriStatus: () => {}
});

// Define global types for TypeScript
declare global {
  interface Window {
    __TAURI__?: {
      dialog?: Record<string, unknown>;
      fs?: Record<string, unknown>;
      [key: string]: unknown;
    };
    __TAURI_IPC__?: unknown;
  }
}

export { TauriContext }; 