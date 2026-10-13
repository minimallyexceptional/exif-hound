export {
  serializeExif,
  toImageData,
  toStoreImage,
  toStoreState,
  fromStoreState,
  type ProjectViewMode,
  type SessionEntry,
  type ImportRaw,
  type AppSessionState,
} from './ProjectSessionService';

import * as session from './ProjectSessionService';
import { getArchiveDbProvider, registerArchiveDbProviderFactory } from '../platform/desktop/archiveDbProvider';
import { TauriFsPort } from '../platform/desktop/TauriFsPort';
import * as projectDialogs from '../platform/desktop/projectDialogs';
import * as recentProjects from '../platform/desktop/recentProjects';

export class ProjectSessionFacade {
  readonly session = session;
  readonly db = { getArchiveDbProvider, registerArchiveDbProviderFactory };
  readonly fs = { TauriFsPort };
  readonly dialogs = projectDialogs;
  readonly recentProjects = recentProjects;
}
