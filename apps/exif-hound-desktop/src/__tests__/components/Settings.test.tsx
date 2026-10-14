import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Settings from '../../components/Settings';
import { ThemeProvider } from '../../context/ThemeContext';
import { SettingsProvider } from '../../context/SettingsContext';
import { GITHUB_REPOSITORY_URL, GITHUB_SPONSORS_URL } from '../../constants/github';
import { openExternalUrl } from '../../utils/openExternalUrl';

jest.mock('@tauri-apps/api/app', () => ({
  getVersion: jest.fn().mockResolvedValue('2.6.7'),
}));

jest.mock('../../utils/openExternalUrl', () => ({
  openExternalUrl: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../../components/updater/useUpdateControl', () => ({
  useUpdateControl: () => ({
    state: { name: 'current' },
    checkNow: jest.fn(),
    download: jest.fn(),
    restart: jest.fn(),
    dismiss: jest.fn(),
  }),
}));

async function renderSettings() {
  const utils = render(
    <ThemeProvider>
      <SettingsProvider>
        <Settings onClose={jest.fn()} />
      </SettingsProvider>
    </ThemeProvider>
  );
  await screen.findByText(/Version 2\.6\.7/);
  return utils;
}

describe('Settings About GitHub actions', () => {
  beforeEach(() => {
    jest.mocked(openExternalUrl).mockClear();
  });

  it('renders the GitHub sponsor button beside the star button', async () => {
    await renderSettings();

    const star = screen.getByTestId('settings-star-on-github');
    const sponsor = screen.getByTestId('settings-sponsor-on-github');

    expect(star).toHaveTextContent('Star on GitHub');
    expect(sponsor).toHaveAccessibleName('Sponsor minimallyexceptional');
    expect(sponsor).toHaveAttribute('href', GITHUB_SPONSORS_URL);
    expect(star.compareDocumentPosition(sponsor) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(star.parentElement).toBe(sponsor.parentElement);
  });

  it('opens the GitHub Sponsors page from the sponsor button', async () => {
    const user = userEvent.setup();
    await renderSettings();

    await user.click(screen.getByTestId('settings-sponsor-on-github'));

    expect(openExternalUrl).toHaveBeenCalledWith(GITHUB_SPONSORS_URL);
    expect(openExternalUrl).not.toHaveBeenCalledWith(GITHUB_REPOSITORY_URL);
  });
});
