import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { ThemeProvider } from './context/ThemeContext';
import { SettingsProvider } from './context/SettingsContext';
import { TauriProvider } from './context/TauriContext';
import './index.css';

// Wait for Tauri to be fully initialized before rendering
const initApp = async () => {
  try {
    console.log('[Main] Starting app initialization...');
    console.log('[Main] Window objects:', Object.keys(window));
    
    // Give Tauri time to fully initialize
    if (typeof window !== 'undefined') {
      console.log('[Main] Waiting for Tauri to initialize...');
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Log Tauri availability
      console.log('[Main] Tauri available:', !!window.__TAURI__);
      if (window.__TAURI__) {
        console.log('[Main] Tauri keys:', Object.keys(window.__TAURI__));
      }
    }
    
    // Render the app
    console.log('[Main] Rendering app...');
    createRoot(document.getElementById('root')!).render(
      <StrictMode>
        <ThemeProvider>
          <SettingsProvider>
            <TauriProvider>
              <App />
            </TauriProvider>
          </SettingsProvider>
        </ThemeProvider>
      </StrictMode>
    );
  } catch (error) {
    console.error('[Main] Error initializing app:', error);
    
    // Render the app anyway, TauriProvider will handle unavailability
    createRoot(document.getElementById('root')!).render(
      <StrictMode>
        <ThemeProvider>
          <SettingsProvider>
            <TauriProvider>
              <App />
            </TauriProvider>
          </SettingsProvider>
        </ThemeProvider>
      </StrictMode>
    );
  }
};

// Start initialization
initApp();