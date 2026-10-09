/**
 * RED regression: folder pickers must grant the fs scope RECURSIVELY.
 * The dialog plugin calls allow_directory(picked, options.recursive) — with
 * recursive=false it only allows the picked folder and its immediate
 * children, so creating `<picked>/<name>/data/` failed with "forbidden
 * path" (empty project folder + generic create failure).
 */
jest.mock('@tauri-apps/plugin-dialog', () => ({
  open: jest.fn(),
}));
jest.mock('@tauri-apps/api/core', () => ({ invoke: jest.fn() }));

import { open } from '@tauri-apps/plugin-dialog';
import { invoke } from '@tauri-apps/api/core';
import { pickParentFolder, pickProjectFolder } from '../projectDialogs';

beforeAll(() => {
  (window as unknown as { __TAURI_INTERNALS__: unknown }).__TAURI_INTERNALS__ = {};
});

beforeEach(() => {
  (open as jest.Mock).mockReset().mockResolvedValue('/home/user/Picked');
  (invoke as jest.Mock).mockReset().mockImplementation((_command, { path }) => Promise.resolve(path));
});

describe('project folder pickers', () => {
  it('pickParentFolder grants recursive fs scope', async () => {
    await expect(pickParentFolder()).resolves.toBe('/home/user/Picked');
    expect(open).toHaveBeenCalledWith(
      expect.objectContaining({ directory: true, recursive: true })
    );
    expect(invoke).toHaveBeenCalledWith('resolve_project_folder', { path: '/home/user/Picked' });
  });

  it('pickProjectFolder grants recursive fs scope', async () => {
    await expect(pickProjectFolder()).resolves.toBe('/home/user/Picked');
    expect(open).toHaveBeenCalledWith(
      expect.objectContaining({ directory: true, recursive: true })
    );
  });

  it('uses the native canonical path returned after a malformed Linux picker path', async () => {
    (open as jest.Mock).mockResolvedValue('/home/user\\Documents\\Investigations');
    (invoke as jest.Mock).mockResolvedValue('/home/user/Documents/Investigations');
    await expect(pickParentFolder()).resolves.toBe('/home/user/Documents/Investigations');
    expect(invoke).toHaveBeenCalledWith('resolve_project_folder', {
      path: '/home/user\\Documents\\Investigations',
    });
  });

  it('returns null when cancelled', async () => {
    (open as jest.Mock).mockResolvedValue(null);
    await expect(pickParentFolder()).resolves.toBeNull();
  });
});
