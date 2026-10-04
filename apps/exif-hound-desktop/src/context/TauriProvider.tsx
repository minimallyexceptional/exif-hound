import { ReactNode, useEffect, useState } from 'react';
import { TauriContext } from './TauriContext';

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
      
      setIsAvailable(tauriAvailable);
      
      if (!tauriAvailable) {
        setError('Tauri runtime is not available');
        return;
      }

      // Give Tauri a moment to fully initialize
      await wait(100);

      // Log the structure of the Tauri object to debug

      // Try both approaches for accessing the plugins
      let dialogAvailable = false;
      let fsAvailable = false;

      // Approach 1: Check global object
      if (window.__TAURI__?.dialog) {
        dialogAvailable = true;
      }

      if (window.__TAURI__?.fs) {
        fsAvailable = true;
      }

      // Approach 2: Try dynamic imports with retries
      if (!dialogAvailable) {
        try {
          // Try up to 3 times with a short delay between attempts
          for (let i = 0; i < 3 && !dialogAvailable; i++) {
            if (i > 0) {
              await wait(100);
            }
            
            try {
              await import('@tauri-apps/plugin-dialog');
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
              await wait(100);
            }
            
            try {
              await import('@tauri-apps/plugin-fs');
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