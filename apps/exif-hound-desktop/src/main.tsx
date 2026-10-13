import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { bootstrapCore } from './core/bootstrap';
import { CoreProvider } from './core/CoreContext';
import { ThemeProvider } from './context/ThemeContext';
import { SettingsProvider } from './context/SettingsContext';
import { TauriProvider } from './context/TauriContext';
import { AppToaster } from './feedback';
import './index.css';

// Initialize app immediately - TauriProvider handles availability detection
const initApp = () => {
  const core = bootstrapCore();
  try {
    if (__DEV__) {
      console.log('[Main] Starting app initialization...');
      console.log('[Main] Tauri available:', !!window.__TAURI__);
    }
    
    createRoot(document.getElementById('root')!).render(
      <StrictMode>
        <CoreProvider core={core}>
          <ThemeProvider>
            <SettingsProvider>
              <TauriProvider>
                <AppToaster />
                <App />
              </TauriProvider>
            </SettingsProvider>
          </ThemeProvider>
        </CoreProvider>
      </StrictMode>
    );
  } catch (error) {
    if (__DEV__) {
      console.error('[Main] Error initializing app:', error);
    }
    
    // Render the app anyway, TauriProvider will handle unavailability
    createRoot(document.getElementById('root')!).render(
      <StrictMode>
        <CoreProvider core={core}>
          <ThemeProvider>
            <SettingsProvider>
              <TauriProvider>
                <AppToaster />
                <App />
              </TauriProvider>
            </SettingsProvider>
          </ThemeProvider>
        </CoreProvider>
      </StrictMode>
    );
  }
};

// Start initialization immediately
initApp();