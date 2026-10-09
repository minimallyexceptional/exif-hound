/**
 * RED: TauriFsPort binds the package FsPort to the plugin-fs JS API, and
 * ProjectSessionService maps project records to/from the app session model.
 */
import { TauriFsPort } from '../TauriFsPort';

jest.mock('@tauri-apps/plugin-fs', () => ({
  exists: jest.fn(),
  mkdir: jest.fn(),
  writeFile: jest.fn(),
  readFile: jest.fn(),
  remove: jest.fn(),
}));

import { exists, mkdir, writeFile, readFile, remove } from '@tauri-apps/plugin-fs';

beforeEach(() => {
  jest.clearAllMocks();
});

describe('TauriFsPort', () => {
  it('exists delegates to plugin-fs', async () => {
    (exists as jest.Mock).mockResolvedValue(true);
    const port = new TauriFsPort();
    await expect(port.exists('/tmp/Proj/data/data.db')).resolves.toBe(true);
    expect(exists).toHaveBeenCalledWith('/tmp/Proj/data/data.db');
  });

  it('mkdir delegates to plugin-fs', async () => {
    (mkdir as jest.Mock).mockResolvedValue(undefined);
    const port = new TauriFsPort();
    await port.mkdir('/tmp/Proj/images');
    expect(mkdir).toHaveBeenCalledWith('/tmp/Proj/images', { recursive: true });
  });

  it('writeFile delegates to plugin-fs', async () => {
    (writeFile as jest.Mock).mockResolvedValue(undefined);
    const port = new TauriFsPort();
    await port.writeFile('/tmp/Proj/data/data.db', new Uint8Array([1, 2, 3]));
    expect(writeFile).toHaveBeenCalledWith(
      '/tmp/Proj/data/data.db',
      expect.any(Uint8Array)
    );
  });

  it('readFile delegates and normalizes to Uint8Array', async () => {
    (readFile as jest.Mock).mockResolvedValue(new Uint8Array([9, 8]));
    const port = new TauriFsPort();
    await expect(port.readFile('/tmp/Proj/data/data.db')).resolves.toEqual(
      new Uint8Array([9, 8])
    );
  });

  it('deleteFile maps to plugin-fs remove', async () => {
    (remove as jest.Mock).mockResolvedValue(undefined);
    const port = new TauriFsPort();
    await port.deleteFile('/tmp/Proj/data/old.kml');
    expect(remove).toHaveBeenCalledWith('/tmp/Proj/data/old.kml');
  });

  it('removeDir maps to plugin-fs recursive remove', async () => {
    (remove as jest.Mock).mockResolvedValue(undefined);
    const port = new TauriFsPort();
    await port.removeDir('/tmp/Proj');
    expect(remove).toHaveBeenCalledWith('/tmp/Proj', { recursive: true });
  });
});