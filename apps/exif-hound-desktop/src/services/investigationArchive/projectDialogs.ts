/**
 * Dialogs for project folder operations (openspec/changes/project-folders).
 * Tauri-only: project folders need native directory creation, which the
 * browser FS Access fallback cannot provide.
 */
import { isTauriEnvironment } from '../../utils/fileSystem';

export const NOT_TAURI_MESSAGE =
  'Project folders are only supported inside the Exif Hound desktop app.';

async function pickFolderTauri(title: string): Promise<string | null> {
  const { open } = await import('@tauri-apps/plugin-dialog');
  const picked = await open({
    directory: true,
    multiple: false,
    title,
  });
  return typeof picked === 'string' ? picked : null;
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