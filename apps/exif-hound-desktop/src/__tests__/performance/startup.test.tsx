import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from '../../App';
import { ThemeProvider } from '../../context/ThemeContext';
import { SettingsProvider } from '../../context/SettingsContext';
import { TauriProvider } from '../../context/TauriContext';

// Mock Tauri
window.__TAURI__ = {
  fs: {},
  invoke: jest.fn(),
};

// Mock heavy components that should be lazy loaded
jest.mock('../../components/Map', () => ({
  __esModule: true,
  default: () => <div data-testid="lazy-map">Map Component</div>
}));

jest.mock('../../components/FullExifView', () => ({
  __esModule: true,
  default: () => <div data-testid="lazy-full-exif">FullExifView Component</div>
}));

const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <ThemeProvider>
      <SettingsProvider>
        <TauriProvider>
          {ui}
        </TauriProvider>
      </SettingsProvider>
    </ThemeProvider>
  );
};

describe('Startup Performance Optimizations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock console methods to check for log suppression
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('should not show splash screen with artificial delay', async () => {
    renderWithProviders(<App />);
    
    // App should be interactive immediately, not after 2.5s
    await waitFor(() => {
      // Should not show splash screen for artificial delay
      expect(screen.queryByTestId('splash-screen')).not.toBeInTheDocument();
    }, { timeout: 100 }); // Very short timeout - should be immediate
  });

  test('should suppress console logs in production', () => {
    // In tests, __DEV__ is set to false (see setupTests.ts), mirroring production
    renderWithProviders(<App />);
    
    // Console logs should not be called in production
    expect(console.log).not.toHaveBeenCalled();
  });

  test('should lazy load Map component only when needed', async () => {
    renderWithProviders(<App />);
    
    // Map should not be in initial render
    expect(screen.queryByTestId('lazy-map')).not.toBeInTheDocument();
    
    // This test would need to simulate navigation to map view
    // For now, we just ensure it's not loaded initially
  });
});
