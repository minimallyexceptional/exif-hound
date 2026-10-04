import { useEffect, useState } from 'react';
import { UpdateService, UpdateState, getUpdateService } from '../../services/updater';

/**
 * Binds the update service state to React for surfaces that show update
 * status inline (Settings "About" panel, Help menu). Rendering of dialogs
 * remains the job of UpdateNotification.
 */
export function useUpdateControl(
  service: UpdateService = getUpdateService()
): {
  state: UpdateState;
  /** Manual check — failures are surfaced to the user. */
  checkNow: () => void;
  download: () => void;
  restart: () => void;
  dismiss: () => void;
} {
  const [state, setState] = useState<UpdateState>(service.getState());

  useEffect(() => service.subscribe(setState), [service]);

  return {
    state,
    checkNow: () => void service.check({ silent: false }),
    download: () => void service.download().catch(() => undefined),
    restart: () => void service.installAndRestart().catch(() => undefined),
    dismiss: () => service.dismiss(),
  };
}
