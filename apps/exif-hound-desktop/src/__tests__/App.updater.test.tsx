import React from 'react';
import { render, screen } from '@testing-library/react';
import App from '../App';
import { ThemeProvider } from '../context/ThemeContext';
import { SettingsProvider } from '../context/SettingsContext';

jest.mock('../components/updater/UpdateNotification', () => ({
  UpdateNotification: ({ enableAutomaticChecks }: { enableAutomaticChecks?: boolean }) => (
    <div
      data-testid="update-notification"
      data-automatic={enableAutomaticChecks === false ? 'false' : 'true'}
    />
  ),
}));

function mockMatchMedia(matches: boolean): void {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation((query: string) => ({
      matches,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      addEventListener: jest.fn(),
      removeListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
}

describe('automatic updates on splash', () => {
  beforeEach(() => {
    localStorage.clear();
    mockMatchMedia(false);
  });

  it('keeps automatic updates on by default while the splash is showing', () => {
    render(
      <ThemeProvider>
        <SettingsProvider>
          <App />
        </SettingsProvider>
      </ThemeProvider>
    );

    expect(screen.getByTestId('splash-logomark')).toBeInTheDocument();
    expect(screen.getByTestId('update-notification')).toHaveAttribute('data-automatic', 'true');
  });
});
