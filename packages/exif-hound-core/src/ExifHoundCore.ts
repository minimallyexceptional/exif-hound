import { MiddlewareNamespace } from './middleware/MiddlewareNamespace';
import * as archiveApi from './archive/ArchiveNamespace';
import { ProjectSessionFacade } from './project/ProjectSessionFacade';
import { WorkbenchNamespace } from './workbench/WorkbenchNamespace';
import { EvidenceNamespace } from './evidence/EvidenceNamespace';
import { ImportExportFacade } from './importExport/ImportExportFacade';
import { UpdaterNamespace } from './updater/UpdaterNamespace';
import { GeocodingFacade } from './geocoding/GeocodingFacade';

export class ExifHoundCore {
  readonly middleware = new MiddlewareNamespace();
  readonly archive = archiveApi;
  readonly project = new ProjectSessionFacade();
  readonly workbench = new WorkbenchNamespace();
  readonly evidence = new EvidenceNamespace();
  readonly importExport = new ImportExportFacade();
  readonly updater = new UpdaterNamespace();
  readonly geocoding = new GeocodingFacade();
}
