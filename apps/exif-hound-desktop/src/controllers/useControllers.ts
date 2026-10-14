import { useMemo } from 'react';
import { useCore } from '../core/CoreContext';
import { AppSessionController } from './AppSessionController';
import { WorkbenchController } from './WorkbenchController';
import { EvidenceController } from './EvidenceController';
import { UpdaterController } from './UpdaterController';
import { ExifViewController } from './ExifViewController';

export function useAppSessionController(): AppSessionController {
  const core = useCore();
  return useMemo(() => new AppSessionController(core), [core]);
}

export function useWorkbenchController(): WorkbenchController {
  const core = useCore();
  return useMemo(() => new WorkbenchController(core), [core]);
}

export function useEvidenceController(): EvidenceController {
  const core = useCore();
  return useMemo(() => new EvidenceController(core), [core]);
}

export function useUpdaterController(): UpdaterController {
  const core = useCore();
  return useMemo(() => new UpdaterController(core), [core]);
}

export function useExifViewController(): ExifViewController {
  const core = useCore();
  return useMemo(() => new ExifViewController(core), [core]);
}
