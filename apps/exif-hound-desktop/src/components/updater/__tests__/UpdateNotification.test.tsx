import React from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UpdateNotification } from '../UpdateNotification';
import { UpdateService } from 'exif-hound-core';
import { FakeUpdaterBackend, UPDATE_2_7_0 } from 'exif-hound-core';
import { notify } from '../../../feedback/notify';

jest.mock('../../../feedback/notify', () => ({
  notify: {
    success: jest.fn(),
    error: jest.fn(),
    loading: jest.fn(),
    action: jest.fn(),
    dismiss: jest.fn(),
  },
  UPDATE_TOAST_IDS: {
    available: 'update-available',
    progress: 'update-progress',
    ready: 'update-ready',
    error: 'update-error',
  },
}));

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

function lastActionCall() {
  const mock = notify.action as jest.Mock;
  return mock.mock.calls[mock.mock.calls.length - 1]?.[0];
}

describe('UpdateNotification', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders nothing when the app is idle', async () => {
    const { container } = await renderInState(async () => undefined);
    expect(container).toBeEmptyDOMElement();
    expect(notify.action).not.toHaveBeenCalled();
  });

  it('renders nothing when a silent check fails (offline stays invisible)', async () => {
    const { container } = await renderInState(async (service, backend) => {
      backend.checkError = new Error('DNS failure');
      await service.check({ silent: true });
    });
    expect(container).toBeEmptyDOMElement();
    expect(notify.error).not.toHaveBeenCalled();
  });

  it('shows an available toast with version and release notes', async () => {
    await renderInState(async service => {
      await service.check({ silent: true });
    });

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(lastActionCall()).toEqual(expect.objectContaining({
      id: 'update-available',
      title: 'EXIF Hound 2.7.0 is available.',
      description: expect.stringContaining('Improved map tools'),
      actionLabel: 'Install 2.7.0',
    }));
  });

  it('dismissing the available toast does not download', async () => {
    const { service } = await renderInState(async service => {
      await service.check({ silent: true });
    });
    lastActionCall().onDismiss();
    expect(service.getState().name).toBe('available');
    expect(notify.loading).not.toHaveBeenCalled();
  });

  it('Install starts the download', async () => {
    const { service } = await renderInState(async service => {
      await service.check({ silent: true });
    });
    lastActionCall().onAction();
    await waitFor(() => expect(service.getState().name).toBe('ready-to-install'));
  });

  it('download shows progress and then the ready toast', async () => {
    await renderInState(async service => {
      await service.check({ silent: true });
      await service.download();
    });

    expect(lastActionCall()).toEqual(expect.objectContaining({
      id: 'update-ready',
      title: expect.stringContaining('2.7.0 has downloaded and passed its security verification'),
      actionLabel: 'Restart & Update',
    }));
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

    expect(notify.loading).toHaveBeenCalledWith('Downloading update… 40%', expect.objectContaining({
      id: 'update-progress',
    }));
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

    act(() => { lastActionCall().onAction(); });
    expect(
      screen.getByText(/You have unsaved work\. Restarting now will close EXIF Hound/)
    ).toBeInTheDocument();
    expect(backend.calls.install).toBe(0);

    await userEvent.click(screen.getByRole('button', { name: 'Go Back' }));
    act(() => { lastActionCall().onAction(); });
    await userEvent.click(screen.getByRole('button', { name: 'Restart & Update' }));

    await waitFor(() => expect(backend.calls.install).toBe(1));
    expect(backend.calls.relaunch).toBe(1);
  });

  it('restarts immediately when there is no unsaved work', async () => {
    const { backend } = await renderInState(async service => {
      await service.check({ silent: true });
      await service.download();
    });

    act(() => { lastActionCall().onAction(); });
    await waitFor(() => expect(backend.calls.install).toBe(1));
    expect(backend.calls.relaunch).toBe(1);
  });

  it('shows a visible error toast only for user-initiated failures', async () => {
    await renderInState(async (service, backend) => {
      backend.checkError = new Error('connection refused');
      await service.check({ silent: false });
    });

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(notify.error).toHaveBeenCalledWith(
      expect.stringMatching(/Unable to check for updates\. Please verify your internet connection/),
      expect.objectContaining({ id: 'update-error' }),
    );
  });

  it('never shows an "ignore signature" escape hatch', async () => {
    await renderInState(async (service, backend) => {
      backend.nextCheck = UPDATE_2_7_0;
      await service.check({ silent: true });
      backend.downloadError = new Error('signature verification failed');
      await service.download().catch(() => undefined);
    });

    const bodyText = document.body.textContent ?? '';
    expect(bodyText.toLowerCase()).not.toContain('ignore');
    expect(notify.error).toHaveBeenCalledWith(
      expect.stringMatching(/security verification/),
      expect.objectContaining({ id: 'update-error' }),
    );
  });
});
