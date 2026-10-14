import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { bootstrapCore } from './core/bootstrap';
import { CoreProvider } from './core/CoreContext';
import { ThemeProvider } from './context/ThemeContext';
import { SettingsProvider } from './context/SettingsContext';
import { AppToaster } from './feedback';
import './index.css';

const initApp = () => {
  const core = bootstrapCore();
  if (__DEV__) {
    console.log('[Main] Starting app initialization...');
    console.log('[Main] Tauri available:', !!window.__TAURI__);
  }

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <CoreProvider core={core}>
        <ThemeProvider>
          <SettingsProvider>
            <AppToaster />
            <App />
          </SettingsProvider>
        </ThemeProvider>
      </CoreProvider>
    </StrictMode>,
  );
};

// Start initialization immediately
initApp();