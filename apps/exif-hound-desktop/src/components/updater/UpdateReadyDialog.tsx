import React, { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { Button } from '../common/Button';
import { UpdateDialog } from './UpdateDialog';
import { UpdateInfo } from '../../services/updater';

interface Props {
  update: UpdateInfo;
  appName: string;
  /** True when the session holds unsaved work (e.g. loaded images). */
  hasUnsavedWork: boolean;
  onRestart: () => void;
  onLater: () => void;
}

/**
 * "Update ready" — the artifact is downloaded and its signature verified.
 * Restarting is always an explicit user choice, and if there is unsaved
 * work (loaded images live only in memory) the user gets one clear
 * confirmation before anything is closed.
 */
export const UpdateReadyDialog: React.FC<Props> = ({
  update,
  appName,
  hasUnsavedWork,
  onRestart,
  onLater,
}) => {
  const [confirmingUnsaved, setConfirmingUnsaved] = useState(false);

  if (confirmingUnsaved) {
    return (
      <UpdateDialog title="Unsaved work" onClose={() => setConfirmingUnsaved(false)}>
        <div className="space-y-4">
          <p className="text-app-white">
            You have unsaved work. Restarting now will close EXIF HOUND and any loaded
            images that have not been exported will be lost.
          </p>
          <p className="text-sm text-app-accent-dim">
            Export your data first if you want to keep it, or continue to update now.
          </p>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setConfirmingUnsaved(false)}>
              Go Back
            </Button>
            <Button variant="primary" onClick={onRestart}>
              Restart &amp; Update
            </Button>
          </div>
        </div>
      </UpdateDialog>
    );
  }

  return (
    <UpdateDialog title="Update Ready" onClose={onLater}>
      <div className="space-y-4">
        <p className="text-app-white">
          {appName} {update.version} has downloaded and passed its security verification.
        </p>
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" onClick={onLater}>
            Later
          </Button>
          <Button
            variant="primary"
            icon={<RefreshCw className="w-4 h-4" />}
            onClick={() => (hasUnsavedWork ? setConfirmingUnsaved(true) : onRestart())}
          >
            Restart &amp; Update
          </Button>
        </div>
      </div>
    </UpdateDialog>
  );
};