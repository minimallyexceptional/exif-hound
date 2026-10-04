// Global Cypress E2E setup. Runs before every spec file.
import './tauri-mock';
import './commands';
import './app';

// A rejected mocked Tauri command should not crash the whole run — the app
// is expected to catch invoke errors, and specs assert on the visible result.
Cypress.on('uncaught:exception', (err) => {
  if (String(err.message).includes('[tauri-mock]')) {
    return false;
  }
  return true;
});
