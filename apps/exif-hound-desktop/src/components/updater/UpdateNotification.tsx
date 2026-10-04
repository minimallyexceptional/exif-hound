import React, { useEffect, useMemo, useState } from 'react';
import {
  UpdateService,
  UpdateState,
  getUpdateService,
  getUpdateConfiguration,
} from '../../services/updater';
import { UpdateAvailableDialog } from './UpdateAvailableDialog';
import { UpdateProgressDialog } from './UpdateProgressDialog';
import { UpdateReadyDialog } from './UpdateReadyDialog';
import { UpdateErrorDialog } from './UpdateErrorDialog';

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
  // Versions the user deferred with "Later" — they stay reachable through
  // the manual check (Settings / Help menu) but stop nagging automatically.
  const [dismissedVersions, setDismissedVersions] = useState<ReadonlySet<string>>(new Set());

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

  return (
    <>
      {state.name === 'available' && update && !dismissed && (
        <UpdateAvailableDialog
          update={update}
          appName={appName}
          downloadStarting={false}
          onLater={() => setDismissedVersions(prev => new Set(prev).add(update.version))}
          onDownload={() => {
            void service.download().catch(() => undefined);
          }}
        />
      )}

      {(state.name === 'downloading' ||
        state.name === 'installing' ||
        state.name === 'restarting') && (
        <UpdateProgressDialog phase={state.name} progress={state.progress} />
      )}

      {state.name === 'ready-to-install' && update && !dismissed && (
        <UpdateReadyDialog
          update={update}
          appName={appName}
          hasUnsavedWork={hasUnsavedWork()}
          onRestart={() => {
            void service.installAndRestart().catch(() => undefined);
          }}
          onLater={() => setDismissedVersions(prev => new Set(prev).add(update.version))}
        />
      )}

      {state.name === 'error' && state.errorVisible && state.error && (
        <UpdateErrorDialog error={state.error} onDismiss={() => service.dismiss()} />
      )}
    </>
  );
};
