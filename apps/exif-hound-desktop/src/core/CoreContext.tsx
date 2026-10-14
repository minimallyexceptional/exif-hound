import { createContext, useContext, type ReactNode } from 'react';
import type { ExifHoundCore } from 'exif-hound-core';

const CoreContext = createContext<ExifHoundCore | null>(null);

export function CoreProvider({ core, children }: { core: ExifHoundCore; children: ReactNode }) {
  return <CoreContext.Provider value={core}>{children}</CoreContext.Provider>;
}

export function useCore(): ExifHoundCore {
  const core = useContext(CoreContext);
  if (!core) throw new Error('useCore must be used within CoreProvider');
  return core;
}
