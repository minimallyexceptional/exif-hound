/**
 * Dialogs for project folder operations (openspec/changes/project-folders).
 * Tauri-only: project folders need native directory creation, which the
 * browser FS Access fallback cannot provide.
 */
import { isTauriEnvironment } from '../../utils/fileSystem';
import { invoke } from '@tauri-apps/api/core';

export const NOT_TAURI_MESSAGE =
  'Project folders are only supported inside the Exif Hound desktop app.';

/**
 * Folder pickers grant the fs scope recursively (`recursive: true`). Without
 * it the dialog plugin calls allow_directory(picked, false), which only
 * permits the folder itself and its immediate children — deeper operations
 * like creating `<picked>/<name>/data/` then fail with "forbidden path".
 * The recursive grant allows `/picked/**` and covers the whole project tree.
 */
async function pickFolderTauri(title: string): Promise<string | null> {
  const { open } = await import('@tauri-apps/plugin-dialog');
  const picked = await open({
    directory: true,
    multiple: false,
    recursive: true,
    title,
  });
  return typeof picked === 'string' ? resolveProjectFolder(picked) : null;
}

/** Canonicalize a selected or recent folder and scope its complete tree. */
export async function resolveProjectFolder(path: string): Promise<string> {
  if (!isTauriEnvironment()) throw new Error(NOT_TAURI_MESSAGE);
  return invoke<string>('resolve_project_folder', { path });
}

/** Pick the parent folder for a new project. Null when cancelled. */
export async function pickParentFolder(): Promise<string | null> {
  if (!isTauriEnvironment()) throw new Error(NOT_TAURI_MESSAGE);
  return pickFolderTauri('Choose a parent folder for the new project');
}

/** Pick an existing project folder to open. Null when cancelled. */
export async function pickProjectFolder(): Promise<string | null> {
  if (!isTauriEnvironment()) throw new Error(NOT_TAURI_MESSAGE);
  return pickFolderTauri('Choose an existing project folder');
}
