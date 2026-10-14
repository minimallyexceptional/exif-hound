import * as archiveApi from './archive/ArchiveNamespace';
import { ProjectSessionFacade } from './project/ProjectSessionFacade';
import { WorkbenchNamespace } from './workbench/WorkbenchNamespace';
import { EvidenceNamespace } from './evidence/EvidenceNamespace';
import { ImportExportFacade } from './importExport/ImportExportFacade';
import { UpdaterNamespace } from './updater/UpdaterNamespace';
import { GeocodingFacade } from './geocoding/GeocodingFacade';
import type { ReverseGeocodingProvider } from './geocoding/reverseGeocodingProvider';
import { MiddlewareNamespace, type MiddlewareNamespaceOptions } from './middleware/MiddlewareNamespace';

export interface ExifHoundCoreOptions {
  middleware?: MiddlewareNamespaceOptions;
  reverseGeocodingProvider?: ReverseGeocodingProvider;
}

export class ExifHoundCore {
  readonly middleware: MiddlewareNamespace;
  readonly archive = archiveApi;
  readonly project = new ProjectSessionFacade();
  readonly workbench = new WorkbenchNamespace();
  readonly evidence = new EvidenceNamespace();
  readonly importExport = new ImportExportFacade();
  readonly updater = new UpdaterNamespace();
  readonly geocoding: GeocodingFacade;

  constructor(options: ExifHoundCoreOptions = {}) {
    this.middleware = new MiddlewareNamespace(options.middleware);
    this.geocoding = new GeocodingFacade(options.reverseGeocodingProvider);
  }
}
