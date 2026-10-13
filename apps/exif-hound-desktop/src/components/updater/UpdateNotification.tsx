import React, { useEffect, useMemo, useState } from 'react';
import {
  UpdateService,
  UpdateState,
  getUpdateService,
  getUpdateConfiguration,
} from 'exif-hound-core';
import { notify, UPDATE_TOAST_IDS } from '../../feedback';
import { UpdateReadyDialog } from './UpdateReadyDialog';

interface Props {
  /**
   * True when the session holds unsaved work. The updater never restarts
   * the app on its own; UpdateReadyDialog uses this to add a confirmation
   * step before restarting.
   */
  hasUnsavedWork: () => boolean;
  /** Override for tests; defaults to the app-wide singleton. */
  service?: UpdateService;
  /** Start automatic discovery on mount (default true). */
  enableAutomaticChecks?: boolean;
}

const UPDATER_TOAST_IDS = Object.values(UPDATE_TOAST_IDS);

function dismissOtherUpdaterToasts(keep: string) {
  for (const id of UPDATER_TOAST_IDS) {
    if (id !== keep) notify.dismiss(id);
  }
}

function downloadLabel(state: UpdateState): string {
  if (state.name === 'downloading') {
    const total = state.progress?.totalBytes;
    const received = state.progress?.receivedBytes ?? 0;
    if (total && total > 0) {
      const percent = Math.min(100, Math.round((received / total) * 100));
      return `Downloading update… ${percent}%`;
    }
    return 'Downloading update…';
  }
  if (state.name === 'installing') return 'Installing update…';
  return 'Restarting…';
}

/**
 * Renders the update UX from the service's state machine, and owns the
 * automatic discovery schedule. Automatic check failures are invisible by
 * design (the service swallows them); only user-initiated errors are shown.
 */
export const UpdateNotification: React.FC<Props> = ({
  hasUnsavedWork,
  service: serviceProp,
  enableAutomaticChecks = true,
}) => {
  const service = useMemo(() => serviceProp ?? getUpdateService(), [serviceProp]);
  const [state, setState] = useState<UpdateState>(service.getState());
  const [dismissedVersions, setDismissedVersions] = useState<ReadonlySet<string>>(new Set());
  const [confirmUnsaved, setConfirmUnsaved] = useState(false);

  useEffect(() => service.subscribe(setState), [service]);

  useEffect(() => {
    if (enableAutomaticChecks) {
      service.startAutomaticChecks();
      return () => service.stopAutomaticChecks();
    }
    return undefined;
  }, [service, enableAutomaticChecks]);

  const { update } = state;
  const appName = getUpdateConfiguration().appName;
  const dismissed = update !== undefined && dismissedVersions.has(update.version);

  useEffect(() => {
    if (state.name === 'available' && update && !dismissed) {
      dismissOtherUpdaterToasts(UPDATE_TOAST_IDS.available);
      const notes = update.notes
        ? update.notes.split('\n').map(line => line.trim()).filter(Boolean).join(' ')
        : undefined;
      notify.action({
        id: UPDATE_TOAST_IDS.available,
        title: `${appName} ${update.version} is available.`,
        description: notes || undefined,
        actionLabel: `Install ${update.version}`,
        onAction: () => {
          void service.download().catch(() => undefined);
        },
        onDismiss: () => {
          if (service.getState().name === 'available') {
            setDismissedVersions(prev => new Set(prev).add(update.version));
          }
        },
      });
      return;
    }

    if (state.name === 'downloading' || state.name === 'installing' || state.name === 'restarting') {
      dismissOtherUpdaterToasts(UPDATE_TOAST_IDS.progress);
      notify.loading(downloadLabel(state), { id: UPDATE_TOAST_IDS.progress });
      return;
    }

    if (state.name === 'ready-to-install' && update && !dismissed) {
      dismissOtherUpdaterToasts(UPDATE_TOAST_IDS.ready);
      notify.action({
        id: UPDATE_TOAST_IDS.ready,
        title: `${appName} ${update.version} has downloaded and passed its security verification.`,
        actionLabel: 'Restart & Update',
        onAction: () => {
          if (hasUnsavedWork()) setConfirmUnsaved(true);
          else void service.installAndRestart().catch(() => undefined);
        },
        onDismiss: () => {
          if (service.getState().name === 'ready-to-install') {
            setDismissedVersions(prev => new Set(prev).add(update.version));
          }
        },
      });
      return;
    }

    if (state.name === 'error' && state.errorVisible && state.error) {
      dismissOtherUpdaterToasts(UPDATE_TOAST_IDS.error);
      notify.error(state.error.userMessage, {
        id: UPDATE_TOAST_IDS.error,
        onDismiss: () => service.dismiss(),
      });
      return;
    }

    if (state.name === 'idle' || dismissed) {
      for (const id of UPDATER_TOAST_IDS) notify.dismiss(id);
    }
  }, [appName, dismissed, hasUnsavedWork, service, state, update]);

  if (!confirmUnsaved) return null;

  return (
    <UpdateReadyDialog
      onRestart={() => {
        setConfirmUnsaved(false);
        void service.installAndRestart().catch(() => undefined);
      }}
      onCancel={() => setConfirmUnsaved(false)}
    />
  );
};
