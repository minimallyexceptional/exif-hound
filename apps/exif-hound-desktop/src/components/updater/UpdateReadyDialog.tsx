import React from 'react';
import { Button } from '../common/Button';
import { UpdateDialog } from './UpdateDialog';

interface Props {
  onRestart: () => void;
  onCancel: () => void;
}

/**
 * Confirms restart when the session holds unsaved work (loaded images live
 * only in memory). Restarting is always an explicit user choice.
 */
export const UpdateReadyDialog: React.FC<Props> = ({ onRestart, onCancel }) => (
  <UpdateDialog title="Unsaved work" onClose={onCancel}>
    <div className="flex flex-col gap-4">
      <p className="text-app-white">
        You have unsaved work. Restarting now will close EXIF Hound and any loaded
        images that have not been exported will be lost.
      </p>
      <p className="text-sm text-app-accent-dim">
        Export your data first if you want to keep it, or continue to update now.
      </p>
      <div className="flex justify-end gap-3 pt-2">
        <Button variant="secondary" onClick={onCancel}>
          Go Back
        </Button>
        <Button variant="primary" onClick={onRestart}>
          Restart &amp; Update
        </Button>
      </div>
    </div>
  </UpdateDialog>
);
