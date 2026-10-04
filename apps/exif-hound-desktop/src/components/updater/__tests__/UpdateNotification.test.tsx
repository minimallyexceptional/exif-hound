import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UpdateNotification } from '../UpdateNotification';
import { UpdateService } from '../../../services/updater/UpdateService';
import { FakeUpdaterBackend, UPDATE_2_7_0 } from '../../../services/updater/__tests__/FakeUpdaterBackend';

/**
 * Drives a real UpdateService (with the fake backend) to a given state and
 * renders UpdateNotification against it, so the tests exercise the actual
 * state machine and the actual wiring — not a mocked store.
 */
async function renderInState(
  drive: (service: UpdateService, backend: FakeUpdaterBackend) => Promise<void>,
  options: { hasUnsavedWork?: () => boolean } = {}
) {
  const backend = new FakeUpdaterBackend();
  backend.nextCheck = UPDATE_2_7_0;
  const service = new UpdateService({ backend });
  await drive(service, backend);
  const utils = render(
    <UpdateNotification
      hasUnsavedWork={options.hasUnsavedWork ?? (() => false)}
      service={service}
      enableAutomaticChecks={false}
    />
  );
  return { backend, service, ...utils };
}

describe('UpdateNotification', () => {
  it('renders nothing when the app is idle', async () => {
    const { container } = await renderInState(async () => undefined);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing when a silent check fails (offline stays invisible)', async () => {
    const { container } = await renderInState(async (service, backend) => {
      backend.checkError = new Error('DNS failure');
      await service.check({ silent: true });
    });
    expect(container).toBeEmptyDOMElement();
  });

  it('shows the available dialog with version and release notes', async () => {
    await renderInState(async service => {
      await service.check({ silent: true }); // backend preloaded with 2.7.0
    });

    expect(screen.getByText('Exif Hound 2.7.0 is available.')).toBeInTheDocument();
    expect(screen.getByText('Improved map tools')).toBeInTheDocument();
    expect(screen.getByText('Fixed Linux compatibility')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Later' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Download Update' })).toBeInTheDocument();
  });

  it('labels, focuses, and dismisses an updater dialog with Escape', async () => {
    await renderInState(async service => {
      await service.check({ silent: true });
    });

    const dialog = screen.getByRole('dialog', { name: 'Update Available' });
    expect(dialog).toContainElement(document.activeElement as HTMLElement);
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('dialog', { name: 'Update Available' })).not.toBeInTheDocument();
  });

  it('"Later" dismisses the notification without touching the service state', async () => {
    const { service } = await renderInState(async service => {
      await service.check({ silent: true });
    });
    await userEvent.click(screen.getByRole('button', { name: 'Later' }));
    expect(screen.queryByText('Update Available')).not.toBeInTheDocument();
    // The update is still tracked internally for the manual path.
    expect(service.getState().name).toBe('available');
  });

  it('download shows progress and then the ready dialog', async () => {
    await renderInState(async service => {
      await service.check({ silent: true });
      await service.download();
    });

    expect(screen.getByText('Update Ready')).toBeInTheDocument();
    expect(
      screen.getByText(/2\.7\.0 has downloaded and passed its security verification/)
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Restart & Update' })).toBeInTheDocument();
  });

  it('shows visible download progress while downloading', async () => {
    const backend = new FakeUpdaterBackend();
    backend.nextCheck = UPDATE_2_7_0;
    const service = new UpdateService({ backend });
    await service.check({ silent: true });

    let release!: () => void;
    backend.download = onProgress => {
      onProgress({ receivedBytes: 400, totalBytes: 1000 });
      return new Promise<void>(resolve => {
        release = resolve;
      });
    };
    const downloading = service.download();

    render(
      <UpdateNotification
        hasUnsavedWork={() => false}
        service={service}
        enableAutomaticChecks={false}
      />
    );

    expect(await screen.findByText('Downloading update…')).toBeInTheDocument();
    expect(screen.getByText(/40%/)).toBeInTheDocument();
    release();
    await downloading;
  });

  it('requires confirmation before restarting with unsaved work', async () => {
    const { backend } = await renderInState(
      async service => {
        await service.check({ silent: true });
        await service.download();
      },
      { hasUnsavedWork: () => true }
    );

    await userEvent.click(screen.getByRole('button', { name: 'Restart & Update' }));
    expect(
      screen.getByText(/You have unsaved work\. Restarting now will close EXIF HOUND/)
    ).toBeInTheDocument();
    expect(backend.calls.install).toBe(0);

    await userEvent.click(screen.getByRole('button', { name: 'Go Back' }));
    await userEvent.click(screen.getByRole('button', { name: 'Restart & Update' }));
    await userEvent.click(screen.getByRole('button', { name: 'Restart & Update' }));

    await waitFor(() => expect(backend.calls.install).toBe(1));
    expect(backend.calls.relaunch).toBe(1);
  });

  it('restarts immediately when there is no unsaved work', async () => {
    const { backend } = await renderInState(async service => {
      await service.check({ silent: true });
      await service.download();
    });

    await userEvent.click(screen.getByRole('button', { name: 'Restart & Update' }));
    await waitFor(() => expect(backend.calls.install).toBe(1));
    expect(backend.calls.relaunch).toBe(1);
  });

  it('shows a visible error dialog only for user-initiated failures', async () => {
    await renderInState(async (service, backend) => {
      backend.checkError = new Error('connection refused');
      await service.check({ silent: false });
    });

    expect(screen.getByText('Update Problem')).toBeInTheDocument();
    expect(
      screen.getByText(/Unable to check for updates\. Please verify your internet connection/)
    ).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'OK' }));
    expect(screen.queryByText('Update Problem')).not.toBeInTheDocument();
  });

  it('never shows an "ignore signature" escape hatch', async () => {
    await renderInState(async (service, backend) => {
      backend.nextCheck = UPDATE_2_7_0;
      await service.check({ silent: true });
      backend.downloadError = new Error('signature verification failed');
      await service.download().catch(() => undefined);
    });

    expect(screen.getByText('Update Problem')).toBeInTheDocument();
    const bodyText = document.body.textContent ?? '';
    expect(bodyText.toLowerCase()).not.toContain('ignore');
    expect(bodyText).toContain('security verification');
  });
});
