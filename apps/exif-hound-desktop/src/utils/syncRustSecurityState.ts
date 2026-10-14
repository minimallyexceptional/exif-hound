import type { MapSettings } from '../types';
import { getRecentProjects } from './recentProjects';
import {
  hostFromTileTemplate,
  syncCustomTileHosts,
  syncRemoteImageHosts,
  syncTrustedProjectRoots,
} from './rustNetwork';
import { readAllowedRemoteHosts } from './remoteImages';

export async function syncRustSecurityState(mapSettings: MapSettings): Promise<void> {
  const recentPaths = getRecentProjects().map(project => project.path);
  await syncTrustedProjectRoots(recentPaths);
  await syncRemoteImageHosts([...readAllowedRemoteHosts()]);

  const tileHosts: string[] = [];
  if (mapSettings.customTiles.enabled) {
    const host = hostFromTileTemplate(mapSettings.customTiles.url);
    if (host) tileHosts.push(host);
  }
  await syncCustomTileHosts(tileHosts);
}
