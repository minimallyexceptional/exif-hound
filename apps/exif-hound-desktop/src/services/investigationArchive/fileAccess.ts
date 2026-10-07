/**
 * File access for .investigation archives (design.md D5).
 * Tauri path: plugin-dialog (save/open) + plugin-fs (write/read).
 * Browser path: File System Access API for plain-browser dev mode.
 *
 * The save flow is a single dialog: `saveArchiveWithDialog` only builds the
 * bytes after the user confirms a location, so cancelling is a no-op.
 */
import { isTauriEnvironment } from '../../utils/fileSystem';

const INVESTIGATION_FILTER = [
  { name: 'Investigation', extensions: ['investigation'] },
];

export interface SavedArchive {
  /** Chosen path (Tauri) or suggested name (browser dev). */
  path: string;
  /** Investigation name derived from the chosen file name. */
  name: string;
}

async function pickSavePathTauri(defaultName: string): Promise<string | null> {
  const { save } = await import('@tauri-apps/plugin-dialog');
  return save({
    defaultPath: defaultName,
    filters: INVESTIGATION_FILTER,
  });
}

async function writeBytesTauri(path: string, bytes: Uint8Array): Promise<void> {
  const { writeFile } = await import('@tauri-apps/plugin-fs');
  await writeFile(path, bytes);
}

async function pickOpenPathTauri(): Promise<string | null> {
  const { open } = await import('@tauri-apps/plugin-dialog');
  const picked = await open({
    multiple: false,
    directory: false,
    filters: INVESTIGATION_FILTER,
  });
  return typeof picked === 'string' ? picked : null;
}

async function readBytesTauri(path: string): Promise<Uint8Array> {
  const { readFile } = await import('@tauri-apps/plugin-fs');
  const bytes = await readFile(path);
  return bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
}

// Browser (File System Access API) fallbacks for plain-browser dev mode.
interface SaveFileHandle {
  createWritable(): Promise<{
    write(content: BufferSource): Promise<void>;
    close(): Promise<void>;
  }>;
}
interface OpenFileHandle {
  getFile(): Promise<File>;
}

// Accessed via local casts — the app's shared declaration lives in
// utils/fileSystem.ts and must stay the single global source.
interface FsAccessWindow {
  showSaveFilePicker?(options?: {
    suggestedName?: string;
    types?: Array<{ description: string; accept: Record<string, string[]> }>;
  }): Promise<SaveFileHandle>;
  showOpenFilePicker?(options?: {
    types?: Array<{ description: string; accept: Record<string, string[]> }>;
  }): Promise<OpenFileHandle[]>;
}

function fsAccess(): FsAccessWindow {
  return window as unknown as FsAccessWindow;
}

function acceptTypes(): Array<{ description: string; accept: Record<string, string[]> }> {
  return [
    {
      description: 'Investigation',
      accept: { 'application/octet-stream': ['.investigation'] },
    },
  ];
}

function nameFromPath(path: string): string {
  const base = path.split(/[\\/]/).pop() ?? path;
  return base.replace(/\.investigation$/i, '');
}

/**
 * Single-dialog save. `buildBytes` runs only after the user confirms a
 * location (and receives the investigation name derived from the chosen
 * file name), so cancelling costs nothing and writes nothing. Returns null
 * when the dialog was cancelled.
 */
export async function saveArchiveWithDialog(
  defaultName: string,
  buildBytes: (name: string) => Promise<Uint8Array>,
): Promise<SavedArchive | null> {
  if (isTauriEnvironment()) {
    const path = await pickSavePathTauri(defaultName);
    if (!path) return null;
    const name = nameFromPath(path);
    const bytes = await buildBytes(name);
    await writeBytesTauri(path, bytes);
    return { path, name };
  }

  const picker = fsAccess().showSaveFilePicker;
  if (typeof picker !== 'function') {
    throw new Error('Saving is only supported inside the Exif Hound desktop app.');
  }
  let handle: SaveFileHandle;
  try {
    handle = await picker.call(fsAccess(), {
      suggestedName: defaultName,
      types: acceptTypes(),
    });
  } catch {
    return null; // cancelled
  }
  const name = nameFromPath(defaultName);
  const bytes = await buildBytes(name);
  const writable = await handle.createWritable();
  await writable.write(bytes as unknown as BufferSource);
  await writable.close();
  return { path: defaultName, name };
}

/**
 * Single-dialog open. Returns null when cancelled; throws on read/parse
 * errors (callers surface them and leave state untouched).
 */
export async function pickAndReadArchive(): Promise<{ path: string; bytes: Uint8Array } | null> {
  if (isTauriEnvironment()) {
    const path = await pickOpenPathTauri();
    if (!path) return null;
    return { path, bytes: await readBytesTauri(path) };
  }
  if (typeof fsAccess().showOpenFilePicker !== 'function') return null;
  try {
    const [handle] = (await fsAccess().showOpenFilePicker!({ types: acceptTypes() })) as OpenFileHandle[];
    const file = await handle.getFile();
    return { path: file.name, bytes: new Uint8Array(await file.arrayBuffer()) };
  } catch {
    return null;
  }
}

/** Read an archive from a known path (recent-history resume). */
export async function readArchiveFile(path: string): Promise<Uint8Array> {
  if (!isTauriEnvironment()) {
    throw new Error('Opening by path is only supported inside the Exif Hound desktop app.');
  }
  return readBytesTauri(path);
}