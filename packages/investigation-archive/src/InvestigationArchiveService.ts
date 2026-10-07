import { SaveInput, OpenResult, Manifest } from './format';
import { DatabaseEngineProvider, Zipper } from './ports';
import { buildArchive } from './ArchiveWriter';
import { readArchive, readManifestOnly } from './ArchiveReader';

export interface InvestigationArchiveDeps {
  dbProvider: DatabaseEngineProvider;
  zipper: Zipper;
}

/**
 * OOP facade over the archive format: save builds bytes from session input,
 * open reads bytes back into a typed record. Bind the ports (database engine
 * provider + zip codec) from outside — the service itself carries no runtime.
 */
export class InvestigationArchiveService {
  constructor(private readonly deps: InvestigationArchiveDeps) {}

  async save(input: SaveInput): Promise<{ bytes: Uint8Array; fileNameSuggestion: string }> {
    const built = await buildArchive(input, this.deps);
    return { bytes: built.bytes, fileNameSuggestion: built.fileNameSuggestion };
  }

  async open(bytes: Uint8Array): Promise<OpenResult> {
    return readArchive(bytes, this.deps);
  }

  async readManifest(bytes: Uint8Array): Promise<Manifest> {
    return readManifestOnly(bytes, this.deps.zipper);
  }
}