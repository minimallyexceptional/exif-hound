import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SplashScreen from '../SplashScreen';
import { ThemeProvider } from '../../context/ThemeContext';

function mockMatchMedia(matches: boolean): void {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation((query: string) => ({
      matches,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
}

function renderSplash(onStart = jest.fn()) {
  return render(
    <ThemeProvider>
      <SplashScreen onStart={onStart} />
    </ThemeProvider>
  );
}

describe('SplashScreen', () => {
  beforeEach(() => {
    mockMatchMedia(false);
  });

  it('renders the logomark, the action, and the empty recent list', () => {
    renderSplash();

    expect(screen.getByTestId('splash-logomark')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Start new investigation' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /recent investigations/i })).toBeInTheDocument();
    expect(screen.getByText(/no investigations yet/i)).toBeInTheDocument();
  });

  it('starts a new investigation when the primary action is clicked', async () => {
    const user = userEvent.setup();
    const onStart = jest.fn();
    renderSplash(onStart);

    await user.click(screen.getByRole('button', { name: 'Start new investigation' }));
    expect(onStart).toHaveBeenCalledTimes(1);
  });

  it('shows the version stamp', () => {
    renderSplash();
    expect(screen.getByText(new RegExp(`^v${__APP_VERSION__}$`))).toBeInTheDocument();
  });

  it('renders fully composed immediately under prefers-reduced-motion', async () => {
    mockMatchMedia(true);
    renderSplash();

    expect(screen.getByTestId('splash-actions')).toHaveClass('opacity-100');
  });

  it('reveals the actions column after the stagger delay otherwise', async () => {
    jest.useFakeTimers();
    renderSplash();

    expect(screen.getByTestId('splash-actions')).toHaveClass('opacity-0');

    jest.advanceTimersByTime(200);
    await waitFor(() => {
      expect(screen.getByTestId('splash-actions')).toHaveClass('opacity-100');
    });
    jest.useRealTimers();
  });
});
