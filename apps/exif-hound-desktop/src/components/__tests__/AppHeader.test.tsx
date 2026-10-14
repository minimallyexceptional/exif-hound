import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AppHeader } from '../AppHeader';
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

function renderHeader(props: Partial<React.ComponentProps<typeof AppHeader>> = {}) {
  return render(
    <ThemeProvider>
      <AppHeader
        imagesCount={2}
        viewMode="map"
        onUpload={jest.fn()}
        onExport={jest.fn()}
        onOpenSettings={jest.fn()}
        onSetView={jest.fn()}
        onCheckForUpdates={jest.fn()}
        {...props}
      />
    </ThemeProvider>
  );
}

describe('AppHeader', () => {
  beforeEach(() => {
    mockMatchMedia(false);
  });

  it('keeps settings in the header and omits the theme toggle and help menu', () => {
    renderHeader();

    expect(screen.getByRole('button', { name: 'Open settings' })).toBeInTheDocument();
    expect(screen.queryAllByRole('button', { name: /Switch to (light|dark) mode/ })).toHaveLength(0);
    expect(screen.queryByRole('button', { name: 'Help menu' })).not.toBeInTheDocument();
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('does not expose an Investigation view', () => {
    renderHeader();

    expect(screen.queryByRole('button', { name: 'Investigation' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Workbench' })).toBeInTheDocument();
  });

  it('does not expose theme or help actions from the mobile menu', async () => {
    const user = userEvent.setup();
    renderHeader();

    await user.click(screen.getByRole('button', { name: 'Open menu' }));

    const menu = screen.getByTestId('mobile-menu');
    expect(within(menu).getByRole('button', { name: 'Settings' })).toBeInTheDocument();
    expect(screen.queryAllByRole('button', { name: /Switch to (light|dark) mode/ })).toHaveLength(0);
    expect(screen.queryByRole('button', { name: 'Help menu' })).not.toBeInTheDocument();
    expect(menu).not.toHaveTextContent('Theme');
  });
});
