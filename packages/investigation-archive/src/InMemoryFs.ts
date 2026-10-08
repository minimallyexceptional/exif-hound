/**
 * In-memory FsPort for tests. Records the operation order so tests can
 * assert durability ordering (e.g. the database is written before the
 * images directory is created).
 */
export class InMemoryFs {
  private readonly files = new Map<string, Uint8Array>();
  private readonly dirs = new Set<string>();
  readonly operationOrder: string[] = [];

  async exists(path: string): Promise<boolean> {
    return this.files.has(path) || this.dirs.has(path);
  }

  async mkdir(path: string): Promise<void> {
    this.operationOrder.push(`mkdir:${path}`);
    this.dirs.add(path);
  }

  async writeFile(path: string, data: Uint8Array): Promise<void> {
    this.operationOrder.push(`write:${path}`);
    this.files.set(path, new Uint8Array(data));
  }

  async readFile(path: string): Promise<Uint8Array> {
    const data = this.files.get(path);
    if (!data) throw new Error(`ENOENT: ${path}`);
    return new Uint8Array(data);
  }

  async deleteFile(path: string): Promise<void> {
    this.operationOrder.push(`delete:${path}`);
    this.files.delete(path);
  }

  /** Snapshot of stored files (path → bytes) for assertions. */
  snapshot(): Record<string, Uint8Array> {
    const out: Record<string, Uint8Array> = {};
    for (const [path, data] of this.files) out[path] = data;
    return out;
  }
}