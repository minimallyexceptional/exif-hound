import React, { createContext, useContext, ReactNode, useEffect, useState } from 'react';

interface TauriContextType {
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

export const useTauriContext = () => useContext(TauriContext);

interface TauriProviderProps {
  children: ReactNode;
}

// Helper function to wait for a specified time
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export function TauriProvider({ children }: TauriProviderProps) {
  const [isAvailable, setIsAvailable] = useState<boolean>(false);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const checkTauriStatus = async () => {
    try {
      console.log('[TauriContext] Checking Tauri status...');

      // Check if we're in a Tauri environment using multiple detection methods
      const checks = [
        // Check 1: window.__TAURI__ existence (most common)
        typeof window !== 'undefined' && !!window.__TAURI__,
        
        // Check 2: Tauri IPC object (reliable in v2)
        typeof window !== 'undefined' && !!window.__TAURI_IPC__,
        
        // Check 3: Look for Tauri in user agent (sometimes available in v2)
        typeof navigator !== 'undefined' && /Tauri/.test(navigator.userAgent)
      ];
      
      // If any check passes, we're in a Tauri environment
      const tauriAvailable = checks.some(check => check === true);
      
      console.log(`[TauriContext] Tauri detection checks:`, checks);
      console.log(`[TauriContext] Tauri available: ${tauriAvailable}`);
      setIsAvailable(tauriAvailable);
      
      if (!tauriAvailable) {
        setError('Tauri runtime is not available');
        return;
      }

      // Give Tauri a moment to fully initialize
      console.log('[TauriContext] Waiting for Tauri to fully initialize...');
      await wait(100);

      // Log the structure of the Tauri object to debug
      console.log('[TauriContext] Tauri global structure:',
        Object.keys(window.__TAURI__ || {}).join(', '));

      // Try both approaches for accessing the plugins
      let dialogAvailable = false;
      let fsAvailable = false;

      // Approach 1: Check global object
      if (window.__TAURI__?.dialog) {
        console.log('[TauriContext] Dialog plugin available via global object');
        dialogAvailable = true;
      }

      if (window.__TAURI__?.fs) {
        console.log('[TauriContext] FS plugin available via global object');
        fsAvailable = true;
      }

      // Approach 2: Try dynamic imports with retries
      if (!dialogAvailable) {
        try {
          // Try up to 3 times with a short delay between attempts
          for (let i = 0; i < 3 && !dialogAvailable; i++) {
            if (i > 0) {
              console.log(`[TauriContext] Retry ${i} importing dialog plugin...`);
              await wait(100);
            }
            
            try {
              const dialog = await import('@tauri-apps/plugin-dialog');
              console.log('[TauriContext] Dialog plugin available via import:', 
                Object.keys(dialog).join(', '));
              dialogAvailable = true;
              break;
            } catch (e) {
              console.error(`[TauriContext] Failed attempt ${i+1} to import dialog plugin:`, e);
            }
          }
        } catch (e) {
          console.error('[TauriContext] All attempts to import dialog plugin failed:', e);
        }
      }

      if (!fsAvailable) {
        try {
          // Try up to 3 times with a short delay between attempts
          for (let i = 0; i < 3 && !fsAvailable; i++) {
            if (i > 0) {
              console.log(`[TauriContext] Retry ${i} importing fs plugin...`);
              await wait(100);
            }
            
            try {
              const fs = await import('@tauri-apps/plugin-fs');
              console.log('[TauriContext] FS plugin available via import:', 
                Object.keys(fs).join(', '));
              fsAvailable = true;
              break;
            } catch (e) {
              console.error(`[TauriContext] Failed attempt ${i+1} to import fs plugin:`, e);
            }
          }
        } catch (e) {
          console.error('[TauriContext] All attempts to import fs plugin failed:', e);
        }
      }

      // Check final status
      if (!dialogAvailable) {
        setError('Tauri dialog plugin is not available');
        return;
      }

      if (!fsAvailable) {
        setError('Tauri filesystem plugin is not available');
        return;
      }

      // If we get here, everything is initialized
      console.log('[TauriContext] Tauri plugins initialized successfully');
      setIsInitialized(true);
      setError(null);
    } catch (e) {
      console.error('[TauriContext] Error initializing Tauri:', e);
      setError(`Tauri initialization error: ${e instanceof Error ? e.message : String(e)}`);
      setIsInitialized(false);
    }
  };

  useEffect(() => {
    checkTauriStatus();
  }, []);

  const value = {
    isAvailable,
    isInitialized,
    error,
    checkTauriStatus
  };

  return (
    <TauriContext.Provider value={value}>
      {children}
    </TauriContext.Provider>
  );
}

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