import { createContext, useState, useEffect, ReactNode, useContext } from 'react';

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

interface TauriProviderProps {
  children: ReactNode;
}

export const TauriProvider = ({ children }: TauriProviderProps) => {
  const [isAvailable, setIsAvailable] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkTauriStatus = () => {
    try {
      const tauriAvailable = !!window.__TAURI__;
      setIsAvailable(tauriAvailable);
      setIsInitialized(true);
      if (!tauriAvailable) {
        console.warn('Tauri is not available. Running in web mode.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error checking Tauri status');
      setIsInitialized(true);
    }
  };

  useEffect(() => {
    checkTauriStatus();
  }, []);

  return (
    <TauriContext.Provider value={{ isAvailable, isInitialized, error, checkTauriStatus }}>
      {children}
    </TauriContext.Provider>
  );
};

export const useTauri = () => {
  const context = useContext(TauriContext);
  
  if (context === undefined) {
    throw new Error('useTauri must be used within a TauriProvider');
  }
  
  return context;
};

export { TauriContext }; 