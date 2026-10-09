import React, { useState } from 'react';
import { FolderOpen, AlertCircle } from 'lucide-react';
import { Modal } from './common/Modal';
import { Button } from './common/Button';
import { pickParentFolder } from '../services/investigationArchive/projectDialogs';

interface Props {
  onClose: () => void;
  /** Creates the project folder tree; resolves when the app has entered it. */
  onCreate: (parent: string, name: string) => Promise<void>;
}

/**
 * New-project flow: pick the parent folder, name the project. The store
 * creates `<parent>/<name>/` with `data/data.db` + `images/` before the app
 * enters it (openspec/changes/project-folders).
 */
export const ProjectCreateModal: React.FC<Props> = ({ onClose, onCreate }) => {
  const [name, setName] = useState('');
  const [parent, setParent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handlePickParent = async () => {
    setError(null);
    try {
      const picked = await pickParentFolder();
      if (picked) setParent(picked);
    } catch (e) {
      setError(
        typeof e === 'string' && e.trim()
          ? e
          : e instanceof Error
            ? e.message
            : 'Could not open the folder picker.'
      );
    }
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      setError('Please name the project.');
      return;
    }
    if (!parent) {
      setError('Please choose a parent folder.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await onCreate(parent, name.trim());
      // On success the app enters the project and this modal unmounts.
    } catch (e) {
      setBusy(false);
      // Tauri IPC rejects with plain strings (e.g. plugin-fs "forbidden
      // path: …" scope errors), not Error instances — surface their text
      // instead of swallowing it behind the generic fallback.
      setError(
        typeof e === 'string' && e.trim()
          ? e
          : e instanceof Error && e.message
            ? e.message
            : 'Failed to create the project folder.'
      );
    }
  };

  return (
    <Modal title="New investigation project" onClose={onClose} size="md">
      <div className="space-y-4">
        <div>
          <label
            htmlFor="project-name"
            className="block text-xs font-mono uppercase tracking-widest text-app-accent-dim mb-2"
          >
            Project name
          </label>
          <input
            id="project-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Beach Shoot Analysis"
            className="w-full px-3 py-2 rounded-lg text-sm"
            autoFocus
          />
        </div>

        <div>
          <span className="block text-xs font-mono uppercase tracking-widest text-app-accent-dim mb-2">
            Parent folder
          </span>
          {parent ? (
            <p className="text-sm text-app-white break-all font-mono text-xs bg-app-dark/60 border border-app-gray-light/30 rounded-lg px-3 py-2">
              {parent}
            </p>
          ) : (
            <Button
              variant="secondary"
              icon={<FolderOpen className="w-4 h-4" />}
              onClick={handlePickParent}
              fullWidth
            >
              Choose parent folder
            </Button>
          )}
        </div>

        {error && (
          <div
            className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 flex items-start gap-2 text-sm"
            role="alert"
          >
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div className="flex-1">{error}</div>
          </div>
        )}

        <p className="text-xs text-app-accent-dim">
          The project folder will contain an <span className="font-mono">images/</span> directory
          and a <span className="font-mono">data/data.db</span> database. Everything you do is
          written there as you work.
        </p>

        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleCreate}
            disabled={busy || !parent || !name.trim()}
          >
            {busy ? 'Creating…' : 'Create project'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ProjectCreateModal;
